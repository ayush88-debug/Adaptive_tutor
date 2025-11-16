import axios from "axios";
import { apiError } from "../utils/apiError.js";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// Map our app's language strings to Judge0 language IDs
const LANGUAGE_IDS = {
    'cpp': 54,      // C++ (GCC 9.2.0)
    'java': 62,     // Java (OpenJDK 13.0.1)
    'python': 71    // Python (3.8.1)
};

// Helper function to safely decode Base64
const decodeBase64 = (str) => {
    if (!str) return null;
    try {
        return Buffer.from(str, 'base64').toString('utf-8');
    } catch (e) {
        return str;
    }
}

/**
 * Runs code via the Judge0 API.
*/
export const runCode = async (language, sourceCode, stdin) => {
    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
        throw new apiError(400, `Unsupported language: ${language}`);
    }

    const options = {
        method: 'POST',
        url: JUDGE0_API_URL,
        params: { base64_encoded: 'true', wait: 'true' }, 
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
            language_id: languageId,
            source_code: Buffer.from(sourceCode).toString('base64'),
            stdin: Buffer.from(stdin || "").toString('base64')
        }
    };

    try {
        const response = await axios.request(options);
        const result = response.data;

        // Decode all outputs
        const decodedStdout = decodeBase64(result.stdout);
        const decodedStderr = decodeBase64(result.stderr);
        const decodedCompileOutput = decodeBase64(result.compile_output);
        const decodedMessage = decodeBase64(result.message);

        let output = "";
        if (decodedStdout) {
            output += decodedStdout;
        }
        // Combine all error-like outputs into one
        if (decodedStderr) {
            output += `\nRuntime Error:\n${decodedStderr}`;
        }
        if (decodedCompileOutput) {
             output += `\nCompilation Error:\n${decodedCompileOutput}`;
        }
        if (decodedMessage) {
            output += `\nMessage:\n${decodedMessage}`;
        }

        return {
            output: output.trim(),
            status: result.status, // { id: 3, description: "Accepted" }
            time: result.time,
            memory: result.memory
        };

    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("Judge0 Error:", errorData);
        throw new apiError(500, "Failed to execute code via external service", [errorData]);
    }
};