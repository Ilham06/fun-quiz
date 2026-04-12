import 'server-only'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import prisma from '@/lib/prisma'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId, roleId: session.roleId }
})

export const getSession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  return await decrypt(cookie)
})

export const getPermissions = cache(async () => {
  const session = await verifySession()
  const role = await prisma.role.findUnique({
    where: { id: session.roleId },
    include: { permissions: { include: { permission: true } } },
  })
  if (!role) return []
  return role.permissions.map((rp) => rp.permission.name)
})

export async function requirePermission(...perms) {
  const userPerms = await getPermissions()
  if (!perms.some((p) => userPerms.includes(p))) {
    redirect('/dashboard')
  }
  return userPerms
}
