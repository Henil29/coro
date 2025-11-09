import 'dotenv/config';

import http from 'http';
import app from './app.js';
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Project from './models/project.model.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        socket.project = await Project.findById(projectId);

        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'));
        }
        socket.user = decoded;
        next();
    }
    catch (err) {
        next(err);
    }
});

io.on('connection', socket => {
    console.log('New client connected:', socket.id);
    socket.join(socket.project._id);

    socket.on('project-message', data => {
        console.log('Received project-message:', data);
        socket.broadcast.to(socket.project._id).emit('project-message', data);
    });

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { /* … */ });
});

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});