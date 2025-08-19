// Backend/src/services/llm.service.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { apiError } from "../utils/apiError.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

const llm = new ChatGoogleGenerativeAI({
  model: MODEL,
  temperature: 0,      // deterministic for lesson/quiz generation
  maxRetries: 2,
});

/**
 * Helper: try to extract strict JSON from a longer LLM text
 */
function safeParseJson(possibleJsonText) {
  if (!possibleJsonText || typeof possibleJsonText !== "string") {
    throw new Error("Empty LLM response");
  }
  // find first { and last }
  const first = possibleJsonText.indexOf("{");
  const last = possibleJsonText.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in LLM output");
  }
  const jsonStr = possibleJsonText.slice(first, last + 1);
  return JSON.parse(jsonStr);
}

/**
 * Generate a structured lesson for `seedTopic`.
 * Output: { title, sections:[{heading,body}], codeSamples:[string], keyTakeaways:[string] }
 */
export async function generateLesson(seedTopic, { user } = {}) {
  try {
    const systemMsg = [
      "system",
      `You are an expert Computer Science tutor. Produce a single JSON object ONLY (no extra text)
       with keys: title, sections (array of {heading, body}), codeSamples (array of strings), keyTakeaways (array of strings).
       Keep the lesson concise (approx 500-800 words). For code samples, produce valid C++ code if topic is C++ related.`
    ];

    const userMsg = [
      "human",
      `Create a lesson for the topic: "${seedTopic}".
       Student profile (if available): ${user ? JSON.stringify({ id: user._id, role: user.role, username: user.username }) : "{}"}.
       Output must be valid JSON ONLY with the schema described above.`
    ];

    const aiMsg = await llm.invoke([systemMsg, userMsg]);
    const text = aiMsg?.content || aiMsg; // aiMsg is AIMessage
    const parsed = safeParseJson(text);
    // attach small metadata to help debugging
    parsed._meta = { model: MODEL, generatedAt: new Date().toISOString() };
    return parsed;
  } catch (err) {
    throw new apiError(500, `LLM generateLesson failed: ${err.message}`);
  }
}

/**
 * Generate a quiz (10 questions) from lesson object.
 * Output: { questions: [{text, options:[...], correctIndex, explanation}, ...] }
 */
export async function generateQuizFromLesson(lesson, moduleId) {
  try {
    const systemMsg = [
      "system",
      `You are a quiz generator. Output ONLY valid JSON with key "questions", an array of exactly 10 question objects.
       Each question object must have: text (string), options (array of 3-4 strings), correctIndex (integer 0..n-1), explanation (string).`
    ];

    const userMsg = [
      "human",
      `Create 10 multiple-choice questions (MCQs) for the lesson titled: "${lesson.title}".
       Use the lesson sections and codeSamples to create practical questions. Return JSON only.`
    ];

    const aiMsg = await llm.invoke([systemMsg, userMsg]);
    const text = aiMsg?.content || aiMsg;
    const parsed = safeParseJson(text);

    // Basic validation
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 10) {
      throw new Error("Quiz JSON malformed or not 10 questions");
    }

    return parsed;
  } catch (err) {
    throw new apiError(500, `LLM generateQuizFromLesson failed: ${err.message}`);
  }
}

/**
 * Generate a remedial lesson using the quiz content and the specific attempt details
 * Return same lesson schema as generateLesson
 */
export async function generateRemedialLesson(quiz, attempt) {
  try {
    const wrongQuestionIds = attempt.answers.filter(a => !a.correct).map(a => a.questionId);
    const systemMsg = [
      "system",
      `You are a patient tutor. Produce a JSON object ONLY with keys: title, sections, codeSamples, keyTakeaways.
       This should be a simpler, remedial lesson focused on the student's mistakes.`
    ];

    const userMsg = [
      "human",
      `Student scored ${attempt.score} on quiz for module ${attempt.moduleId}.
       The student got wrong question ids: ${JSON.stringify(wrongQuestionIds)}.
       Quiz questions (with options and explanations): ${JSON.stringify(quiz.questions)}
       Produce a remedial lesson that explains common misconceptions, step-by-step examples, and 2 micro-exercises.
       Output plain JSON as described.`
    ];

    const aiMsg = await llm.invoke([systemMsg, userMsg]);
    const parsed = safeParseJson(aiMsg?.content || aiMsg);
    parsed._meta = { model: MODEL, remedialForAttempt: attempt._id };
    return parsed;
  } catch (err) {
    throw new apiError(500, `LLM generateRemedialLesson failed: ${err.message}`);
  }
}

/**
 * Generate a final report for a user given attempts array.
 * Output: { title, summary, strengths:[], weaknesses:[], recommendations:[] }
 */
export async function generateReport(user, attempts = []) {
  try {
    const systemMsg = [
      "system",
      `You are an educational analyst. Produce a JSON object ONLY with keys:
       title, summary, strengths (array), weaknesses (array), recommendations (array).`
    ];

    const userMsg = [
      "human",
      `Create a performance report for student: ${user.username || user.email}.
       Attempts summary: ${JSON.stringify(attempts.map(a => ({ moduleId: a.moduleId, score: a.score, passed: a.passed })))}
       Output JSON only.`
    ];

    const aiMsg = await llm.invoke([systemMsg, userMsg]);
    const parsed = safeParseJson(aiMsg?.content || aiMsg);
    parsed._meta = { model: MODEL, generatedAt: new Date().toISOString() };
    return parsed;
  } catch (err) {
    throw new apiError(500, `LLM generateReport failed: ${err.message}`);
  }
}
