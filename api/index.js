// Vercel Serverless Function entry point
import express from 'express';
import { registerRoutes } from '../dist/routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
await registerRoutes(app);

// Export for Vercel
export default app;
