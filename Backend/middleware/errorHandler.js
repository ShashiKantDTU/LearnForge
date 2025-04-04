/**
 * Global error handling middleware
 */

// Handle JSON parsing errors
const jsonParsingErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(`[ERROR] JSON Parsing Error: ${err.message}`);
        return res.status(400).json({ 
            error: 'Invalid JSON in request body',
            details: err.message,
            status: 400
        });
    }
    // Pass to next error handler if not a JSON parsing error
    next(err);
};

// Handle Not Found (404) errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Handle all other errors
const errorHandler = (err, req, res, next) => {
    // Set status code (use 500 if status code is not already set)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    
    console.error(`[ERROR] ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    
    // Send error response
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        status: statusCode
    });
};

export { jsonParsingErrorHandler, notFound, errorHandler }; 