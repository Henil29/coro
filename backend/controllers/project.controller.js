import { getAllProjectsByUserId, createProject as projectService } from "../services/project.service.js";
import { validationResult } from "express-validator";
import { User } from "../models/user.model.js";

export const createProject = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name } = req.body;
    const loggedInUser = await User.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    try {
        const project = await projectService(name, userId);
        res.status(201).json({ message: 'Project created successfully', project });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const getAllProjects = async (req, res) => {
    try {
        const loggedInUser = await User.findOne({ email: req.user.email });
        const allUserProjects = await getAllProjectsByUserId({userId: loggedInUser._id});
        return res.status(200).json({ projects: allUserProjects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}