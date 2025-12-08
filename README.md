# Elm TypeScript PDF Generator

A Todo List application with PDF generation capabilities, built with Elm on the frontend and TypeScript/Express on the backend.

## Features

-   ✅ **Todo Management**: Add, toggle completion status, and delete todo items
-   📄 **PDF Generation**: Generate formatted PDF documents from your todo list
-   🎨 **Modern UI**: Clean and intuitive user interface
-   🔄 **Hot Reload**: Fast development experience with watch mode

## Project Structure

-   **Frontend**: Elm application (`src/client/elm/`)
-   **Backend**: Express API server with TypeScript (`src/server/`)
-   **PDF Generation**: Uses `@pdfme/generator` to create formatted PDFs with tables
-   **Build System**: esbuild for fast bundling of Elm and Less files

## Development Setup

For development, you need to run two processes simultaneously in separate terminal windows:

### Terminal 1: Start the API Server

```bash
npm run dev
```

This starts the Express API server with TypeScript watch mode on port 3000. The server provides:

-   `/api` - API health check endpoint
-   `/pdf` - POST endpoint to generate PDFs from todo lists
-   Static file serving for the frontend

### Terminal 2: Watch Client Assets

```bash
npm run client:watch
```

This watches and rebuilds CSS (Less) and JavaScript (Elm) assets using esbuild. Changes to Elm or Less files will automatically trigger rebuilds.

## Production Build

To build the application for production:

1. **Build the client assets:**

    ```bash
    npm run client:build
    ```

    This compiles Elm to JavaScript, processes Less to CSS, and copies the HTML file to `dist/static/`.

2. **Build the TypeScript server:**

    ```bash
    npm run server:build
    ```

    This compiles TypeScript to JavaScript in `dist/server/`.

3. **Start the production server:**

    ```bash
    npm run start
    ```

    The server will serve the static frontend and handle API requests.

## Scripts

-   `npm run dev` - Start API server in watch mode (uses `tsx watch`)
-   `npm run client:watch` - Watch and rebuild client assets (Elm + Less)
-   `npm run client:build` - Build client assets for production
-   `npm run server:build` - Build TypeScript server for production
-   `npm run start` - Start production server
-   `npm run lint` - Run ESLint on TypeScript files
-   `npm run lint:fix` - Fix ESLint issues automatically

## API Endpoints

### GET `/api`

Health check endpoint that returns a JSON message.

### POST `/pdf`

Generates a PDF from a todo list.

**Request Body:**

```json
{
    "todos": [
        {
            "id": 1,
            "text": "Example todo item",
            "completed": false
        }
    ]
}
```

**Response:**
Returns a PDF file with:

-   A centered title "Todo List"
-   A formatted table showing ID, Todo Item, and Status columns
-   Alternating row colors for better readability

Generated PDFs are also saved to the `pdfs/` directory with a timestamped filename.

## Environment Variables

-   `PORT` - Port for the Express server (default: 3000)

## Technologies Used

-   **Elm** - Functional frontend language for type-safe UI development
-   **Express** - Node.js web framework for the API server
-   **TypeScript** - Typed JavaScript for the backend
-   **@pdfme/generator** - PDF generation library
-   **esbuild** - Fast JavaScript bundler with Elm and Less plugins
-   **Less** - CSS preprocessor for styling
