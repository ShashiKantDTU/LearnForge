import express from 'express';
import { PORT } from './config/apiConfig.js';
import courseRoutes from './routes/courseRoutes.js';
import { jsonParsingErrorHandler, notFound, errorHandler } from './middleware/errorHandler.js';

// Initialize express app
const app = express();

// CORS Middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Middleware
app.use(express.json());

// JSON Parsing Error Handler (must be added after express.json() but before routes)
app.use(jsonParsingErrorHandler);

// Welcome route
app.get('/', (req, res) => {
    res.send('LearnForge API is running!');
});

// Routes
app.use('/', courseRoutes); // Gemini-based routes

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    console.log(`LearnForge server is running on port ${PORT}`);
    console.log(`Performance optimizations enabled:`);
    console.log(`- Model optimization (PRO for content, FLASH for diagrams)`);
});
