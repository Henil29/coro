import { Router } from "express";
import { addUserToProject, createProject, getAllProjects, getProjectById } from "../controllers/project.controller.js";
import { body } from 'express-validator';
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/create",
    isAuth,
    body('name').isString().withMessage('Project name is required'),
    createProject)

router.get('/all', isAuth, getAllProjects);

router.put('/add-user',
    isAuth,
    body('projectId').isString().withMessage('Project ID must be a string'),
    body('users').isArray({ min: 1 }).withMessage('Users must be a non-empty array').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    addUserToProject
)
router.get("/get-project/:projectId", isAuth, getProjectById);

export default router;