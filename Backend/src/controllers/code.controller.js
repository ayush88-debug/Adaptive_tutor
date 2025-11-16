import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// Map our language strings to Judge0 language IDs
const LANGUAGE_IDS = {
    'cpp': 54,      // C++ (GCC 9.2.0)
    'java': 62,     // Java (OpenJDK 13.0.1)
    'python': 71    // Python (3.8.1)
};

// Helper function to safely decode Base64
const decodeBase64 = (str) => {
    if (!str) return null;
    try {
        // Use Node.js Buffer to decode
        return Buffer.from(str, 'base64').toString('utf-8');
    } catch (e) {
        // If it's not valid Base64, just return the original string
        return str;
    }
}

const executeCode = asyncHandler(async (req, res) => {
    const { language, sourceCode, stdin } = req.body; // Added stdin

    if (!language || !sourceCode) {
        throw new apiError(400, "Language and source code are required");
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
        throw new apiError(400, "Unsupported language");
    }

    const options = {
        method: 'POST',
        url: JUDGE0_API_URL,
        params: { base64_encoded: 'true', wait: 'true' }, 
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, // need to add this to .env
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

        const decodedStdout = decodeBase64(result.stdout);
        const decodedStderr = decodeBase64(result.stderr);
        const decodedCompileOutput = decodeBase64(result.compile_output);
        const decodedMessage = decodeBase64(result.message);

        let output = "";
        if (decodedStdout) {
            output += decodedStdout;
        }
        if (decodedStderr) {
            output += `\nRuntime Error:\n${decodedStderr}`;
        }
        if (decodedCompileOutput) {
             output += `\nCompilation Error:\n${decodedCompileOutput}`;
        }
         if (decodedMessage) {
             output += `\nMessage:\n${decodedMessage}`;
         }

        return res.status(200).json(new apiResponse(200, { 
            output: output || "Execution finished with no output.",
            status: result.status,
            time: result.time,
            memory: result.memory
        }, "Code executed successfully"));

    } catch (error) {
        // Improved error logging
        const errorData = error.response ? error.response.data : error.message;
        console.error("Judge0 Error:", errorData);
        throw new apiError(500, "Failed to execute code via external service", [errorData]);
    }
});

export { executeCode };