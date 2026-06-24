import { NextRequest, NextResponse } from 'next/server'

const publicPaths = ['/', '/login']

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = !publicPaths.includes(pathname)
  const isPublic = publicPaths.includes(pathname)
  const loggedIn = req.cookies.get('logged-in')?.value

  if (isProtected && !loggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isPublic && loggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
