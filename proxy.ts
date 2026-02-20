import { url } from "inspector";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export async function proxy(req:NextRequest){
   const {pathname}=req.nextUrl
   const PublicRoutes=["/Login","/register","/api/auth"]
   if(PublicRoutes.some((path)=>pathname.startsWith(path))){
    return NextResponse.next();
   }
   const token= await getToken({req,secret:process.env.AUTH_SECRET})
   console.log(token)
   if(!token){
    const loginUrl=new URL("/Login",req.url);
    loginUrl.searchParams.set("callbackUrl",req.url)
    return NextResponse.redirect(loginUrl);
    console.log(loginUrl)   
}
const role=token.role
if (role === "user") {
  if (!pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

if (role === "deliveryBoy") {
  if (!pathname.startsWith("/delivery")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

if (role === "admin") {
  if (!pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

return NextResponse.next()
}
export const config = {
  matcher: [
    "/user/:path*",
    "/admin/:path*",
    "/delivery/:path*",
  ],
};

    
