import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEYS, MODEL_NAMES, API_VERSION } from '../config/apiConfig.js';
import { getRandomUserAgent } from '../utils/userAgentRotator.js';

/**
 * API Key Rotation Strategy
 * 
 * We use a random selection strategy for API keys to handle parallel requests effectively.
 * Each incoming request randomly selects from the available API keys rather than using sequential rotation.
 * 
 * Benefits:
 * - Parallel requests will likely use different API keys, avoiding rate limit issues
 * - Better distribution of load across all API keys
 * - No state dependency between concurrent requests
 * 
 * The approach is more effective than sequential rotation which can result in multiple 
 * parallel requests using the same API key if they start at the same time.
 */

// Keep track of which API key we're using - initialize with a random value
let currentApiKeyIndex = Math.floor(Math.random() * API_KEYS.length);

// Create a timestamp to track when this instance was initialized
const instanceStartTime = Date.now();
console.log(`AI Service initialized with starting API key index: ${currentApiKeyIndex} at ${new Date(instanceStartTime).toLocaleTimeString()}`);

// Initialize AI clients with default user agents
const initializeAIClients = () => {
    const clients = [];
    API_KEYS.forEach(key => {
        if (!key) {
            console.warn('Warning: Missing API key in environment variables');
            return;
        }
        
        clients.push(new GoogleGenerativeAI(key, {
            apiVersion: API_VERSION,
            transport: {
                headers: {
                    "User-Agent": getRandomUserAgent()
                }
            }
        }));
    });
    return clients;
};

// Create initial clients
const aiClients = initializeAIClients();

// Create model collections
const createModelCollections = () => {
    const proModels = [];
    const flashModels = [];
    
    aiClients.forEach(client => {
        proModels.push(client.getGenerativeModel({ model: MODEL_NAMES.PRO }));
        flashModels.push(client.getGenerativeModel({ model: MODEL_NAMES.FLASH }));
    });
    
    return { proModels, flashModels };
};

// Initial model collections
const { proModels, flashModels } = createModelCollections();

/**
 * Get a fresh model instance with a new API key and User-Agent
 * @param {string} modelType - The type of model to use (PRO or FLASH)
 * @returns {Object} A fresh model instance
 */
const getNextModelWithFreshUserAgent = (modelType) => {
    // Store previous key index for logging
    const previousKeyIndex = currentApiKeyIndex;
    
    // Randomly select an API key instead of sequential rotation
    // This ensures parallel requests use different keys
    currentApiKeyIndex = Math.floor(Math.random() * API_KEYS.length);
    
    // Safety check in case some API keys are undefined
    if (!API_KEYS[currentApiKeyIndex]) {
        // Try to find any valid API key
        let attempts = 0;
        const validKeyIndices = API_KEYS.map((key, index) => key ? index : null).filter(index => index !== null);
        
        if (validKeyIndices.length === 0) {
            throw new Error('No valid API keys found in environment variables');
        }
        
        // Select a random key from valid keys
        currentApiKeyIndex = validKeyIndices[Math.floor(Math.random() * validKeyIndices.length)];
    }
    
    // Create a fresh instance with a new random User-Agent
    const freshUserAgent = getRandomUserAgent();
    console.log(`API key selection: ${previousKeyIndex} → ${currentApiKeyIndex} | User-Agent: ${freshUserAgent.substring(0, 30)}...`);
    
    // Create a fresh instance of the API client with the new User-Agent
    const freshGenAI = new GoogleGenerativeAI(API_KEYS[currentApiKeyIndex], {
        apiVersion: API_VERSION,
        transport: {
            headers: {
                "User-Agent": freshUserAgent
            }
        }
    });
    
    // Get the appropriate model
    const modelName = modelType === 'PRO' ? MODEL_NAMES.PRO : MODEL_NAMES.FLASH;
    
    // Return a fresh model instance
    return freshGenAI.getGenerativeModel({ model: modelName });
};

/**
 * Generate content with automatic error handling and retries
 * @param {string} prompt - The prompt to send to the model
 * @param {string} modelType - The type of model to use (PRO or FLASH)
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Object} The generated content
 */
const generateContent = async (prompt, modelType = 'PRO', maxRetries = 2) => {
    let retries = 0;
    let error;
    
    while (retries <= maxRetries) {
        try {
            // Create a fresh model with a randomly selected API key for each attempt
            // This ensures that parallel requests will likely use different API keys
            const model = getNextModelWithFreshUserAgent(modelType);
            const result = await model.generateContent(prompt);
            
            // If successful, return the result
            console.log(`Content generation successful with API key index: ${currentApiKeyIndex}`);
            return result;
        } catch (err) {
            error = err;
            console.error(`Error with API key ${currentApiKeyIndex} (attempt ${retries + 1}/${maxRetries + 1}): ${err.message}`);
            
            retries++;
            
            // Add a small delay before retry to avoid rate limits
            if (retries <= maxRetries) {
                console.log(`Retrying with a different random API key...`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    // If we've exhausted all retries, throw the last error
    throw error;
};

/**
 * Parse JSON from model response with error handling
 * @param {Object} response - The model response
 * @returns {Object} Parsed JSON object
 */
const parseJsonResponse = (response) => {
    try {
        const text = response.response.text();
        const cleanJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('Failed to parse model response as JSON');
    }
};

export {
    proModels,
    flashModels,
    getNextModelWithFreshUserAgent,
    generateContent,
    parseJsonResponse
}; 