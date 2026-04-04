import 'server-only'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId }
})

export const getSession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  return await decrypt(cookie)
})
