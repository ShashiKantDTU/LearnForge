// API Keys Configuration
import 'dotenv/config';

// Get API keys from environment variables
const API_KEYS = [
    process.env.API_KEY_0,
    process.env.API_KEY_1,
    process.env.API_KEY_2,
    process.env.API_KEY_3,
    process.env.API_KEY_4,
    process.env.API_KEY_5,
    process.env.API_KEY_6,
    process.env.API_KEY_7,
    process.env.API_KEY_8,
    process.env.API_KEY_9,
    process.env.API_KEY_10
];

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-3.5-turbo";

// // Model configurations
// const MODEL_NAMES = {
//     // PRO: "gemini-2.0-pro-exp-02-05",
//     PRO: "gemini-2.5-pro-exp-03-25",
//     FLASH: "gemini-2.0-flash-thinking-exp-01-21"
// };

// Model configurations
const MODEL_NAMES = {
    // PRO: "gemini-2.0-pro-exp-02-05",
    PRO: "gemini-2.5-flash-preview-04-17",
    FLASH: "gemini-2.0-flash"
};

// API version
const API_VERSION = "v1beta";

// Port for the server
const PORT = process.env.PORT || 3000;

export {
    API_KEYS,
    MODEL_NAMES,
    API_VERSION,
    PORT,
    OPENROUTER_API_KEY,
    OPENROUTER_API_URL,
    OPENROUTER_MODEL
}; 