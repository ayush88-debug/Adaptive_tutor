// Backend/src/models/users.model.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// create user schema - with email verification and role
const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date
}, {timestamps: true});

// Hash password before saving in DB
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

// validate password method
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password)
}

// generate access token method (now includes role)
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

// generate 6-digit verification code
userSchema.methods.generateVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    this.verificationToken = crypto.createHash("sha256").update(code).digest("hex");
    this.verificationTokenExpires = Date.now() + 5 * 60 * 60 * 1000; // 5 hours
    return code; // return plain code to send via email
}


const User = mongoose.model('User', userSchema);
export default User;
