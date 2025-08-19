// Backend/src/controllers/attempt.controller.js
import Attempt from "../models/attempt.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

const getAttemptsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const attempts = await Attempt.find({ userId }).populate('moduleId', 'title').sort({ createdAt: -1 });
  return res.status(200).json(new apiResponse(200, { attempts }, "Attempts retrieved"));
});

const getAttemptsByModule = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const attempts = await Attempt.find({ moduleId }).populate('userId', 'username email').sort({ createdAt: -1 });
  return res.status(200).json(new apiResponse(200, { attempts }, "Attempts retrieved"));
});

export { getAttemptsByUser, getAttemptsByModule };
