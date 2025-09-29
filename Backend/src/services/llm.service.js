import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { apiError } from "../utils/apiError.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const MODEL = process.env.GROQ_MODEL || "llama3-70b-8192";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: MODEL,
  temperature: 0.4,
});

const lessonSchema = z.object({
  title: z.string().describe("The mandatory, engaging title of the lesson."),
  sections: z.array(z.object({
    heading: z.string().describe("The mandatory heading for this section."),
    body: z.string().describe("A very detailed, multi-paragraph explanation of the concept suitable for a beginner. Must include real-world analogies and step-by-step logic."),
    codeSample: z.string().optional().describe("An optional, complete, runnable, and well-commented C++ code sample specifically for this section. Omit for non-technical sections like introductions."),
  })).min(4).describe("The mandatory array of at least 4 detailed lesson sections."),
  keyTakeaways: z.array(z.string()).min(4).describe("A mandatory list of at least 4 key takeaways summarizing the main points."),
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
      ["system", `You are an expert Computer Science professor designing a lesson for an online learning platform like Coursera. 
      Your audience is absolute beginners preparing for technical interviews. Your task is to provide an in-depth, high-quality lesson in a structured JSON format.`],
      ["human", `
      Topic: "{topic}".

      Please create a comprehensive lesson based on this topic. The lesson must be structured as follows:
      1.  **Title**: An engaging and clear title for the lesson.
      2.  **Sections**: At least four detailed sections. Each section must contain:
          - A clear \`heading\`.
          - A detailed, multi-paragraph \`body\` of text that explains the concept in depth. Use real-world analogies.
          - For sections explaining a technical concept, you **MUST** include a \`codeSample\`. This should be a complete, runnable, and well-commented C++ program. For introductory or summary sections, you can omit the \`codeSample\`. Ensure at least two sections in total have a \`codeSample\`.
      3.  **Key Takeaways**: A list of at least four concise summary points.

      The content must be thorough and beginner-friendly, providing a solid foundation on the topic.
      `],
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
      ["system", `You are a patient and encouraging tutor. A student has struggled with a quiz. Your task is to generate a simpler, more focused remedial lesson in a structured JSON format. The lesson should be as detailed and clear as a main lesson but focus only on the problem areas.`],
      ["human", `A student scored {score} on a quiz about "{topic}". They particularly struggled with questions about these concepts: {wrongQuestions}. 
      
      Please create a simplified but detailed remedial lesson that re-explains these specific points. Your lesson must contain:
      1.  **Title**: A clear title, such as "Reviewing {topic}".
      2.  **Sections**: At least four detailed sections. For each section:
          - Use a clear \`heading\`.
          - Write a detailed \`body\` that breaks down the concept simply. Use a new analogy to explain it.
          - For technical sections, include a simple, well-commented \`codeSample\`. Ensure at least two sections have a code sample.
      3.  **Key Takeaways**: Summarize the most critical points in a short list of at least four items.
      
      The tone must be supportive and help rebuild the student's confidence.`],
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

const reportSchema = z.object({
  studentPerformanceSummary: z.string().describe("A brief, one-paragraph summary of the student's overall performance, mentioning trends over time."),
  strengths: z.array(z.string()).describe("A list of 2-3 key topics or areas where the student has demonstrated strong understanding."),
  areasForImprovement: z.array(z.string()).describe("A list of 2-3 specific topics where the student struggled, based on failed quiz attempts."),
  actionableSuggestions: z.array(z.string()).describe("A list of 2-3 concrete, actionable suggestions for the student to improve their understanding in the identified weak areas.")
});

const reportChain = llm.withStructuredOutput(reportSchema);

export async function generateReport(student, attempts) {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an expert educational analyst. Your task is to provide a concise, insightful performance report for a student based on their quiz history. The output must be in a structured JSON format."],
      ["human", `Analyze the quiz attempt history for the student named {studentName}.
      
      Here is their attempt data: {attemptData}
      
      Based on this data, please generate a performance report that includes:
      1. A brief summary of their overall performance.
      2. 2-3 key strengths.
      3. 2-3 areas for improvement.
      4. 2-3 actionable suggestions for them.
      Focus on patterns and specific topics derived from the module titles.`
      ],
    ]);

    const chain = prompt.pipe(reportChain);

    const formattedAttempts = attempts.map(a => ({
      module: a.moduleId.title,
      score: a.score,
      passed: a.passed,
      date: a.createdAt.toDateString()
    }));

    const result = await chain.invoke({
      studentName: student.username,
      attemptData: JSON.stringify(formattedAttempts, null, 2)
    });
    
    return result;

  } catch (err) {
    console.error("Error in generateReport:", err);
    throw new apiError(500, `LLM generateReport failed: ${err.message}`);
  }
}