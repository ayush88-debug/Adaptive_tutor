import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { z } from "zod"; // Import Zod
import { apiError } from "../utils/apiError.js";
import {
  ChatPromptTemplate,
} from "@langchain/core/prompts";


const MODEL = process.env.GEMINI_MODEL || "gemini-pro";

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: MODEL,
  temperature: 0.3,
  maxRetries: 2,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

// --- Define Zod Schemas for Structured Output ---

const lessonSchema = z.object({
  title: z.string().describe("The concise and informative title of the lesson."),
  sections: z.array(z.object({
    heading: z.string().describe("The heading for this section of the lesson."),
    body: z.string().describe("The main content of this lesson section."),
  })).describe("An array of lesson sections."),
  codeSamples: z.array(z.string()).describe("An array of valid C++ code samples relevant to the lesson."),
  keyTakeaways: z.array(z.string()).describe("A list of key takeaways or summary points."),
});

const quizSchema = z.object({
    questions: z.array(z.object({
        text: z.string().describe("The text of the multiple-choice question."),
        options: z.array(z.string()).length(4).describe("An array of exactly 4 possible answers."),
        correctIndex: z.number().min(0).max(3).describe("The 0-based index of the correct answer in the options array."),
        explanation: z.string().describe("A brief explanation of why the correct answer is right.")
    })).length(10).describe("An array of exactly 10 multiple-choice questions.")
});

const reportSchema = z.object({
    title: z.string().describe("The title of the report, e.g., 'Performance Report for [Student Name]'."),
    summary: z.string().describe("A brief overall summary of the student's performance."),
    strengths: z.array(z.string()).describe("A list of identified strengths."),
    weaknesses: z.array(z.string()).describe("A list of identified areas for improvement."),
    recommendations: z.array(z.string()).describe("A list of actionable recommendations for the student.")
});


// --- Create Structured Output Chains ---

const lessonChain = llm.withStructuredOutput(lessonSchema);
const quizChain = llm.withStructuredOutput(quizSchema);
const remedialLessonChain = llm.withStructuredOutput(lessonSchema); // Re-use the same lesson schema
const reportChain = llm.withStructuredOutput(reportSchema);

// --- Refactored Service Functions ---

export async function generateLesson(seedTopic, { user } = {}) {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an expert Computer Science tutor. Generate a lesson based on the user's request."],
      ["human", `Generate a lesson for a university student on the topic: "{topic}".`],
    ]);
    const chain = prompt.pipe(lessonChain);
    const result = await chain.invoke({ topic: seedTopic });
    result._meta = { model: MODEL, generatedAt: new Date().toISOString() };
    return result;
  } catch (err) {
    console.error("Error in generateLesson:", err);
    throw new apiError(500, `LLM generateLesson failed: ${err.message}`);
  }
}

export async function generateQuizFromLesson(lesson, moduleId) {
    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are an expert quiz designer. Create a 10-question multiple-choice quiz based on the provided lesson content."],
            ["human", "Lesson Title: {title}\nLesson Content: {content}\n\nPlease generate the quiz."],
        ]);
        const chain = prompt.pipe(quizChain);
        const result = await chain.invoke({
            title: lesson.title,
            content: JSON.stringify(lesson.sections) // Pass content for context
        });
        return result;
    } catch (err) {
        console.error("Error in generateQuizFromLesson:", err);
        throw new apiError(500, `LLM generateQuizFromLesson failed: ${err.message}`);
    }
}

export async function generateRemedialLesson(quiz, attempt) {
    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a patient tutor. A student struggled with a quiz. Generate a simpler, remedial lesson focusing on their mistakes."],
            ["human", `The student scored {score} on a quiz. They answered the following questions incorrectly: {wrongQuestions}. Please generate a new, simplified lesson that addresses these specific areas of weakness.`],
        ]);
        const chain = prompt.pipe(remedialLessonChain);

        const wrongQuestions = attempt.answers
            .filter(a => !a.correct)
            .map(a => quiz.questions.find(q => q._id.toString() === a.questionId.toString())?.text)
            .filter(Boolean); // Get the text of wrong questions

        const result = await chain.invoke({
            score: attempt.score,
            wrongQuestions: wrongQuestions.join(', ')
        });
        
        result._meta = { model: MODEL, remedialForAttempt: attempt._id };
        return result;

    } catch (err) {
        console.error("Error in generateRemedialLesson:", err);
        throw new apiError(500, `LLM generateRemedialLesson failed: ${err.message}`);
    }
}

export async function generateReport(user, attempts = []) {
    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are an educational analyst. Generate a concise performance report for a student based on their quiz attempts."],
            ["human", "Student: {studentName}\n\nAttempts Data: {attemptsData}\n\nPlease analyze this data and generate a report highlighting strengths, weaknesses, and recommendations."],
        ]);
        const chain = prompt.pipe(reportChain);
        const result = await chain.invoke({
            studentName: user.username,
            attemptsData: JSON.stringify(attempts.map(a => ({ module: a.moduleId.title, score: a.score, passed: a.passed })))
        });

        result._meta = { model: MODEL, generatedAt: new Date().toISOString() };
        return result;
    } catch (err) {
        console.error("Error in generateReport:", err);
        throw new apiError(500, `LLM generateReport failed: ${err.message}`);
    }
}