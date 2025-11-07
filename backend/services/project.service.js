import Project from "../models/project.model.js";
import mongoose from "mongoose";

export const createProject = async (name, userId) => {
    if (!name || !userId) {
        throw new Error('Project name and User ID are required');
    }

    const project = await Project.create({ name, users: [userId] });
    return project;
}

export const getAllProjectsByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    const allUserProjects = await Project.find({ users: userId });
    return allUserProjects;
}

export const addUserToProject = async ({ users, userId, projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }

    const project = await Project.findById({
        _id: projectId,
        users: userId
    });
    if (!project) {
        throw new Error("Project not found or user not belongs to this project")
    }

    const updatedProject = await Project.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject;

};

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }
    const project = await Project.findOne({ _id: projectId }).populate('users');
    if (!project) {
        throw new Error("Project not found")
    }
    return project;
}