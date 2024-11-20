// app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
// Configure the route segment
export const dynamic = 'force-dynamic'; // Make sure the route is always dynamic
export const runtime = 'nodejs';        // Use Node.js runtime for file handling
export const preferredRegion = 'auto';  // Let Vercel pick the best region

// Configure request body size limits for file upload
export async function POST() {
    try {
        return NextResponse.json({ result: 'Hello, World!' });
    } catch (error) {
        console.log('error', error)
        return NextResponse.json({ result: 'Goodbye, World!' });
    }
}