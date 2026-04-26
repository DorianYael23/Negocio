import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 👉 Agregamos "default" para que Next.js no tenga forma de quejarse
export default function proxy(request: NextRequest) {
  const url = request.nextUrl.pathname;

  const rutasBloqueadas = ['/productos', '/tienda', '/inventario'];
  const intentaEntrarARutaBloqueada = rutasBloqueadas.some(ruta => url.startsWith(ruta));

  if (intentaEntrarARutaBloqueada || url === '/') {
    return NextResponse.redirect(new URL('/clientes', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/productos/:path*',
    '/tienda/:path*',
    '/inventario/:path*'
  ],
}