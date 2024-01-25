
export {default} from 'next-auth/middleware'

// import { NextResponse } from 'next/server'
 
// export function middleware(request) {
//   if (request.nextUrl.pathname.startsWith('/dashboard')) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }
// }

export const config = { matcher: ["/dashboard/:path*"] }
