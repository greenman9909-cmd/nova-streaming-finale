export interface SpeedTestResult {
    mbps: number;
    durationMs: number;
    bytes: number;
}

interface SpeedTestOptions {
    url?: string;
    timeoutMs?: number;
    minDurationMs?: number;
}

export async function runSpeedTest(options: SpeedTestOptions = {}): Promise<SpeedTestResult> {
    const url = options.url || `/speed-test.bin?ts=${Date.now()}`;
    const timeoutMs = options.timeoutMs ?? 8000;
    const minDurationMs = options.minDurationMs ?? 1000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const start = performance.now();
    try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) {
            throw new Error(`Speed test failed with status ${res.status}`);
        }
        const blob = await res.blob();
        const durationMs = performance.now() - start;
        if (durationMs < minDurationMs) {
            await new Promise((resolve) => setTimeout(resolve, minDurationMs - durationMs));
        }
        const bytes = blob.size;
        const effectiveDurationMs = Math.max(minDurationMs, durationMs);
        const mbps = bytes > 0 && effectiveDurationMs > 0
            ? (bytes * 8) / (effectiveDurationMs / 1000) / 1_000_000
            : 0;

        return { mbps, durationMs: effectiveDurationMs, bytes };
    } finally {
        clearTimeout(timeoutId);
    }
}
