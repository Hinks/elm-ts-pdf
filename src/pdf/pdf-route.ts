import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { generatePdf } from "./pdf-pool.js";
import type { Todo } from "./pdf-worker.js";

// Type guard for request body
function isValidTodoRequest(body: unknown): body is { todos: Todo[] } {
    return (
        typeof body === "object" &&
        body !== null &&
        "todos" in body &&
        Array.isArray((body as { todos: unknown }).todos)
    );
}

/**
 * PDF generation route handler
 * POST /pdf
 * @param pdfsDir - Optional directory path to save PDF files
 */
export async function handlePdfRoute(
    req: Request,
    res: Response,
    pdfsDir?: string
): Promise<void> {
    try {
        // Validate request body
        if (!isValidTodoRequest(req.body)) {
            res.status(400).json({
                error: "Invalid request: 'todos' must be an array",
            });
            return;
        }

        const todos: Todo[] = req.body.todos;

        // Generate PDF using worker pool
        const pdf = await generatePdf({ todos });

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now
            .toISOString()
            .replace(/T/, "-")
            .replace(/:/g, "")
            .replace(/\..+/, "");
        const filename = `todos-${timestamp}.pdf`;

        // Save PDF to file if directory is provided
        if (pdfsDir) {
            const filepath = path.join(pdfsDir, filename);
            await fs.promises.writeFile(filepath, pdf);
        }

        // Return PDF file
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdf.length.toString());
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        res.send(pdf);
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({
            error: "Failed to generate PDF",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
