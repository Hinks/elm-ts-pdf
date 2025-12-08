import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { generate } from "@pdfme/generator";
import { Template } from "@pdfme/common";
import { text, table } from "@pdfme/schemas";

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

// Types
interface Todo {
    id: number;
    text: string;
    completed: boolean;
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
        const todos: Todo[] = req.body.todos;
        if (!Array.isArray(todos)) {
            res.status(400).json({
                error: "Invalid request: 'todos' must be an array",
            });
            return;
        }

        // Format table data
        const tableData: string[][] = todos.map((todo) => {
            return [
                todo.id.toString(),
                todo.text,
                todo.completed ? "Done" : "Pending",
            ];
        });

        // Create template
        const template: Template = {
            basePdf: {
                width: 210,
                height: 297,
                padding: [10, 10, 10, 10],
            },
            schemas: [
                [
                    {
                        name: "title",
                        type: "text",
                        position: { x: 20, y: 20 },
                        width: 170,
                        height: 15,
                        fontSize: 20,
                        fontName: "Helvetica",
                        alignment: "center",
                        verticalAlignment: "middle",
                    },
                    {
                        name: "todoTable",
                        type: "table",
                        position: { x: 20, y: 45 },
                        width: 170,
                        height: 220,
                        head: ["ID", "Todo Item", "Status"],
                        headWidthPercentages: [12, 59, 29],
                        tableStyles: {
                            borderColor: "#000000",
                            borderWidth: 1,
                        },
                        headStyles: {
                            fontName: "Helvetica",
                            fontSize: 12,
                            fontColor: "#ffffff",
                            backgroundColor: "#2c3e50",
                            alignment: "center",
                            verticalAlignment: "middle",
                            lineHeight: 1.2,
                            characterSpacing: 0,
                            borderColor: "#000000",
                            borderWidth: {
                                top: 1,
                                right: 1,
                                bottom: 1,
                                left: 1,
                            },
                            padding: { top: 5, right: 5, bottom: 5, left: 5 },
                        },
                        bodyStyles: {
                            fontName: "Helvetica",
                            fontSize: 10,
                            fontColor: "#000000",
                            backgroundColor: "#ffffff",
                            alignment: "left",
                            verticalAlignment: "middle",
                            lineHeight: 1.2,
                            characterSpacing: 0,
                            borderColor: "#000000",
                            borderWidth: {
                                top: 1,
                                right: 1,
                                bottom: 1,
                                left: 1,
                            },
                            padding: { top: 5, right: 5, bottom: 5, left: 5 },
                            alternateBackgroundColor: "#f5f5f5",
                        },
                        columnStyles: {
                            alignment: {
                                0: "center",
                                1: "left",
                                2: "center",
                            },
                        },
                        showHead: true,
                    },
                ],
            ],
        };

        // Generate PDF
        const pdf = await generate({
            template,
            inputs: [
                {
                    title: "Todo List",
                    todoTable: JSON.stringify(tableData),
                },
            ],
            plugins: {
                text,
                table,
            },
        });

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
