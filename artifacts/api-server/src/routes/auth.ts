import { Router } from "express";
import {
  handleAuthStatus,
  handleLogin,
  handleLogout,
} from "../middlewares/auth";

const router = Router();

router.get("/auth/status", handleAuthStatus);
router.post("/auth/login", handleLogin);
router.post("/auth/logout", handleLogout);

export default router;
