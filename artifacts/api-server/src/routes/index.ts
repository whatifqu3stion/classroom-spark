import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appStateRouter from "./app-state";
import classesRouter from "./classes";
import chipsRouter from "./chips";
import activitiesRouter from "./activities";
import generationRouter from "./generation";
import authRouter from "./auth";
import unitsRouter from "./units";
import savedContextRouter from "./saved-context";
import curriculumRouter from "./curriculum";

const router: IRouter = Router();

// Auth routes first (login/status are exempt from requireAuth in middleware)
router.use(authRouter);

router.use(healthRouter);
router.use(appStateRouter);
router.use(classesRouter);
router.use(unitsRouter);
router.use(chipsRouter);
router.use(savedContextRouter);
router.use(curriculumRouter);
router.use(activitiesRouter);
router.use(generationRouter);

export default router;
