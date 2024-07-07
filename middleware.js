import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/libs/auth";

const AUTH_PAGES = ["/login"];

const isAuthPages = (url) => AUTH_PAGES.some((page) => page.startsWith(url));

export async function middleware(request) {
  const { url, nextUrl, cookies } = request;
  const { value: token } = cookies.get("token") ?? { value: null };

  const hasVerifiedToken = token && (await verifyJwtToken(token));
  const isAuthPageRequested = isAuthPages(nextUrl.pathname);

  if (isAuthPageRequested) { // If the page is an auth page
    if (!hasVerifiedToken) {
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
    // token control and redirect to home page if the user is already logged in
    const response = NextResponse.redirect(new URL(`/`, url));
    return response;
  }

  if (!hasVerifiedToken) { // If the page is protected page and the user is not logged in
    const searchParams = new URLSearchParams(nextUrl.searchParams);
    searchParams.set("next", nextUrl.pathname);
    // before the redirect to login page, you can send a message to the user requiring them to log in again etc.
    const response = NextResponse.redirect(
      new URL(`/login?${searchParams}`, url)
    );
    response.cookies.delete("token");

    return response;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/login", "/protected/:path*"] }; // Add the other protected pages here
