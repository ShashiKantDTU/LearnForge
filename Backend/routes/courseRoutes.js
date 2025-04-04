import dotenv from 'dotenv';
import express from 'express';
import { generateContent, parseJsonResponse } from '../services/aiService.js';
dotenv.config();
import mongoose from 'mongoose';
import Course from '../models/CourseSchema.js';

const uri = process.env.MONGODB_URI;
mongoose.connect(uri);
console.log("Connected to MongoDB");


const router = express.Router();


/**
 * Generate a learning path based on a topic
 * POST /generate
 */
router.post('/generate', async (req, res) => {
    try {
        const Course_Name = req.body.Course_Name;

        if (Course_Name) {
            const course_name_with_spaces = Course_Name.replace(/-/g, ' ');
            const existingCourse = await Course.findOne({ Course_Name: course_name_with_spaces });
            if (existingCourse) {
                console.log("Course already exists in MongoDB");
                return res.json(existingCourse);
            }
        }

        const prompt = req.body.prompt;

        // Check if prompt is empty 
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // STEP 0: Check if the course already exists
        const existingCourse = await Course.findOne({ Course_Prompt: prompt });
        if (existingCourse) {
            console.log("Course already exists in MongoDB");
            return res.json(existingCourse);
        }

        // STEP 1: Generate the Learning Path
        console.log("Initializing Step 1: Generating learning path...");

        const learningPathPrompt = `
        You are an expert course designer with expertise in creating comprehensive, structured learning paths.
        Create a clear and engaging learning path for the topic: "${prompt}".

        - Break it into logical, progressive steps (typically 5-8 steps for average topics).
        - For each step, include detailed key concepts, realistic time estimates, and practical activities.
        - Output in clean JSON format.
        - Adapt the depth to the topic (shorter for simple topics, more detailed for complex ones).
        - Ensure concepts build upon each other in a logical progression.

        Format:
        {   
            "Course_Name": "Create an engaging and motivational name based on '${prompt}', Users should be able to directly know what the course is about and make it SEO friendly and catchy",
            "Course_Field": "Tech, Non-Tech ,Design , Buisness etc based on the subject matter",
            "Course_Language": "English, Hindi, Marathi, Hinglish, etc based on the mentioned in ${prompt} or the topic",
            "Course_Description": "A brief 2-3 sentence overview of what learners will gain",
            "Target_Audience": "Who this course is designed for (beginners, intermediate, etc.)",
            "Course_Level": "Specify one level: Beginner, Intermediate, Advanced, or Expert",
            "Prerequisites": ["Tell the mandatory skills or knowledge areas required before starting this course if any"],
            "learning_path": [
                {
                    "section": 1,
                    "topic_name": "Specific name for this step/module",
                    "key_concepts": ["Concept 1", "Concept 2", "Concept 3"],
                    "estimated_time_hours": realistic_number,
                    "practice": "Detailed description of a practical activity or exercise"
                }
            ]
        }
        `;

        const learningPathResult = await generateContent(learningPathPrompt, 'PRO');
        const Step1Data = parseJsonResponse(learningPathResult);
        console.log("Learning path generated successfully");
        const course = new Course(Step1Data);
        course.Course_Prompt = prompt;
        await course.save();
        console.log("Learning path saved to MongoDB");
        res.json(Step1Data);
    } catch (error) {
        console.error('Error generating learning path:', error);
        res.status(500).json({
            error: 'Failed to generate learning path',
            details: error.message
        });
    }
});


/**
 * Generate benefits for a course
 * POST /benefits
 */
