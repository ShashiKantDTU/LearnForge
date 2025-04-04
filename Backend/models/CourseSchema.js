import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    Course_Name: String,
    Course_Prompt: String,
    Course_Field: String,
    Course_Language: String,
    Course_Description: String,
    Target_Audience: String,
    Course_Level: String,
    Prerequisites: [String],
    benefits: [
        {
            icon: String,
            text: String
        }
    ],
    learning_path: [
        {
            section: Number,
            topic_name: String,
            key_concepts: [String],
            estimated_time_hours: Number,
            practice: String
        }
    ],
    generated_content: [
        {
            section: Number,
            content: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Course', CourseSchema);