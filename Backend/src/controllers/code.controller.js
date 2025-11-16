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

const executeCode = asyncHandler(async (req, res) => {
    const { language, sourceCode } = req.body;

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
        params: { base64_encoded: 'false', fields: '*' }, // wait=true is handled by axios differently or we poll. 
        // For simplicity in this tier, we use the synchronous '?wait=true' feature of Judge0 if available, 
        // but standard practice is to submit -> get token -> get result. 
        // However, Judge0 allows a sync submission via `?base64_encoded=true&wait=true`
        params: { base64_encoded: 'false', wait: 'true' }, 
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, // need to add this to .env
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
            language_id: languageId,
            source_code: sourceCode,
            stdin: ""
        }
    };

    try {
        const response = await axios.request(options);
        const result = response.data;

        // Judge0 returns a 'status' object. ID 3 means "Accepted" (Success).
        // Other IDs indicate errors (Compilation Error, Runtime Error, etc.)
        
        let output = "";
        if (result.stdout) {
            output += result.stdout;
        }
        if (result.stderr) {
            output += `\nError:\n${result.stderr}`;
        }
        if (result.compile_output) {
             output += `\nCompilation:\n${result.compile_output}`;
        }

        return res.status(200).json(new apiResponse(200, { 
            output: output || "No output",
            status: result.status,
            time: result.time,
            memory: result.memory
        }, "Code executed successfully"));

    } catch (error) {
        console.error("Judge0 Error:", error);
        throw new apiError(500, "Failed to execute code via external service");
    }
});

export { executeCode };