# PDF Generation with pdfme, skia-canvas, and Chart.js

This document provides a comprehensive explanation of how PDF generation works in this project, using **pdfme**, **skia-canvas**, and **Chart.js** to create dynamic, data-driven PDF documents.

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Dependencies](#architecture--dependencies)
3. [Template Definition](#template-definition)
4. [Chart Generation Process](#chart-generation-process)
5. [PDF Generation Process](#pdf-generation-process)
6. [Data Flow](#data-flow)
7. [Technical Details](#technical-details)
8. [Code Walkthrough](#code-walkthrough)

---

## Overview

The PDF generation system creates a formatted PDF document containing:
- A **title** (text field)
- A **table** of todo items with columns: ID, Todo Item, Status
- A **line chart** showing todo completion trends over time

The system uses:
- **pdfme** (`@pdfme/generator`, `@pdfme/common`, `@pdfme/schemas`) - For PDF template definition and generation
- **skia-canvas** - For server-side canvas rendering (required for Chart.js in Node.js)
- **Chart.js** - For generating the line chart visualization

---

## Architecture & Dependencies

### Core Libraries

#### 1. **pdfme** (`@pdfme/generator`, `@pdfme/common`, `@pdfme/schemas`)
- **Purpose**: PDF template-based generation library
- **Key Features**:
  - Template-based PDF generation (define layout once, fill with data)
  - Support for multiple field types: text, table, image, etc.
  - Coordinate system in millimeters (mm) for precise positioning
  - Plugin-based architecture for extensibility

#### 2. **skia-canvas** (`skia-canvas`)
- **Purpose**: Server-side canvas implementation using Skia graphics library
- **Why it's needed**: Chart.js requires a Canvas API to render charts. In Node.js, there's no native `canvas` element like in browsers. skia-canvas provides a Node.js-compatible Canvas implementation.
- **Key Features**:
  - High-quality rendering
  - PNG/JPEG export capabilities
  - Supports all standard Canvas 2D API methods

#### 3. **Chart.js** (`chart.js`)
- **Purpose**: JavaScript charting library
- **Usage**: Generates line charts showing todo completion trends
- **Key Features**:
  - Rich chart customization options
  - Server-side rendering support (when combined with skia-canvas)
  - Responsive and configurable

---

## Template Definition

The PDF template is defined in `pdf-template.ts` using pdfme's `Template` type. The template specifies:

### Base PDF Configuration

```typescript
basePdf: {
    width: 210,    // A4 width in mm
    height: 297,   // A4 height in mm
    padding: [10, 10, 10, 10],  // [top, right, bottom, left] padding in mm
}
```

- **Dimensions**: A4 paper size (210mm × 297mm)
- **Padding**: 10mm padding on all sides

### Schema Fields

The template defines three fields arranged on the page:

#### 1. Title Field (Text)
```typescript
{
    name: "title",
    type: "text",
    position: { x: 20, y: 20 },  // Position from top-left corner in mm
    width: 170,
    height: 15,
    fontSize: 20,
    fontName: "Helvetica",
    alignment: "center",
    verticalAlignment: "middle",
}
```

- **Position**: 20mm from left, 20mm from top
- **Size**: 170mm wide × 15mm tall
- **Styling**: 20pt Helvetica font, centered

#### 2. Todo Table Field (Table)
```typescript
{
    name: "todoTable",
    type: "table",
    position: { x: 20, y: 45 },
    width: 170,
    height: 150,
    head: ["ID", "Todo Item", "Status"],
    headWidthPercentages: [12, 59, 29],
    // ... styling configurations
}
```

- **Position**: 20mm from left, 45mm from top
- **Size**: 170mm wide × 150mm tall
- **Columns**: 3 columns with specified width percentages
- **Styling**: 
  - Header: White text on dark background (#2c3e50)
  - Body: Black text on white background, with alternating row colors (#f5f5f5)
  - Borders: 1px black borders

#### 3. Chart Image Field (Image)
```typescript
{
    name: "todoChart",
    type: "image",
    position: { x: 0, y: 205 },
    width: 210,
    height: 80,
}
```

- **Position**: 0mm from left (full width), 205mm from top
- **Size**: 210mm wide (full page width) × 80mm tall
- **Content**: Will be filled with a base64-encoded PNG image

---

## Chart Generation Process

The chart generation happens in the `generateChartImage()` function. Here's the detailed process:

### Step 1: Register Chart.js Components

```typescript
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
```

Chart.js uses a modular architecture. We register only the components needed for a line chart to reduce bundle size.

### Step 2: Calculate Canvas Dimensions

The chart needs to match the PDF template dimensions. The process involves unit conversions:

1. **Get PDF dimensions** (from template):
   - Width: 210mm (full PDF width)
   - Height: 80mm (chart height from template)

2. **Convert mm to points** (PDF standard unit):
   ```typescript
   const chartWidthPt = mm2pt(210);   // 210mm → ~595.28pt
   const chartHeightPt = mm2pt(80);   // 80mm → ~226.77pt
   ```

3. **Convert points to pixels** (for canvas):
   ```typescript
   const baseWidthPx = Math.round(pt2px(chartWidthPt));   // ~794px at 96 DPI
   const baseHeightPx = Math.round(pt2px(chartHeightPt)); // ~302px at 96 DPI
   ```

4. **Apply resolution multiplier** (for higher quality):
   ```typescript
   const resolutionMultiplier = 2;  // 2x for retina-quality
   const chartWidthPx = baseWidthPx * resolutionMultiplier;   // ~1588px
   const chartHeightPx = baseHeightPx * resolutionMultiplier; // ~604px
   ```

   **Why?** Creating a larger canvas and scaling it down when embedded results in sharper images in the PDF.

### Step 3: Create Canvas with skia-canvas

```typescript
const canvas = new Canvas(chartWidthPx, chartHeightPx);
const ctx = canvas.getContext("2d");
```

This creates a server-side canvas that Chart.js can render to.

### Step 4: Scale Context for Visual Size

```typescript
ctx.scale(resolutionMultiplier, resolutionMultiplier);
```

This scales the drawing context DOWN so Chart.js renders at the correct visual size (794×302px) but with higher pixel density (1588×604px actual canvas).

### Step 5: Configure Chart.js

The chart configuration includes:

- **Data**: Two datasets (Completed Todos, Pending Todos) with 6 months of data
- **Type**: Line chart with filled area
- **Optimizations for server-side rendering**:
  - `responsive: false` - Fixed size, no responsive behavior
  - `maintainAspectRatio: false` - Use exact dimensions
  - `animation: false` - No animations needed for static image
  - `devicePixelRatio: 2` - Higher DPR for sharper rendering

- **Styling**:
  - Large font sizes (28-40pt) for readability in PDF
  - Custom tick formatters (e.g., "1.2k" instead of "1200")
  - Title and axis labels

### Step 6: Render Chart

```typescript
const chart = new Chart(ctx, chartConfig);
```

Chart.js renders the chart to the canvas context.

### Step 7: Export to Base64 Data URL

```typescript
const pngBuffer = await canvas.toBuffer("png");
const base64Image = pngBuffer.toString("base64");
const dataUrl = `data:image/png;base64,${base64Image}`;
```

1. Convert canvas to PNG buffer (skia-canvas handles this)
2. Encode buffer as base64 string
3. Create data URL format that pdfme can use

### Step 8: Cleanup

```typescript
chart.destroy();
```

Clean up Chart.js resources.

---

## PDF Generation Process

The PDF generation happens in the `generatePdfWorker()` function (or equivalent when moved to Lambda).

### Step 1: Format Table Data

```typescript
const tableData: string[][] = todos.map((todo: Todo): string[] => {
    return [
        todo.id.toString(),
        todo.text,
        todo.completed ? "Done" : "Pending",
    ];
});
```

Convert the todo array into a 2D array format that pdfme's table schema expects:
- Each row is an array of strings
- The table schema will automatically handle headers, borders, and styling

### Step 2: Generate Chart Image

```typescript
const chartImage = await generateChartImage();
```

Call the chart generation function to get a base64 data URL of the chart.

### Step 3: Generate PDF with pdfme

```typescript
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
```

**Parameters**:
- **`template`**: The template definition (from `pdf-template.ts`)
- **`inputs`**: Array of data objects (one per page). Each object maps field names to values:
  - `title`: String value for the text field
  - `todoTable`: JSON stringified 2D array for the table
  - `todoChart`: Base64 data URL for the image field
- **`plugins`**: Schema plugins that handle rendering of each field type:
  - `text`: Renders text fields
  - `table`: Renders table fields
  - `image`: Renders image fields

**How pdfme works**:
1. Takes the template (layout definition)
2. For each field in the template, looks up the corresponding value in the input object
3. Uses the appropriate plugin to render the field at the specified position
4. Combines all fields into a single PDF document
5. Returns a `Uint8Array` containing the PDF bytes

### Step 4: Convert to Buffer

```typescript
return Buffer.from(pdf);
```

Convert the `Uint8Array` to a Node.js `Buffer` for easier handling (file writing, HTTP responses, etc.).

---

## Data Flow

Here's the complete data flow from input to PDF:

```
1. Input: { todos: Todo[] }
   ↓
2. Format todos into table data: string[][]
   ↓
3. Generate chart image:
   - Create skia-canvas Canvas
   - Render Chart.js line chart to canvas
   - Export canvas to PNG buffer
   - Encode as base64 data URL
   ↓
4. Prepare pdfme inputs:
   {
     title: "Todo List",
     todoTable: JSON.stringify(tableData),
     todoChart: base64DataUrl
   }
   ↓
5. pdfme.generate():
   - Load template
   - For each field:
     * text field → text plugin → renders text
     * table field → table plugin → renders table from JSON
     * image field → image plugin → decodes base64, embeds PNG
   - Combine all fields into PDF
   - Return Uint8Array
   ↓
6. Convert to Buffer
   ↓
7. Output: PDF Buffer (ready for file save or HTTP response)
```

---

## Technical Details

### Coordinate System

pdfme uses **millimeters (mm)** as its coordinate system:
- Origin (0, 0) is at the **top-left** corner
- X increases to the right
- Y increases downward
- A4 page: 210mm × 297mm

### Unit Conversions

The system uses several unit conversions:

1. **mm → pt (points)**: 
   - 1mm = 2.83465pt (approximately)
   - Used internally by PDF format

2. **pt → px (pixels)**:
   - Depends on DPI (dots per inch)
   - At 96 DPI: 1pt ≈ 1.333px
   - At 72 DPI: 1pt = 1px

3. **Resolution Multiplier**:
   - Creates canvas at 2x resolution
   - Scales context down for correct visual size
   - Results in sharper images when embedded

### Image Quality Considerations

- **Resolution**: Using 2x multiplier creates a 1588×604px canvas for a 794×302px visual size
- **Format**: PNG is used for lossless quality (important for charts with text)
- **Embedding**: Base64 data URL allows embedding directly in PDF without external files

### Table Data Format

pdfme's table schema expects:
- **Input**: JSON stringified 2D array: `string[][]`
- **Headers**: Defined in template (`head: ["ID", "Todo Item", "Status"]`)
- **Styling**: Configured in template (colors, borders, fonts, padding)
- **Column widths**: Specified as percentages (`headWidthPercentages: [12, 59, 29]`)

### Chart.js Server-Side Rendering

Key configurations for server-side rendering:
- **`responsive: false`**: Prevents Chart.js from trying to resize canvas
- **`maintainAspectRatio: false`**: Uses exact dimensions
- **`animation: false`**: Skips animations (not needed for static image)
- **`devicePixelRatio: 2`**: Matches the resolution multiplier for sharp rendering
- **Font sizes**: Larger than typical web charts (28-40pt) for PDF readability

---

## Code Walkthrough

### Main Generation Function

```typescript
export default async function generatePdfWorker(
    payload: PdfWorkerPayload
): Promise<Buffer> {
    const { todos } = payload;

    // 1. Format table data
    const tableData: string[][] = todos.map((todo: Todo): string[] => {
        return [
            todo.id.toString(),
            todo.text,
            todo.completed ? "Done" : "Pending",
        ];
    });

    // 2. Generate chart image
    const chartImage = await generateChartImage();

    // 3. Generate PDF
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

    // 4. Convert to Buffer
    return Buffer.from(pdf);
}
```

### Chart Generation Function

```typescript
async function generateChartImage(): Promise<string> {
    // 1. Register Chart.js components
    Chart.register(/* ... */);

    // 2. Calculate dimensions with unit conversions
    const chartWidthMm = 210;
    const chartHeightMm = 80;
    const chartWidthPt = mm2pt(chartWidthMm);
    const chartHeightPt = mm2pt(chartHeightMm);
    const baseWidthPx = Math.round(pt2px(chartWidthPt));
    const baseHeightPx = Math.round(pt2px(chartHeightPt));
    const resolutionMultiplier = 2;
    const chartWidthPx = baseWidthPx * resolutionMultiplier;
    const chartHeightPx = baseHeightPx * resolutionMultiplier;

    // 3. Create canvas
    const canvas = new Canvas(chartWidthPx, chartHeightPx);
    const ctx = canvas.getContext("2d");
    ctx.scale(resolutionMultiplier, resolutionMultiplier);

    // 4. Configure and render chart
    const chart = new Chart(ctx, chartConfig);

    // 5. Export to base64
    const pngBuffer = await canvas.toBuffer("png");
    const base64Image = pngBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // 6. Cleanup
    chart.destroy();

    return dataUrl;
}
```

---

## Summary

The PDF generation system combines:

1. **pdfme** - Template-based PDF generation with precise layout control
2. **skia-canvas** - Server-side canvas rendering for Chart.js
3. **Chart.js** - Rich chart visualizations

The process:
1. Define template with fields (text, table, image)
2. Generate chart image using Chart.js + skia-canvas
3. Format data for table
4. Use pdfme to combine template + data into PDF
5. Return PDF buffer

This architecture provides:
- **Separation of concerns**: Template definition separate from data
- **Reusability**: Same template can generate multiple PDFs with different data
- **Flexibility**: Easy to modify layout or add new fields
- **Quality**: High-resolution charts with precise positioning
