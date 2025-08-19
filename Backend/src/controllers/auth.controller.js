import User from "../models/users.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import getEmailTemplate from "../utils/emailTemplate.js";
import sendEmail from "../config/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const signup = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Validate fields
    if (!username || !email || !password) {
        throw new apiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new apiError(400, "User already exists");
    }

    // Create new user and verification code
    const user = new User({ username, email, password });
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Send verification email
    const emailHTML = getEmailTemplate(user.username, verificationCode);
    await sendEmail({
        to: user.email,
        subject: "Verify your email - Code valid for 5 hours",
        html: emailHTML
    });

    const tempToken = jwt.sign(
        { userId: user._id, purpose: "email_verification" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5h" }
    );

    
    return res.status(200).json(
        new apiResponse(200, { verificationToken: tempToken }, "Verification code sent to email")
    );
})

const verifyEmail = asyncHandler(async (req, res) => {
    // validate fields
    const verificationToken = req.header("Authorization")?.replace("Bearer ", "");
    const { verificationCode} = req.body;
    if (!verificationCode || !verificationToken) {
        throw new apiError(400, "Verification code and token are required");
    }
    // decode token
    let payload;
    try {
        payload = jwt.verify(verificationToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new apiError(401, "Invalid or expired verification token");
    }
    // validate token
    if (payload.purpose !== "email_verification" || !payload.userId) {
        throw new apiError(401, "Invalid verification token");
    }


    // find user
    const user = await User.findById(payload.userId);
    if (!user) {
        throw new apiError(404, "User not found");
    }
    // check if user is already verified
    if (user.isVerified) {
        throw new apiError(400, "User already verified. Please try logging in.");
    }

    
    // check if user has verification code
    if (!user.verificationToken || !user.verificationTokenExpires) {
        throw new apiError(400, "No verification code found. Please sign up again.");
    }
    // check if verification code is valid
    if (user.verificationTokenExpires < Date.now()) {
        throw new apiError(400, "Verification code expired. Please sign up again.");
    }
    // hash verification code and check if correct
    const hashedCode = crypto.createHash("sha256").update(verificationCode).digest("hex");
    if (hashedCode !== user.verificationToken) {
        throw new apiError(400, "Invalid verification code");
    }

    // all checks completed, email verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // generate login token
    const loginToken = user.generateAccessToken();
    const options = {
        httpOnly : true,
        secure : true,
    }
    
    return res.status(200)
    .cookie("accessToken", loginToken, options)
    .json(
        new apiResponse(
            200, 
            {
                token: loginToken, 
                user: { 
                    id: user._id, 
                    username: user.username, 
                    email: user.email 
                } 
            }, 
            "Email verified and user logged in"
        )
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
        throw new apiError(400, "Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new apiError(404, "User does not exist");
    }

    // Check password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
        throw new apiError(401, "User credentials are invalid");
    }

    if(user.isVerified){
        // User is verified, proceed with login

        // generate login token
        const loginToken = user.generateAccessToken();
        const options = {
            httpOnly : true,
            secure : true,
        }

        return res.status(200)
        .cookie("accessToken", loginToken, options)
        .json(
            new apiResponse(
                200,
                {
                    token: loginToken,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                },
                "Login successful"
            )
        );

    }
    else{
        // verify user

        // generate verification code
        const verificationCode = user.generateVerificationCode();
        await user.save();

        // Send verification email
        const emailHTML = getEmailTemplate(user.username, verificationCode);
        await sendEmail({
            to: user.email,
            subject: "Verify your email - Code valid for 5 hours",
            html: emailHTML
        });

        const tempToken = jwt.sign(
            { userId: user._id, purpose: "email_verification" },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "5h" }
        );


        return res.status(200).json(
            new apiResponse(200, { verificationToken: tempToken }, "Verification code sent to email")
        );
    }
});

const logout = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .json(new apiResponse(200, {}, "Logout successful"));
})

export { signup, verifyEmail, login, logout };