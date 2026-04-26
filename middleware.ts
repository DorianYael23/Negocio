import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // NUEVO: Si es el manifest o un icono, déjalo pasar siempre
  if (url === '/manifest.json' || url.endsWith('.png') || url.endsWith('.svg')) {
    return NextResponse.next();
  }
  const hasSession = request.cookies.has('auth-session');

  // 1. Si intenta ir a login, lo dejamos pasar si no tiene sesión
  if (url.startsWith('/login')) {
    if (hasSession) return NextResponse.redirect(new URL('/clientes', request.url));
    return NextResponse.next();
  }

  // 2. Si NO tiene sesión, lo mandamos al login de inmediato
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. RUTAS BLOQUEADAS (El bug estaba aquí)
  // Si intenta entrar a productos, tienda o inventario, LO PATEAMOS a clientes
  const rutasBloqueadas = ['/productos', '/tienda', '/inventario'];
  if (rutasBloqueadas.some(ruta => url.startsWith(ruta))) {
    return NextResponse.redirect(new URL('/clientes', request.url)); // <-- REDIRECT, NO NEXT
  }

  // 4. Si entra a la raíz "/", lo mandamos a clientes
  if (url === '/') {
    return NextResponse.redirect(new URL('/clientes', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.svg$).*)',
  ],
}