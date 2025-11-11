import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { connectDB } from './db/db.js';

// import routes
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
const app = express();

connectDB();
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));

// use Routes
app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/ai', aiRoutes);

export default app;