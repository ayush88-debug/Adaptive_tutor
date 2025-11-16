import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({
    limit:'20kb'
}))

app.use(express.urlencoded({
    extended : true,
    limit : '20kb'
}))

app.use(cookieParser())



import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.route.js'
import subjectRoutes from './routes/subject.route.js'
import moduleRoutes from './routes/module.route.js'
import quizRoutes from './routes/quiz.route.js'

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);

app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/quizzes', quizRoutes);


import attemptRoutes from './routes/attempt.route.js';
import teacherRoutes from './routes/teacher.route.js';

app.use('/api/v1/attempts', attemptRoutes);
app.use('/api/v1/admin', teacherRoutes);


import reportRoutes from './routes/report.route.js';
import progressRoutes from './routes/progress.route.js'; 

app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/progress', progressRoutes);

import codeRoutes from './routes/code.route.js';
app.use('/api/v1/code', codeRoutes);

export default app;