router.post('/benefits', async (req, res) => {
    try {
        const Course_Name = req.body.Course_Name;

        if (!Course_Name) {
            return res.status(400).json({ error: 'Course_Name is required' });
        }

        const course_name_with_spaces = Course_Name.replace(/-/g, ' ');
        const existingCourse = await Course.findOne({ Course_Name: course_name_with_spaces });
        
        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check if benefits already exist in the course document
        if (existingCourse.benefits && existingCourse.benefits.length > 0) {
            return res.json(existingCourse.benefits);
        }
        
        const benefitsPrompt = `
Generate 6 key benefits/skills that students will gain from this ${existingCourse.Course_Name} course. Format your response EXACTLY as a valid JavaScript array of objects with no additional text or explanation.

Course details to inform your response:
- Name: ${existingCourse.Course_Name}
- Field: ${existingCourse.Course_Field}
- Level: ${existingCourse.Course_Level}
- Description: ${existingCourse.Course_Description}
- Target Audience: ${existingCourse.Target_Audience}
- Key Topics: ${existingCourse.learning_path.map(item => item.topic_name).join(', ')}

Output format:
[
  { "icon": "FaCode", "text": "First benefit description" },
  { "icon": "FaLaptopCode", "text": "Second benefit description" },
  ...and so on
]

Only use these icon names: FaCode, FaLaptopCode, FaBrain, FaLightbulb, FaTrophy, FaGraduationCap, FaChartLine, FaCertificate, FaUsers, FaRocket, FaBookOpen, FaMedal, FaChartBar, FaStar, FaUserGraduate.

Ensure each benefit is specific to the course content, concise (under 60 characters), and professionally worded.
        `;

        // Generate benefits using FLASH model for faster response
        const benefitsResult = await generateContent(benefitsPrompt, 'FLASH');
        const benefitsResponse = await benefitsResult.response.text();
        
        // Parse the response to ensure it's valid JSON
        try {
            const parsedBenefits = JSON.parse(benefitsResponse.trim());
            
            // Save benefits to the course document
            existingCourse.benefits = parsedBenefits;
            await existingCourse.save();
            console.log('Benefits saved to course document');
            
            return res.json(parsedBenefits);
        } catch (parseError) {
            console.error('Error parsing benefits response:', parseError);
            // Try to extract JSON from the text response
            const jsonMatch = benefitsResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                try {
                    const extractedJson = JSON.parse(jsonMatch[0]);
                    
                    // Save benefits to the course document
                    existingCourse.benefits = extractedJson;
                    await existingCourse.save();
                    console.log('Benefits extracted and saved to course document');
                    
                    return res.json(extractedJson);
                } catch (e) {
                    throw new Error('Failed to parse benefits response');
                }
            } else {
                throw new Error('Invalid benefits response format');
            }
        }
    } catch (error) {
        console.error('Error generating benefits:', error);
        res.status(500).json({
            error: 'Failed to generate benefits',
            details: error.message
        });
    }
});



/**
 * Helper function to retry content generation with multiple attempts
 * @param {Function} generationFn - Async function to generate content
 * @param {string} stepName - Name of the generation step for logging
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<any>} - The generated content or throws an error after max retries
 */
