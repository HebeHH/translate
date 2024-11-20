// app/lib/logging.ts
export function logDebug(...args: any[]) {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('[DEBUG]', ...args);
    }
}

export function logError(...args: any[]) {
    console.error('[ERROR]', ...args);
}

export function logRequest(req: Request, prefix: string = '') {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log(`[${prefix}] Request:`, {
            url: req.url,
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
            // Don't log body as it might contain sensitive data
        });
    }
}