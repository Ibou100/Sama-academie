import { NextResponse, type NextRequest } from "next/server";

// Le middleware passe les requêtes. 
// La vérification de la session se fait directement dans les composants React 
// pour éviter les conflits d'authentification LocalStorage / Cookies.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
