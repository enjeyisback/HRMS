import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
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
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes pattern
    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/employees") ||
        request.nextUrl.pathname.startsWith("/attendance") ||
        request.nextUrl.pathname.startsWith("/payroll") ||
        request.nextUrl.pathname.startsWith("/settings");

    const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/signup") ||
        request.nextUrl.pathname.startsWith("/forgot-password");

    // Redirect to login if accessing protected route without session
    if (isDashboardRoute && !user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to dashboard if accessing auth route with session
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check for "System Setup" requirement (if no employees exist)
    const isSetupPage = request.nextUrl.pathname === "/setup";
    const isPublicStatic = request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.startsWith("/api") ||
        request.nextUrl.pathname.includes(".");

    if (!isPublicStatic) {
        // IMPORTANT: Must use service role key here to bypass RLS.
        // The anon key + RLS returns count=0 even when employees exist,
        // because RLS policy requires auth.uid() = user_id.
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { count } = await supabaseAdmin
            .from('employees')
            .select('*', { count: 'exact', head: true });

        if (count === 0 && !isSetupPage) {
            return NextResponse.redirect(new URL("/setup", request.url));
        }

        if (count && count > 0 && isSetupPage) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // Role-based route protection for /admin
    if (request.nextUrl.pathname.startsWith("/admin") && user) {
        const { data: employee } = await supabase
            .from('employees')
            .select('app_roles(name)')
            .eq('user_id', user.id)
            .single();

        const roleName = (employee?.app_roles as any)?.name;

        // Only Super Admin and HR Admin can access /admin routes
        // (Managers can access specific ones, but for simplicity we block all /admin for others here)
        // In a more complex setup, we would check specific permission codes.
        if (roleName !== 'Super Admin' && roleName !== 'HR Admin') {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