async function retryGeneration(generationFn, stepName, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`${stepName} - Attempt ${attempt}/${maxRetries}`);
            const result = await generationFn();
            console.log(`${stepName} completed successfully`);
            return result;
        } catch (error) {
            lastError = error;
            console.error(`${stepName} failed (Attempt ${attempt}/${maxRetries}):`, error.message);
            
            // If we haven't reached max retries yet, wait before trying again
            if (attempt < maxRetries) {
                const delay = 1000 * attempt; // Progressive backoff
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // If we get here, all attempts failed
    console.error(`All ${maxRetries} attempts for ${stepName} failed`);
    throw lastError;
}

/**
 * Generate detailed content for a specific topic
 * POST /topic
 */
router.post('/topic', async (req, res) => {
    try {
        const topicdata = req.body.topicdata;

        console.log("Topic data received:", topicdata);

        if (!topicdata) {
            return res.status(400).json({ error: 'No topic data provided' });
        }

        // STEP 0: Check if the course already exists and if the requested section content already exists
        const existingCourse = await Course.findOne({ Course_Name: topicdata.Course_Name });
        if (existingCourse) {
            console.log(`Course found: ${existingCourse.Course_Name}`);
            
            // Find the specific section in generated_content array
            const existingSection = existingCourse.generated_content.find(
                item => item.section === parseInt(topicdata.section)
            );
            
            // If section exists and has content, return it
            if (existingSection && existingSection.content && existingSection.content.length > 0) {
                console.log(`Found existing content for section ${topicdata.section}`);
                console.log(existingSection.content);
                return res.send(existingSection.content);
            } else {
                console.log(`No existing content found for section ${topicdata.section}, generating new content...`);
            }
        } else {
            console.log(`Course not found, will generate content and create new course entry`);
        }

        // Determine if this is a tech or non-tech course
        const isTechCourse = topicdata.Course_Field === 'Tech';
        console.log(`Course field: ${topicdata.Course_Field}, Is tech course: ${isTechCourse}`);

        // Choose the appropriate prompt based on course type
        let promptforTopicPageGen;
        
        if (isTechCourse) {
            // TECH COURSE PROMPT
            promptforTopicPageGen = `
            You are a professional educational content creator with expertise in technical subjects and coding.

        ### **Course Data:**
        - Course Name: ${topicdata.Course_Name || 'Not specified'}
        - Field: ${topicdata.Course_Field || 'Technical'}
        - Course Description: ${topicdata.Course_Description || 'Not specified'}
        - Course Language: ${topicdata.Course_Language || 'English'}
        - Target Audience: ${topicdata.Target_Audience || 'Not specified'}
        - Course Level: ${topicdata.Course_Level || 'Not specified'}
        - Prerequisites: ${JSON.stringify(topicdata.Prerequisites || [])}
        - section: ${topicdata.section || 'Not specified'}
        - Topic: ${topicdata.topic_name || 'Not specified'}
        - Key Concepts: ${JSON.stringify(topicdata.key_concepts || [])}
        - Estimated Time: ${topicdata.estimated_time_hours || 'Not specified'} hours
        - Practice Activity: ${topicdata.practice || 'Not specified'}

        ### **Instructions:**
        -  MOST IMPORTANT: The Complete Content should be in ${topicdata.Course_Language} Language.
        1. **Generate a complete, detailed technical study guide**, focusing on:
           - **Core Technical Concepts:** Explain all listed key concepts with working code examples.
           - **Progressive Complexity:** Always Start with fundamentals, gradually introduce advanced topics.
           - **Best Practices:** Include industry standards, optimization tips, and common pitfalls.
           - **Hands-on Projects:** Provide practical, executable code examples that reinforce learning.

        2. **Structure:**
        - **🔍 Introduction:** 
            - Clear explanation of the technical concept and its practical applications.
            - Why this technology/concept matters in the industry.
        - **💡 Key Concepts:** 
            - In-depth technical explanations with code snippets or syntax examples.
            - Step-by-step breakdowns of complex procedures.
        - **📊 Implementation Examples:** 
            - Working code examples with explanations of each component.
            - Debugging tips and common errors to watch for.
        - **🛠️ Practical Exercise:** 
            - A complete hands-on project or exercise with increasing difficulty levels.
            - Include expected output/results for self-assessment.

        ### **Format Requirements:**
        - Do not Include topic name in the content (start with Introduction)
        - Present content in clean, well-formatted Markdown.
        - For code examples, use proper syntax highlighting with \`\`\`language code blocks.
        - Include diagrams or illustrations where they enhance understanding (described in markdown).
        - No introductions like "Here's the content" or conclusions like "I hope this helps" - just the educational content.
        - Be detailed but concise - focus on clarity and practical application.
        - Assume the reader is a beginner with the topic but has basic knowledge of programming concepts.
            `;
        } else {
            // NON-TECH COURSE PROMPT
            promptforTopicPageGen = `
            You are a professional educational content writer creating detailed and structured study material for a non-technical course.

        ### **Course Data:**
        - Course Name: ${topicdata.Course_Name || 'Not specified'}
        - Field: ${topicdata.Course_Field || 'Non-Technical'}
        - Course Language: ${topicdata.Course_Language || 'English'}
        - section: ${topicdata.section || 'Not specified'}
        - Topic: ${topicdata.topic_name || 'Not specified'}
        - Key Concepts: ${JSON.stringify(topicdata.key_concepts || [])}
        - Estimated Time: ${topicdata.estimated_time_hours || 'Not specified'} hours
        - Practice Activity: ${topicdata.practice || 'Not specified'}

        ### **Instructions:**
        - MOST IMPORTANT: The Complete Content should be in ${topicdata.Course_Language} Language.
        1. **Generate a complete and detailed study guide for this topic**, focusing on:
           - **Core Concepts:** Explain all the listed key concepts clearly and thoroughly with practical examples.
           - **Real-World Applications:** Include relevant case studies, scenarios, or problem-solving activities.
           - **Visual Learning:** Describe diagrams, charts, or illustrations that would improve understanding.
           - **Practical Exercises:** Provide reflection questions, application exercises, and assessment activities.

        2. **Structure:**
        - **🔍 Introduction:** 
            - Engaging overview of the topic and its relevance.
            - Real-world context that connects the topic to learners' experiences.
        - **💡 Key Concepts:** 
            - In-depth explanations with relatable examples.
            - Historical context or theoretical foundations where relevant.
        - **📊 Case Studies & Applications:** 
            - Real-world scenarios showing practical implementation.
            - Analysis of how the concepts apply in different situations.
        - **🛠️ Reflective Activities:** 
            - Thought-provoking questions that encourage critical thinking.
            - Application exercises that reinforce learning through doing.
            - Self-assessment opportunities aligned with learning objectives.

        ### **Format Requirements:**
        - Present content in clear, well-structured Markdown.
        - Use headings, subheadings, bullet points, and numbered lists for organization.
        - Include descriptions of relevant visual aids (charts, tables, diagrams) in markdown format.
        - No introductions like "Here's the content" or conclusions like "I hope this helps" - just the educational content.
        - Use accessible language while maintaining academic rigor.
        - Ensure a gradual progression from foundational to more complex ideas.
        - Include diverse examples that represent various perspectives and contexts.
            `;
        }

        console.log(`Generating content for topic: ${topicdata.topic_name} (${isTechCourse ? 'Tech' : 'Non-Tech'})`);
        
        // Step 1: Generate initial content with retry logic
        const initialContent = await retryGeneration(
            async () => {
                const detailedData = await generateContent(promptforTopicPageGen, 'PRO');
                return detailedData.response.text();
            },
            "Step 1: Initial content generation"
        );
        
        // Step 2: Generate simple diagrams for complex concepts
        console.log('Starting Step 2: Generating text-based diagrams and visual aids...');
        let contentWithDiagrams = await retryGeneration(
            async () => {
                // Create a prompt for diagram generation
                const diagramPrompt = `
                You are an expert in creating text-based diagrams, tables, and visual aids for educational content.
                Review the following educational content and enhance it with appropriate ASCII/text diagrams.

                ### INSTRUCTIONS:
                1. Analyze the content and identify 2-4 complex concepts that would benefit from visual representation.
                2. For each identified concept, create a simple ASCII/text-based diagram directly in markdown.
                3. DO NOT use Mermaid syntax or any external rendering tools.
                4. DO NOT remove or substantially alter the original content - only add diagrams.
                5. Focus on creating:
                   - Simple flowcharts using ASCII characters (→, ↓, +, etc.)
                   - Concept maps showing relationships
                   - Process diagrams with boxes and arrows
                   - Tables for comparing concepts
                   - Basic hierarchical structures
                6. Place each diagram immediately after the concept it illustrates
                7. Add a brief explanation before each diagram
                8. Each diagram must be enclosed in a code block with three backticks

                ### KEY REQUIREMENTS FOR ASCII TABLES:
                - Use consistent spacing for all columns
                - Ensure all columns are properly aligned
                - Use monospace-friendly characters for borders (+-|)
                - Add a header row and separator row
                - Make sure text in each cell has padding spaces on both sides
                - Keep table width reasonable (max ~80 characters wide)
                - Example good formatting:
                
                \`\`\`
                +---------------+----------------+---------------+
                | Column 1      | Column 2       | Column 3      |
                +---------------+----------------+---------------+
                | Cell content  | Cell content   | Cell content  |
                | Longer text   | Short          | Medium text   |
                +---------------+----------------+---------------+
                \`\`\`

                ### CONTENT TO ENHANCE:
                ${initialContent}

                ### EXAMPLES OF GOOD ASCII DIAGRAMS:
                Example 1 - Simple flowchart:
                \`\`\`
                Start → Initialize → Process → Decision? → Yes → Success
                                                     ↓
                                                    No
                                                     ↓
                                                   Retry
                \`\`\`

                Example 2 - Concept relationship:
                \`\`\`
                +----------------+      +----------------+
                |  Concept A     |----->|  Concept B     |
                +----------------+      +----------------+
                        |                      |
                        v                      v
                +----------------+      +----------------+
                |  Concept C     |----->|  Concept D     |
                +----------------+      +----------------+
                \`\`\`

                Example 3 - Comparison table:
                \`\`\`
                +-----------------+------------------+------------------+
                | Feature         | Approach 1       | Approach 2       |
                +-----------------+------------------+------------------+
                | Performance     | High             | Medium           |
                | Implementation  | Complex          | Simple           |
                | Use cases       | Large scale apps | Small projects   |
                +-----------------+------------------+------------------+
                \`\`\`

                IMPORTANT: 
                - DO NOT change the core content - only ADD diagrams to existing sections.
                - ENSURE the output is valid markdown that renders properly.
                - Make sure diagrams use consistent spacing and alignment.
                - For tables, ensure each column is the same width (pad with spaces).
                `;

                // Generate content with diagrams using the PRO model (same as Step 1)
                const diagramData = await generateContent(diagramPrompt, 'PRO');
                return diagramData.response.text();
            },
            "Step 2: Diagram generation"
        );
        
        console.log('Step 2 completed: Content enhanced with diagrams');
        
        // Step 3: Refine content with retry logic
        console.log('Refining content with Gemini Pro model...');
        const refinedContent = await retryGeneration(
            async () => {
                const refinementPrompt = `
                Improve the following course content by applying these guidelines:

                Proper indentation and formatting of the content for markdown : Must be followed
                Clarity & Grammar: Fix grammar issues and enhance readability while keeping the original meaning.
                Completeness: Add any missing but essential information related to the topic.
                Examples & Depth: Expand explanations with practical examples and deeper insights where needed.
                Consistency & Flow: Ensure smooth transitions and consistent formatting throughout the content.
                IMPORTANT: Preserve all ASCII diagrams and tables exactly as they appear in the content.

                Additional requirements:
                1. Preserve ALL case study details and diagrams from the original content
                2. Add a brief summary at the end of each main section
                3. Incorporate visual cues like 📊, 📈, 🔍, etc. to enhance readability
                4. Ensure the content is well-structured with clear headings and subheadings
                5. IMPORTANT: Do NOT include any introductory phrases like "Okay, here's the revised version..." or "Here's the enhanced content..." - start directly with the actual content
                6. Do NOT include any meta-commentary about following guidelines or instructions
                7. DO NOT convert ASCII diagrams to other formats - keep them exactly as is

                Original Content:
                ${contentWithDiagrams}

                Note: Keep the refined content concise and focused. Prioritize clarity over length while maintaining the depth of practical examples.
                `;
                
                // Using PRO model for final refinement to ensure quality
                const refinedData = await generateContent(refinementPrompt, 'PRO');
                return refinedData.response.text();
            },
            "Step 3: Content refinement"
        );
        
        console.log('Content generation and refinement completed successfully');
        
        // STEP 4: Save the Topic Content to MongoDB
        if (existingCourse) {
            // Check if this section already exists
            const sectionIndex = existingCourse.generated_content.findIndex(
                item => item.section === parseInt(topicdata.section)
            );
            
            if (sectionIndex >= 0) {
                // Update existing section
                existingCourse.generated_content[sectionIndex].content = refinedContent;
            } else {
                // Add new section
                existingCourse.generated_content.push({ 
                    section: parseInt(topicdata.section), 
                    content: refinedContent 
                });
            }
            
            await existingCourse.save();
            console.log(`Updated course ${existingCourse.Course_Name} with content for section ${topicdata.section}`);
        } else {
            // Create new course with this section
            const newCourse = new Course({
                Course_Name: topicdata.Course_Name,
                Course_Field: topicdata.Course_Field,
                Course_Description: topicdata.Course_Description,
                Target_Audience: topicdata.Target_Audience,
                Course_Level: topicdata.Course_Level,
                Prerequisites: topicdata.Prerequisites || [],
                learning_path: [{
                    section: parseInt(topicdata.section),
                    topic_name: topicdata.topic_name,
                    key_concepts: topicdata.key_concepts || [],
                    estimated_time_hours: topicdata.estimated_time_hours,
                    practice: topicdata.practice
                }],
                generated_content: [{
                    section: parseInt(topicdata.section),
                    content: refinedContent
                }]
            });
            
            await newCourse.save();
            console.log(`Created new course ${topicdata.Course_Name} with section ${topicdata.section}`);
        }
        
        // Return the processed content
        res.send(refinedContent);
    } catch (error) {
        console.error('Error in topic generation:', error);
        res.status(500).json({
            error: 'Failed to generate topic content',
            details: error.message
        });
    }
});

/**
 * Search for courses by Course_Field and Course_Level
 * POST /courses
 */
router.post('/courses', async (req, res) => {
    try {
        const { Course_Field, Course_Level } = req.body;
        // If no filters provided, return all courses
        if (!Course_Field && !Course_Level) {
            const allCourses = await Course.find({});
            return res.json(allCourses);
        }
        // If only Course_Field is provided
        if (Course_Field && !Course_Level) {
            const coursesByField = await Course.find({
                Course_Field: { $regex: Course_Field, $options: 'i' }
            });
            return res.json(coursesByField);
        }
        // If only Course_Level is provided
        if (!Course_Field && Course_Level) {
            const coursesByLevel = await Course.find({
                Course_Level: { $regex: Course_Level, $options: 'i' }
            });
            return res.json(coursesByLevel);
        }

        // Build the query object
        const query = {};

        // Add field filters if provided
        if (Course_Field) query.Course_Field = Course_Field;
        if (Course_Level) query.Course_Level = Course_Level;

        // Execute the search
        const courses = await Course.find(query);

        // Return the results
        res.json(courses);
    } catch (error) {
        console.error('Error searching courses:', error);
        res.status(500).json({
            error: 'Failed to search courses',
            details: error.message
        });
    }
});

/**
 * AI Chat Assistant - Generate responses based on course context
 * POST /chat
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, context, course, section, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Chat request received for course: ${course}, section: ${section}`);
        console.log(`User query: "${message}", Context: "${context}"`);
        console.log(`Conversation history: ${conversationHistory.length} messages`);

        // Step 1: Try to get course data for additional context
        let courseData = null;
        let sectionData = null;
        let sectionContent = "";

        try {
            if (course) {
                const course_name_with_spaces = course.replace(/-/g, ' ');
                courseData = await Course.findOne({ Course_Name: course_name_with_spaces });
                
                if (courseData && courseData.learning_path && section) {
                    // Find the specific section data
                    sectionData = courseData.learning_path.find(
                        item => item.section === parseInt(section)
                    );
                    
                    // Find content for this section
                    const sectionContentObj = courseData.generated_content.find(
                        item => item.section === parseInt(section)
                    );
                    
                    if (sectionContentObj && sectionContentObj.content) {
                        // Optimize content size based on conversation history length
                        // If there's a lot of history, we can reduce the content to save tokens
                        const contentMaxLength = conversationHistory.length > 3 ? 3000 : 5000;
                        sectionContent = sectionContentObj.content.substring(0, contentMaxLength);
                    }
                }
            }
        } catch (error) {
            console.warn("Error retrieving course data for chat context:", error.message);
            // Continue without course data - don't fail the whole request
        }

        // Format conversation history for the prompt
        let conversationHistoryText = '';
        
        if (conversationHistory && conversationHistory.length > 0) {
            // Check if the current message is a follow-up or new topic
            const isFollowUpQuestion = isLikelyFollowUp(message, conversationHistory);
            
            conversationHistoryText = '\nPrevious conversation:\n';
            
            // Add conversation history entries
            conversationHistoryText += conversationHistory.map((msg, index) => {
                // Add emphasis markers to relevant previous messages if this is a follow-up
                const isPotentiallyRelevant = isFollowUpQuestion && isMessageRelevantToQuery(message, msg.content);
                const prefix = isPotentiallyRelevant ? '>> ' : '';
                return `${prefix}${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`;
            }).join('\n');
            
            // Add an analysis hint about the conversation continuity
            if (isFollowUpQuestion) {
                conversationHistoryText += '\n\nNote: The student appears to be asking a follow-up question related to previous messages.';
            }
        }

        // Step 2: Construct prompt with available context
        const chatPrompt = `
        You are an AI learning assistant helping a student understand a course topic. Respond helpfully, accurately, and concisely to the student's question.
        
        ${courseData ? `Course: ${courseData.Course_Name}
        Field: ${courseData.Course_Field}
        Level: ${courseData.Course_Level}
        Description: ${courseData.Course_Description}` : ''}
        
        ${sectionData ? `Current Topic: ${sectionData.topic_name}
        Key Concepts: ${JSON.stringify(sectionData.key_concepts || [])}` : ''}
        
        ${context ? `Specific Context: ${context}` : ''}
        
        ${sectionContent ? `Relevant Content Fragment:
        ${sectionContent}` : ''}
        
        ${conversationHistoryText}
        
        Student's Question: "${message}"
        
        Your response should:
        1. Be directly relevant to the question and current topic
        2. Provide accurate information based on the course content
        3. Use examples when helpful
        4. Be conversational and encouraging
        5. Be concise (generally under 250 words)
        6. If the question is a follow-up, maintain continuity with the previous conversation
        7. If the question refers to something mentioned earlier in the conversation, acknowledge that context
        8. If the question is ambiguous or unclear, ask for clarification
        9. If you don't know the answer or lack sufficient context, acknowledge your limitations
        
        Respond only with your answer to the student, without any prefix like "Here's my response:" or "AI Assistant:".
        `;
        
        // Step 3: Generate response using the FLASH model for faster response time
        const result = await generateContent(chatPrompt, 'FLASH');
        const response = await result.response.text();
        
        console.log(`Generated chat response (${response.length} chars)`);
        
        res.json({ response });
    } catch (error) {
        console.error('Error generating chat response:', error);
        res.status(500).json({
            error: 'Failed to generate response',
            details: error.message
        });
    }
});

/**
 * Helper function to determine if a message is likely a follow-up question
 * @param {string} message - The current user message
 * @param {Array} history - The conversation history
 * @returns {boolean} - Whether the message is likely a follow-up
 */
function isLikelyFollowUp(message, history) {
    if (!message || !history || history.length === 0) return false;
    
    // Check for follow-up indicators in the message
    const followUpIndicators = [
        'what about', 'how about', 'and ', 'so ', 'then ', 'why ', 'can you explain',
        'what does that mean', 'could you elaborate', 'tell me more', 'how does', 
        'but ', 'also ', 'additionally', 'furthermore', 'moreover', 'in addition',
        'speaking of', 'regarding', 'concerning', 'with respect to', 'as for',
        'you mentioned', 'you said', 'you talked about', 'earlier', 'before',
        'previously', 'last time', 'in your last', 'in the previous',
        'this', 'that', 'these', 'those', 'it', 'they', 'them', 'their',
        'the ', 'is there', 'are there', 'can I', 'should I', 'would it'
    ];
    
    const lowercaseMessage = message.toLowerCase();
    
    // Check if message starts with one of the follow-up indicators
    for (const indicator of followUpIndicators) {
        if (lowercaseMessage.includes(indicator)) {
            return true;
        }
    }
    
    // Check if message is very short (likely a follow-up)
    if (message.split(' ').length <= 5) {
        return true;
    }
    
    // Check if message contains pronouns without clear referents
    const pronounsWithoutContext = [
        ' it ', ' this ', ' that ', ' these ', ' those ', ' they ', ' them ', ' he ', ' she '
    ];
    
    for (const pronoun of pronounsWithoutContext) {
        if (lowercaseMessage.includes(pronoun)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Helper function to determine if a message is relevant to the current query
 * @param {string} currentMessage - The current user message
 * @param {string} historicalMessage - A message from the history
 * @returns {boolean} - Whether the historical message is likely relevant to the current query
 */
function isMessageRelevantToQuery(currentMessage, historicalMessage) {
    if (!currentMessage || !historicalMessage) return false;
    
    // Simple relevance check based on shared words
    const currentWords = new Set(currentMessage.toLowerCase().split(/\s+/).filter(word => word.length > 3));
    const historicalWords = new Set(historicalMessage.toLowerCase().split(/\s+/).filter(word => word.length > 3));
    
    // Count shared words
    let sharedWords = 0;
    for (const word of currentWords) {
        if (historicalWords.has(word)) {
            sharedWords++;
        }
    }
    
    // If there are enough shared substantive words, consider it relevant
    return sharedWords >= 2;
}

export default router; 