# Watch App

## Features

## Development Setup

For hot reload development, you need to run three processes simultaneously in separate terminal windows:

### Terminal 1: Start the API Server

```bash
npm run dev
```

This starts the Express API server with TypeScript watch mode on port 3000.

### Terminal 2: Watch Assets

```bash
npm run client:watch-assets
```

This watches and rebuilds CSS (Less) and JavaScript assets using esbuild.

### Terminal 3: Start the Frontend Server

```bash
npm run client:my-fe-server
```

This starts the elm-watch development server with hot reload and API proxying.

## Production Build

To build the application for production:

1. **Build the client assets:**

    ```bash
    npm run build:client
    ```

2. **Build the TypeScript server:**

    ```bash
    npm run build
    ```

3. **Start the production server:**
    ```bash
    npm run start
    ```

## Scripts

-   `npm run dev` - Start API server in watch mode
-   `npm run client:watch-assets` - Watch and rebuild client assets
-   `npm run client:my-fe-server` - Start frontend dev server with hot reload
-   `npm run build:client` - Build client assets for production
-   `npm run build` - Build TypeScript server
-   `npm run start` - Start production server
-   `npm run lint` - Run ESLint
-   `npm run lint:fix` - Fix ESLint issues automatically

## Environment Variables

-   `PORT` - Port for the Express server (default: 3000)
-   `EXPRESS_PORT` - Port for proxying API requests (default: 3000)

## Technologies Used

-   **Elm** - Functional frontend language
-   **elm-watch** - Hot reload development server for Elm
-   **Express** - Node.js web framework
-   **TypeScript** - Typed JavaScript
-   **esbuild** - Fast JavaScript bundler
-   **Less** - CSS preprocessor
