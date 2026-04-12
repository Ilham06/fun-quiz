import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PERMISSIONS = [
  { name: 'manage_users', label: 'Kelola Pengguna', group: 'Pengguna' },
  { name: 'manage_roles', label: 'Kelola Role', group: 'Pengguna' },
  { name: 'view_all_sessions', label: 'Lihat Semua Sesi', group: 'Sesi' },
  { name: 'manage_all_sessions', label: 'Kelola Semua Sesi', group: 'Sesi' },
  { name: 'create_session', label: 'Buat Sesi', group: 'Sesi' },
  { name: 'view_own_sessions', label: 'Lihat Sesi Sendiri', group: 'Sesi' },
  { name: 'manage_own_sessions', label: 'Kelola Sesi Sendiri', group: 'Sesi' },
  { name: 'manage_questions', label: 'Kelola Soal', group: 'Konten' },
  { name: 'view_answers', label: 'Lihat Jawaban', group: 'Konten' },
  { name: 'export_data', label: 'Export Data', group: 'Konten' },
]

async function main() {
  const permMap = {}
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { label: p.label, group: p.group },
      create: p,
    })
    permMap[p.name] = perm.id
  }

  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: { label: 'Super Admin', is_system: true },
    create: { name: 'SUPERADMIN', label: 'Super Admin', is_system: true },
  })

  for (const permId of Object.values(permMap)) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: superadminRole.id, permission_id: permId } },
      update: {},
      create: { role_id: superadminRole.id, permission_id: permId },
    })
  }

  const teacherRole = await prisma.role.upsert({
    where: { name: 'TEACHER' },
    update: { label: 'Pengajar', is_system: true },
    create: { name: 'TEACHER', label: 'Pengajar', is_system: true },
  })

  const teacherPerms = [
    'create_session', 'view_own_sessions', 'manage_own_sessions',
    'manage_questions', 'view_answers', 'export_data',
  ]
  for (const pName of teacherPerms) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: teacherRole.id, permission_id: permMap[pName] } },
      update: {},
      create: { role_id: teacherRole.id, permission_id: permMap[pName] },
    })
  }

  const username = process.env.SUPERADMIN_USERNAME || 'admin'
  const password = process.env.SUPERADMIN_PASSWORD || 'admin123'
  const hash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { username },
    update: { role_id: superadminRole.id },
    create: {
      username,
      password: hash,
      name: 'Super Admin',
      role_id: superadminRole.id,
    },
  })

  console.log('Seed complete: permissions, roles, superadmin user')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
