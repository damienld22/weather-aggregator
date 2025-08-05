import { app } from "./main.ts";
import { container } from "./di.ts";

const { port, meteocielAdapter } = container.cradle;

// Start the application
app({ port, meteocielAdapter });
