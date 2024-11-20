// app/lib/db-logger.ts
import { sql } from '@vercel/postgres';
import { NextRequest } from 'next/server';

export type RouteType = 'transcribe' | 'translate' | 'tts' | 'explain';

export async function logApiCall(
    routeName: RouteType,
    request: NextRequest,
    inputText?: string,
    outputText?: string
) {
    try {
        const hostInfo = request.headers.get('host') || 'unknown';

        await sql`
            INSERT INTO api_logs (route_name, host_info, input_text, output_text)
            VALUES (${routeName}, ${hostInfo}, ${inputText || null}, ${outputText || null})
        `;
    } catch (error) {
        // Log to console but don't throw - we don't want to affect the API response
        console.error('Failed to log API call:', error);
    }
}