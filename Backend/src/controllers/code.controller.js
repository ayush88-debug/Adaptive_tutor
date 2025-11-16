import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { runCode } from "../services/code.service.js"; // Import the new service

const executeCode = asyncHandler(async (req, res) => {
    const { language, sourceCode, stdin } = req.body;

    if (!language || !sourceCode) {
        throw new apiError(400, "Language and source code are required");
    }

    // Call the reusable service
    const result = await runCode(language, sourceCode, stdin);

    return res
    .status(200)
    .json(new apiResponse(200, result, "Code executed successfully"));
});

export { executeCode };