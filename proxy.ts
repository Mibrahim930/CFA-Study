import { NextResponse, type NextRequest } from "next/server";

/**
 * Private-app guard for deployments: when APP_PASSWORD is set (e.g. in Vercel's environment variables),
 * every page needs HTTP Basic auth (any username, that password). Unset locally, so `npm run dev` is open.
 * A simple gate for a one-person app; real accounts come with the Supabase sync milestone.
 */
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    // Fail closed on a host: a forgotten variable must not publish the app.
    const deployed = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.VERCEL);
    return deployed ? new NextResponse("Set APP_PASSWORD in the host's variables, then redeploy.", { status: 503 }) : NextResponse.next();
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="L1 Study", charset="UTF-8"' },
  });
}

export const config = {
  // Static assets, the icon and the install manifest stay reachable so the phone can install the app.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
