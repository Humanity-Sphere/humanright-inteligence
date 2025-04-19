import { NextRequest, NextResponse } from "next/server";
import { getFromStorageWithRegex, getStorageKey } from "@/server/storage";
import { ROOT_URL } from "@/utils/config";

export async function POST(request: NextRequest) {
    const { sessionId, version, rootUrl = ROOT_URL, appUrl } = await request.json();
    try {
        // Get the app data to find the creator's IP
        const key = getStorageKey(sessionId, version);
        const { value: appDataStr } = await getFromStorageWithRegex(key);
        
        if (!appDataStr) {
            return NextResponse.json(
                { error: "App not found" },
                { status: 404 }
            );
        }

        const appData = JSON.parse(appDataStr);
        const creatorIP = appData.creatorIP;

        if (!creatorIP) {
            return NextResponse.json(
                { error: "Creator IP not found" },
                { status: 404 }
            );
        }

        // Generate the ban URL
        const banUrl = `${rootUrl}/block?ip=${encodeURIComponent(creatorIP)}&token=${encodeURIComponent(process.env.BLOCK_SECRET || "")}`;

        // Send to Slack
        const slackWebhookUrl = process.env.SLACK_WEBHOOK;
        if (slackWebhookUrl) {

            await fetch(slackWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ban_url: banUrl,
                  app_url: appUrl
                }),
            });
        }

        return NextResponse.json({ success: true, banUrl });
    } catch (error) {
        console.error("Error processing report:", error);
        return NextResponse.json(
            { error: "Failed to process report" },
            { status: 500 }
        );
    }
}
