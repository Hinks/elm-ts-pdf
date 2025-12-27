import { generate } from "@pdfme/generator";
import { text, table, image } from "@pdfme/schemas";
import { mm2pt, pt2px } from "@pdfme/common";
import { todoListTemplate } from "./pdf-template.js";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Canvas } from "skia-canvas";

export type Todo = {
    id: number;
    text: string;
    completed: boolean;
};

export type PdfWorkerPayload = {
    todos: Todo[];
};

/**
 * Generates a line chart image using Chart.js and skia-canvas
 * @returns Base64 data URL of the chart image
 */
async function generateChartImage(): Promise<string> {
    // Register Chart.js components
    Chart.register(
        LineController,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Title,
        Tooltip,
        Legend,
        Filler
    );

    // Create canvas with skia-canvas
    // Get PDF dimensions from template (chart area: 210mm width, 80mm height)
    // Convert mm to points, then to pixels for canvas
    const chartWidthMm = 210; // Full PDF width
    const chartHeightMm = 80; // Chart height from template

    const chartWidthPt = mm2pt(chartWidthMm);
    const chartHeightPt = mm2pt(chartHeightMm);

    // Convert points to pixels (at 96 DPI, 1 point = 1.333 pixels)
    const baseWidthPx = Math.round(pt2px(chartWidthPt));
    const baseHeightPx = Math.round(pt2px(chartHeightPt));

    // Use a higher resolution multiplier for better image quality (2x for retina, 3x for extra sharp)
    // This creates a larger canvas that will be scaled down when embedded, resulting in sharper images
    const resolutionMultiplier = 2;
    const chartWidthPx = baseWidthPx * resolutionMultiplier;
    const chartHeightPx = baseHeightPx * resolutionMultiplier;

    const canvas = new Canvas(chartWidthPx, chartHeightPx);
    const ctx = canvas.getContext("2d");

    // Scale the context DOWN so Chart.js renders at the correct visual size
    // but with higher pixel density for sharper output
    ctx.scale(resolutionMultiplier, resolutionMultiplier);

    // Hard-coded chart data
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const chartConfig = {
        type: "line" as const,
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Completed Todos",
                    data: [1200, 1900, 2500, 3200, 4100, 5500],
                    borderColor: "rgb(75, 192, 192)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    tension: 0.1,
                    fill: true,
                },
                {
                    label: "Pending Todos",
                    data: [800, 1200, 1500, 1800, 2200, 2800],
                    borderColor: "rgb(255, 99, 132)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    tension: 0.1,
                    fill: true,
                },
            ],
        },
        options: {
            // Server-side rendering optimizations
            responsive: false, // Fixed canvas size, no need for responsive behavior
            maintainAspectRatio: false, // Fixed dimensions
            animation: false as const, // No animations needed for static image
            transitions: {
                active: {
                    animation: {
                        duration: 0,
                    },
                },
            },
            interaction: {
                intersect: false,
                mode: "nearest" as const,
            },
            devicePixelRatio: resolutionMultiplier, // Higher DPR for sharper rendering
            plugins: {
                title: {
                    display: true,
                    text: "Todo Completion Trends",
                    font: {
                        size: 40,
                    },
                },
                legend: {
                    display: true,
                    position: "top" as const,
                    labels: {
                        font: {
                            size: 28,
                        },
                    },
                },
                tooltip: {
                    enabled: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 28,
                        },
                        callback: function (value: number | string): string {
                            const numValue =
                                typeof value === "string"
                                    ? parseFloat(value)
                                    : value;

                            if (numValue >= 1000000) {
                                return (numValue / 1000000).toFixed(1) + "M";
                            } else if (numValue >= 1000) {
                                return (numValue / 1000).toFixed(1) + "k";
                            } else {
                                return numValue.toString();
                            }
                        },
                    },
                    title: {
                        display: true,
                        text: "Number of Todos",
                        font: {
                            size: 32,
                        },
                    },
                },
                x: {
                    ticks: {
                        font: {
                            size: 28,
                        },
                        callback: function (value: string | number): string {
                            const index =
                                typeof value === "number"
                                    ? value
                                    : parseInt(value);
                            const label = labels[index] || String(value);
                            const currentYear = new Date()
                                .getFullYear()
                                .toString()
                                .slice(-2);
                            return label + " " + currentYear;
                        },
                    },
                    title: {
                        display: true,
                        text: "Month",
                        font: {
                            size: 32,
                        },
                    },
                },
            },
        },
    };

    const chart = new Chart(ctx, chartConfig);

    // Convert canvas to base64 data URL
    // PNG export uses best quality by default in skia-canvas
    const pngBuffer = await canvas.toBuffer("png");
    const base64Image = pngBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Clean up
    chart.destroy();

    return dataUrl;
}

/**
 * Piscina worker function - generates PDF from todos
 * Must be exported as default async function for Piscina compatibility
 */
export default async function generatePdfWorker(
    payload: PdfWorkerPayload
): Promise<Buffer> {
    const { todos } = payload;

    // Format table data
    const tableData: string[][] = todos.map((todo: Todo): string[] => {
        return [
            todo.id.toString(),
            todo.text,
            todo.completed ? "Done" : "Pending",
        ];
    });

    // Generate chart image
    const chartImage = await generateChartImage();

    // Generate PDF
    const pdf = await generate({
        template: todoListTemplate,
        inputs: [
            {
                title: "Todo List",
                todoTable: JSON.stringify(tableData),
                todoChart: chartImage,
            },
        ],
        plugins: {
            text,
            table,
            image,
        },
    });

    // Convert Uint8Array to Buffer for return
    return Buffer.from(pdf);
}
