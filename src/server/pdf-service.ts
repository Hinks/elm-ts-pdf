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
    const chartConfig = {
        type: "line" as const,
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
                {
                    label: "Completed Todos",
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: "rgb(75, 192, 192)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    tension: 0.1,
                    fill: true,
                },
                {
                    label: "Pending Todos",
                    data: [8, 12, 10, 15, 18, 20],
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
                        duration: 0, // Disable transitions
                    },
                },
            },
            interaction: {
                intersect: false, // No user interaction
                mode: "nearest" as const,
            },
            devicePixelRatio: resolutionMultiplier, // Higher DPR for sharper rendering
            plugins: {
                title: {
                    display: true,
                    text: "Todo Completion Trends",
                    font: {
                        size: 40, // Double size title font
                    },
                },
                legend: {
                    display: true,
                    position: "top" as const,
                    labels: {
                        font: {
                            size: 28, // Double size legend font
                        },
                    },
                },
                tooltip: {
                    enabled: false, // No tooltips needed for static image
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 28, // Double size font for Y-axis values
                        },
                    },
                    title: {
                        display: true,
                        text: "Number of Todos",
                        font: {
                            size: 32, // Double size font for Y-axis title
                        },
                    },
                },
                x: {
                    ticks: {
                        font: {
                            size: 28, // Double size font for X-axis values
                        },
                    },
                    title: {
                        display: true,
                        text: "Month",
                        font: {
                            size: 32, // Double size font for X-axis title
                        },
                    },
                },
            },
        },
    };

    // Create Chart.js instance
    // Note: skia-canvas context is compatible with Chart.js but TypeScript types don't match exactly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = new Chart(ctx as any, chartConfig);

    // Wait for chart to render (Chart.js needs time to draw)
    await new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 200);
    });

    // Convert canvas to base64 data URL
    // PNG export uses best quality by default in skia-canvas
    const pngBuffer = await canvas.toBuffer("png");
    const base64Image = pngBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Clean up
    chart.destroy();

    return dataUrl;
}

export async function generateTodoPdf(todos: Todo[]): Promise<Uint8Array> {
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

    return pdf;
}
