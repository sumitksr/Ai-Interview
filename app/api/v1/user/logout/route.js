import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logout successful" }, { status: 200 });
    
    response.cookies.set("token", "", {
      path: "/",
      httpOnly: true,
      maxAge: 0, 
    });
    
    response.cookies.set("isLoggedIn", "", {
      path: "/",
      maxAge: 0, 
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
