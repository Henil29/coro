import Project from "../models/project.model.js";

export const createProject = async (name, userId) => {
    if (!name || !userId) {
        throw new Error('Project name and User ID are required');
    }

    const project = await Project.create({ name, users: [userId] });
    return project;
}

export const getAllProjectsByUserId = async ({userId}) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    const allUserProjects = await Project.find({ users: userId });
    return allUserProjects;
}