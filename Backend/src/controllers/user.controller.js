import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getUser = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new apiError(404, "User not found");
    }
    return res.status(200).json(
        new apiResponse(200, { user }, "User retrieved successfully")
    );
});

export { getUser };