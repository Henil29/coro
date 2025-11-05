import { Router } from "express";
import { getUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/", isAuth, getUser);

export default router;