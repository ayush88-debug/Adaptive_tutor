import User from "../models/users.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from "jsonwebtoken";



const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if(!token){
        throw new apiError(401, "Unauthorized access");
    }

    let decoded;
    try{
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    }catch(err){
        throw new apiError(401, "Unauthorized access");
    }
    
    if(!decoded._id){
        throw new apiError(401, "Unauthorized access");
    }

    const user = await User.findById(decoded._id).select("-password");
    if(!user){
        throw new apiError(404, "User not found");
    }

    req.user = user;
    next();
});

export default verifyJWT;
