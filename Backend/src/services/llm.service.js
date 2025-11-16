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
  questions: z.array(
    z.union([
      // --- MCQ Question ---
      z.object({
        type: z.literal("mcq"),
        text: z.string().describe("The mandatory text of the multiple-choice question."),
        options: z.array(z.string()).length(4).describe("A mandatory array of exactly 4 possible answers."),
        correctIndex: z.number().min(0).max(3).describe("The mandatory 0-based index of the correct answer."),
        explanation: z.string().describe("A mandatory, brief explanation of the correct answer.")
      }),
      // --- Coding Question ---
      z.object({
        type: z.literal("coding"),
        text: z.string().describe("The mandatory title or brief description of the coding problem."),
        problemStatement: z.string().describe("The mandatory detailed problem statement for the coding exercise."),
        language: z.enum(["cpp", "java", "python"]).describe("The programming language for the exercise (cpp, java, python)."),
        starterCode: z.string().optional().describe("Optional starter code boilerplate for the student."),
        testCases: z.array(z.object({
          input: z.string().optional().describe("Input for the test case (can be empty string for no input). Use '\\n' for newlines."),
          expectedOutput: z.string().describe("The expected output for the given input. Use '\\n' for newlines.")
        })).min(1).describe("Mandatory array of at least one test case, including input and expected output."),
        explanation: z.string().optional().describe("Optional brief explanation or hint related to the coding problem.")
      })
    ])
  ).length(10).describe("A mandatory array of exactly 10 questions, mixing MCQs and coding exercises where appropriate. *MUST* follow the specified distribution based on subject type. *MUST* add coding questions for technical subjects.")
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
          - For sections explaining a technical concept (like Encapsulation, Inheritance, Polymorphism, Variables, Pointers, etc.), you **MUST** include a \`codeSample\`. This is not optional for technical topics. The code must be a complete, runnable, and well-commented program. For purely introductory or summary sections, you can omit the \`codeSample\`. You must ensure that at least two sections in total have a code sample.
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


// It now accepts a languageKey to force the language
export async function generateQuizFromLesson(lesson, languageKey) {
    try {
        // Map subject key to a language ID recognized by the AI/editor
        // Default to 'cpp' if key is 'oop' or not recognized
        let language;
        switch(languageKey) {
            case 'java':
                language = 'java';
                break;
            case 'python':
                language = 'python';
                break;
            case 'cpp':
            case 'oop': // OOP is taught using C++ in our curriculum
            case 'dsa': // Assume DSA is taught with C++
            default:
                language = 'cpp';
        }
        // For theoretical subjects, we still pass the language, but the prompt
        // gives the AI instructions to only use MCQs.
        const isTechnicalSubject = ['cpp', 'oop', 'dsa', 'java', 'python'].includes(languageKey);


        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are an expert quiz designer for a Computer Science learning platform. Your task is to create a quiz with a mix of Multiple Choice Questions (MCQs) and practical Coding Exercises based on the provided lesson content. The output must be a structured JSON object.`],
            ["human", `
            Lesson Title: "{title}"
            Lesson Content Summary: {contentSummary}
            Subject Language: "{language}"

            Please generate **exactly 10 questions** for this lesson adhering to the following structure:
            
            1.  **Question Mix:**
                - If the subject is technical (like C++, Java, Python, DSA, OOP), you **MUST** include **at least 2** 'coding' type questions. The rest should be 'mcq'.
                - If the subject is theoretical (like OS, DBMS, CN), you should **ONLY** use 'mcq' questions, unless the lesson summary *explicitly* contains code (e.g., SQL queries for DBMS).

            2.  **MCQ Format:** For 'mcq' type: include 'text', 'options' (array of 4 strings), 'correctIndex' (0-3), and 'explanation'.

            3.  **Coding Question Format (CRITICAL):**
                - **language:** You **MUST** set the 'language' field to **"{language}"**. Do not infer; use this exact value.
                - **starterCode:** Provide **ONLY** the necessary boilerplate code (e.g., function signature, main method, imports). The code **MUST** be a complete driver program that reads from standard input (e.g., \`std::cin\`, \`input()\`, \`Scanner\`) for testing. For complex inputs like arrays, it **MUST** follow standard competitive programming format (e.g., first line: size \`n\`, second line: \`n\` space-separated elements). The core logic **MUST** be replaced with a clear comment (e.g., \`// TODO: Write your logic here\` or \`# TODO: Write your logic here\`). **DO NOT** provide the full solution in the starter code.
                - **text:** A short title for the problem (e.g., "Find the Max Element in an Array").
                - **problemStatement:** A detailed problem description.
                - **testCases:** At least 2 test cases. The \`input\` string for each test case **MUST** precisely match the format expected by the \`starterCode\`. (e.g., if starter code reads a size 'n' then 'n' elements, the input string must be: \`"5\\n1 2 3 4 5"\`). Use \`\\n\` for newlines.
            `],
        ]);
        const chain = prompt.pipe(quizChain);


        const contentSummary = lesson.sections.map(s => `${s.heading}: ${s.body.substring(0, 150)}...`).join('\n');

        const result = await chain.invoke({
            title: lesson.title,
            contentSummary: contentSummary,
            language: language // Pass the determined language
        });
        return result;
    } catch (err) {
        console.error("Error in generateQuizFromLesson:", err);
        throw new apiError(500, `LLM generateQuizFromLesson failed: ${err.message}`);
    }
}


