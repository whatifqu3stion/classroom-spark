import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appStateRouter from "./app-state";
import classesRouter from "./classes";
import chipsRouter from "./chips";
import activitiesRouter from "./activities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(appStateRouter);
router.use(classesRouter);
router.use(chipsRouter);
router.use(activitiesRouter);

export default router;
