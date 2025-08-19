import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { apiError } from "../utils/apiError.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const MODEL = process.env.GROQ_MODEL || "llama3-70b-8192";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: MODEL,
  temperature: 0.3,
});

const lessonSchema = z.object({
  title: z.string().describe("The mandatory title of the lesson."),
  sections: z.array(z.object({
    heading: z.string().describe("The mandatory heading for this section."),
    body: z.string().describe("The mandatory content for this section."),
  })).min(1).describe("The mandatory array of lesson sections."),
  codeSamples: z.array(z.string()).describe("An array of valid, JSON-escaped C++ code samples."),
  keyTakeaways: z.array(z.string()).min(1).describe("A mandatory list of key takeaways."),
});

const quizSchema = z.object({
    questions: z.array(z.object({
        text: z.string().describe("The mandatory text of the multiple-choice question."),
        options: z.array(z.string()).length(4).describe("A mandatory array of exactly 4 possible answers."),
        correctIndex: z.number().min(0).max(3).describe("The mandatory 0-based index of the correct answer."),
        explanation: z.string().describe("A mandatory, brief explanation of the correct answer.")
    })).length(10).describe("A mandatory array of exactly 10 quiz questions.")
});

const lessonChain = llm.withStructuredOutput(lessonSchema);
const quizChain = llm.withStructuredOutput(quizSchema);
const remedialLessonChain = llm.withStructuredOutput(lessonSchema);

export async function generateLesson(seedTopic, { user } = {}) {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an expert Computer Science tutor. Your task is to provide educational content in a structured JSON format."],
      ["human", `Create a lesson about the following topic: "{topic}".`],
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
            ["system", "You are an expert quiz designer. Your task is to create a 10-question multiple-choice quiz in a structured JSON format based on the provided lesson title."],
            ["human", "Create a quiz for a lesson titled: \"{title}\"."],
        ]);
        const chain = prompt.pipe(quizChain);
        const result = await chain.invoke({
            title: lesson.title
        });
        return result;
    } catch (err) {
        console.error("Error in generateQuizFromLesson:", err);
        throw new apiError(500, `LLM generateQuizFromLesson failed: ${err.message}`);
    }
}

export async function generateRemedialLesson(quiz, attempt, moduleTitle) {
    try {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a patient tutor. A student struggled with a quiz. Your task is to generate a simpler, remedial lesson in a structured JSON format, focusing on their mistakes."],
            ["human", `A student scored {score} on a quiz about "{topic}". They struggled with questions related to: {wrongQuestions}. Create a simplified lesson to help them understand these specific points.`],
        ]);
        const chain = prompt.pipe(remedialLessonChain);

        const wrongQuestions = attempt.answers
            .filter(a => !a.correct)
            .map(a => quiz.questions.find(q => q._id.toString() === a.questionId.toString())?.text)
            .filter(Boolean);

        const result = await chain.invoke({
            score: attempt.score,
            topic: moduleTitle,
            wrongQuestions: wrongQuestions.join(', ') || "General review needed"
        });
        
        result._meta = { model: MODEL, remedialForAttempt: attempt._id };
        return result;

    } catch (err) {
        console.error("Error in generateRemedialLesson:", err);
        throw new apiError(500, `LLM generateRemedialLesson failed: ${err.message}`);
    }
}