// generateRemedialLesson (also updated to pass languageKey)
export async function generateRemedialLesson(quiz, attempt, moduleTitle, languageKey) {
  try {
    // Map language key
    let language;
    switch(languageKey) {
        case 'java':
            language = 'java';
            break;
        case 'python':
            language = 'python';
            break;
        case 'cpp':
        case 'oop':
        case 'dsa':
        default:
            language = 'cpp';
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a patient and encouraging tutor. A student has struggled with a quiz. Your task is to generate a simpler, more focused remedial lesson in a structured JSON format. The lesson should be as detailed and clear as a main lesson but focus only on the problem areas.`],
      ["human", `A student scored {score} on a quiz about "{topic}". They particularly struggled with questions about these concepts: {wrongQuestions}. 
      
      Please create a simplified but detailed remedial lesson that re-explains these specific points. Your lesson must contain:
      1.  **Title**: A clear title, such as "Reviewing {topic}".
      2.  **Sections**: At least four detailed sections. For each section:
          - Use a clear \`heading\`.
          - Write a detailed \`body\` that breaks down the concept simply. Use a new analogy to explain it.
          - For technical sections, include a simple, well-commented \`codeSample\`. Ensure at least two sections have a code sample. This code **MUST** be in the **{language}** language.
      3.  **Key Takeaways**: Summarize the most critical points in a short list of at least four items.
      
      The tone must be supportive and help rebuild the student's confidence.`],
    ]);
    const chain = prompt.pipe(remedialLessonChain);

    const wrongQuestions = attempt.answers
        .filter(a => !a.correct)
        .map(a => {
            const q = quiz.questions.find(q => q._id.toString() === a.questionId.toString());
            return q ? q.text : 'a failed question'; // Get text of failed question
        })
        .filter(Boolean);

    const result = await chain.invoke({
        score: attempt.score,
        topic: moduleTitle,
        wrongQuestions: wrongQuestions.join(', ') || "General review needed",
        language: language
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


const hintSchema = z.object({
  hint: z.string().describe("A concise, 1-2 sentence hint for the student, pointing them to the correct logic without giving the answer.")
});

const hintChain = llm.withStructuredOutput(hintSchema);

export async function generateCodingHint(problemStatement, studentCode, failedTestCase, language) {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert ${language} programming tutor. A student has failed a test case for a coding problem. Your task is to provide a brief, helpful hint.`],
      ["human", `
      Problem Statement:
      """
      {problemStatement}
      """

      Student's Code:
      """
      {studentCode}
      """

      Failed Test Case:
      - Input: "{input}"
      - Expected Output: "{expectedOutput}"
      - Actual Output: "{actualOutput}"

      Please provide a concise, 1-2 sentence hint to help the student identify their mistake (e.g., "Check your loop termination condition," "Think about how integer division works," or "Ensure you are handling the case where the input is empty."). Do not give the solution.
      `],
    ]);
    const chain = prompt.pipe(hintChain);

    const result = await chain.invoke({
        problemStatement: problemStatement,
        studentCode: studentCode,
        input: failedTestCase.input,
        expectedOutput: failedTestCase.expectedOutput,
        actualOutput: failedTestCase.actualOutput,
        language: language
    });
    
    return result.hint;

  } catch (err) {
      console.error("Error in generateCodingHint:", err);
      // Fallback hint in case of AI error
      return "There seems to be an error with your logic. Review the problem statement and test case carefully.";
  }
}