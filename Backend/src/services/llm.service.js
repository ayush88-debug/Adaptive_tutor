import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { z } from "zod";
import { apiError } from "../utils/apiError.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro-latest";

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: MODEL,
  temperature: 0.3,
  maxRetries: 2,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

// --- Stricter Zod Schemas for Guaranteed Output ---

const lessonSchema = z.object({
  title: z.string().describe("The mandatory title of the lesson."),
  sections: z.array(z.object({
    heading: z.string().describe("The mandatory heading for this section."),
    body: z.string().describe("The mandatory content for this section."),
  })).min(1).describe("The mandatory array of lesson sections. It cannot be empty."),
  codeSamples: z.array(z.string()).describe("An array of valid, JSON-escaped C++ code samples."),
  keyTakeaways: z.array(z.string()).min(1).describe("A mandatory list of key takeaways. It cannot be empty."),
});

const quizSchema = z.object({
    questions: z.array(z.object({
        text: z.string().describe("The mandatory text of the multiple-choice question."),
        options: z.array(z.string()).length(4).describe("A mandatory array of exactly 4 possible answers."),
        correctIndex: z.number().min(0).max(3).describe("The mandatory 0-based index of the correct answer."),
        explanation: z.string().describe("A mandatory, brief explanation of the correct answer.")
    })).length(10).describe("A mandatory array of exactly 10 quiz questions.")
});

const reportSchema = z.object({
    title: z.string().describe("The mandatory title of the report."),
    summary: z.string().describe("A mandatory overall summary of the student's performance."),
    strengths: z.array(z.string()).describe("A mandatory list of identified strengths."),
    weaknesses: z.array(z.string()).describe("A mandatory list of identified areas for improvement."),
    recommendations: z.array(z.string()).describe("A mandatory list of actionable recommendations for the student.")
});


const lessonChain = llm.withStructuredOutput(lessonSchema);
const quizChain = llm.withStructuredOutput(quizSchema);
const remedialLessonChain = llm.withStructuredOutput(lessonSchema);
const reportChain = llm.withStructuredOutput(reportSchema);

// --- Refactored Service Functions with Forceful, Simplified Prompts ---

export async function generateLesson(seedTopic, { user } = {}) {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a JSON generation engine. Your sole purpose is to return a single, raw, valid JSON object that strictly follows the provided schema. All fields are mandatory. Do not add any commentary or markdown formatting."],
      ["human", `Generate a complete lesson for a university-level computer science course on the topic: "{topic}".`],
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
            ["system", "You are a JSON quiz generator. Your only job is to create a 10-question multiple-choice quiz as a single, raw, valid JSON object based on the provided lesson title. All fields in the schema are mandatory."],
            ["human", "Lesson Title: {title}\n\nPlease generate a 10-question quiz based on this topic. The questions should be appropriate for a university-level computer science course."],
        ]);
        const chain = prompt.pipe(quizChain);
        // We only pass the title to simplify the context and ensure reliability.
        const result = await chain.invoke({
            title: lesson.title
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
            ["system", "You are a JSON generation engine for educational content. A student struggled on a quiz. Your only job is to generate a simpler, remedial lesson as a single, raw, valid JSON object. All fields are mandatory."],
            ["human", `A student scored {score} on a quiz about "{topic}". They specifically struggled with these questions: {wrongQuestions}. Please generate a new, simplified lesson that addresses these weaknesses.`],
        ]);
        const chain = prompt.pipe(remedialLessonChain);

        const wrongQuestions = attempt.answers
            .filter(a => !a.correct)
            .map(a => quiz.questions.find(q => q._id.toString() === a.questionId.toString())?.text)
            .filter(Boolean);
        
        // Find the original module to get its title
        const originalModule = await Module.findById(attempt.moduleId);

        const result = await chain.invoke({
            score: attempt.score,
            topic: originalModule.title, // Use the module title for context
            wrongQuestions: wrongQuestions.join(', ') || "General review needed"
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
            ["system", "You are a JSON report generator. Your only job is to generate a concise performance report as a single, raw, valid JSON object based on a student's quiz attempts. All fields are mandatory."],
            ["human", "Student: {studentName}\n\nAttempts Data: {attemptsData}\n\nPlease analyze this data and generate the report."],
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