import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set(name, value, options as any);
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set(name, "", options as any);
        },
      },
    }
  );

  // Refresh auth session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = requestUrl.pathname;

  // Protected routes - require authentication
  const protectedRoutes = ["/customer", "/provider", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  // Role-based access
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("user_id", user.id)
      .single();

    if (profile?.is_suspended) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/customer") && profile?.role !== "customer") {
      return NextResponse.redirect(new URL("/provider/dashboard", request.url));
    }

    if (pathname.startsWith("/provider") && profile?.role !== "provider") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }

    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
