// Sample todo data
const sampleTodos = [
    { id: 1, text: "Complete project documentation", completed: true },
    { id: 2, text: "Review code changes", completed: false },
    { id: 3, text: "Write unit tests", completed: false },
    { id: 4, text: "Deploy to staging", completed: true },
    { id: 5, text: "Fix bug in PDF generation", completed: false },
];

const SERVER_URL = process.env["SERVER_URL"] || "http://localhost:3000";
const PDF_ENDPOINT = `${SERVER_URL}/pdf`;

/**
 * Sends a PDF generation request to the server
 */
async function generatePdf(requestNumber: number): Promise<void> {
    const startTime = Date.now();
    console.log(`[Request ${requestNumber}] Starting PDF generation...`);

    try {
        const response = await fetch(PDF_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ todos: sampleTodos }),
        });

        if (!response.ok) {
            throw new Error(
                `HTTP error! status: ${response.status} - ${response.statusText}`
            );
        }

        // Read the PDF response (but don't save it)
        await response.arrayBuffer();
        const duration = Date.now() - startTime;

        console.log(`[Request ${requestNumber}] ✓ Completed in ${duration}ms`);
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
            `[Request ${requestNumber}] ✗ Failed after ${duration}ms:`,
            error instanceof Error ? error.message : String(error)
        );
        throw error;
    }
}

/**
 * Main function - sends 10 PDF generation requests sequentially
 */
async function main(): Promise<void> {
    console.log(`Sending 10 PDF generation requests to ${PDF_ENDPOINT}`);
    console.log("Requests will be sent one after another (sequentially)\n");

    const overallStartTime = Date.now();

    for (let i = 1; i <= 10; i++) {
        await generatePdf(i);
    }

    const overallDuration = Date.now() - overallStartTime;
    console.log(`\n✓ All 10 requests completed in ${overallDuration}ms`);
    console.log(
        `Average time per request: ${(overallDuration / 10).toFixed(0)}ms`
    );
}

// Run the script
main().catch((error: unknown): void => {
    console.error("Script failed:", error);
    process.exit(1);
});
