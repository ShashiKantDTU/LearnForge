# LearnForge API

A powerful backend API for generating educational content and course materials using AI.

## Description

LearnForge API is a Node.js Express application that uses the Google Generative AI (Gemini) to create comprehensive, structured educational content. The API can generate learning paths, detailed topic content with diagrams, and refined educational materials.

## Features

- **AI-Powered Content Generation**: Generate comprehensive educational content using Google's Gemini AI models
- **Model Optimization**: Uses different models for different tasks (PRO for content, FLASH for diagrams)
- **Consistent Formatting**: Automatic content processing for consistent markdown formatting

## Installation

1. Clone the repository:
```
git clone https://github.com/your-username/LearnForge.git
cd LearnForge
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your Google AI API key:
```
GOOGLE_API_KEY=your_api_key_here
PORT=3000
```

## Usage

1. Start the server:
```
npm start
```

2. For development with hot-reload:
```
npm run dev
```

3. API Endpoints:
   - `POST /generate`: Generate a learning path based on a topic
   - `POST /topic`: Generate detailed content for a specific topic

## Project Structure

```
LearnForge/
├── config/           # Configuration settings
├── middleware/       # Express middleware
├── routes/           # API routes
│   └── courseRoutes.js  # AI course generation routes
├── services/         # Business logic and services
│   └── aiService.js    # AI generation service
├── index.js          # Main entry point
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
└── README.md         # Project documentation
```

## Tech Stack

- Node.js
- Express.js
- Google Generative AI (Gemini)

## License

This project is licensed under the ISC License.

## Author

Shashi Kant 