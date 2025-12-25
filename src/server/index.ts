import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { generateTodoPdf, Todo } from "./pdf-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory (works from both src/server and dist/server)
const projectRoot = path.resolve(__dirname, "../..");
const staticDir = path.join(projectRoot, "dist", "static");
const pdfsDir = path.join(projectRoot, "pdfs");

// Ensure pdfs directory exists
if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
}

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Type guard for request body
function isValidTodoRequest(body: unknown): body is { todos: Todo[] } {
    return (
        typeof body === "object" &&
        body !== null &&
        "todos" in body &&
        Array.isArray((body as { todos: unknown }).todos)
    );
}

// Routes
// API route
app.get("/api", (_req: Request, res: Response): void => {
    res.json({ message: "hey from api" });
});

// PDF generation route
app.post("/pdf", async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        if (!isValidTodoRequest(req.body)) {
            res.status(400).json({
                error: "Invalid request: 'todos' must be an array",
            });
            return;
        }
        const todos: Todo[] = req.body.todos;

        // Generate PDF using service
        const pdf = await generateTodoPdf(todos);

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now
            .toISOString()
            .replace(/T/, "-")
            .replace(/:/g, "")
            .replace(/\..+/, "");
        const filename = `todos-${timestamp}.pdf`;
        const filepath = path.join(pdfsDir, filename);

        // Save PDF to file
        fs.writeFileSync(filepath, pdf);

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
});

// Serve static index.html at root
app.get("/", (_req: Request, res: Response): void => {
    res.sendFile(path.join(staticDir, "index.html"));
});

// Serve static assets
app.use("/assets", express.static(path.join(staticDir, "assets")));

// Start server
app.listen(PORT, (): void => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
