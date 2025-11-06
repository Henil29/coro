import { Router } from "express";
import { createProject, getAllProjects } from "../controllers/project.controller.js";
import { body } from 'express-validator';
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/create",
    isAuth,
    body('name').isString().withMessage('Project name is required'),
    createProject)

router.get('/all', isAuth, getAllProjects);
router.put('/add-user',isAuth)

export default router;