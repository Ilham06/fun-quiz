import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/dashboard']

export async function proxy(request) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
