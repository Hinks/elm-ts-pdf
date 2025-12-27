import { Piscina } from "piscina";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import type { PdfWorkerPayload } from "./pdf-worker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve worker file path relative to this file
// In dev mode (tsx), use .ts extension; in production (compiled), use .js extension
// Check if we're running from src/ (dev) or dist/ (production)
const isDevMode = __dirname.includes("/src/");
const workerExtension = isDevMode ? ".ts" : ".js";
let workerPath = path.resolve(__dirname, `./pdf-worker${workerExtension}`);

// In dev mode, if .ts file doesn't exist, fall back to .js (in case it's compiled)
if (isDevMode && !fs.existsSync(workerPath)) {
    const jsPath = path.resolve(__dirname, "./pdf-worker.js");
    if (fs.existsSync(jsPath)) {
        workerPath = jsPath;
    }
}

// Create Piscina pool with concurrency limit (max 2 threads)
// In dev mode with TypeScript, configure Node.js to use tsx loader
const poolOptions = {
    filename: workerPath,
    maxThreads: 2,
    ...(isDevMode && workerPath.endsWith(".ts")
        ? { execArgv: ["--import", "tsx"] }
        : {}),
};

const pool = new Piscina<PdfWorkerPayload, Buffer>(poolOptions);

/**
 * Generates a PDF using the worker pool
 * @param payload - Payload containing todos array
 * @returns Promise resolving to PDF Buffer
 */
export async function generatePdf(payload: PdfWorkerPayload): Promise<Buffer> {
    try {
        const result = await pool.run(payload);
        return result;
    } catch (error) {
        // Re-throw with context
        throw new Error(
            `PDF generation failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
