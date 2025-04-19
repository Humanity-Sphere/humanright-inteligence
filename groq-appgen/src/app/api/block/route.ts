import { NextRequest, NextResponse } from "next/server";
import { blockIP } from "@/server/storage";

export async function GET(request: NextRequest) {
    const searchParams = new URL(request.url).searchParams;
    const ip = searchParams.get("ip");
    const token = searchParams.get("token");

    if (!ip || !token) {
        return new NextResponse("Missing ip or token parameter", { status: 400 });
    }

    try {
        await blockIP(ip, token);
        
        return new NextResponse(JSON.stringify({ success: true }), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Invalid token") {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        console.error("Error blocking IP:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
