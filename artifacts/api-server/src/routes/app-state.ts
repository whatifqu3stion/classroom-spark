import { Router, type IRouter } from "express";
import { GetAppStateResponse } from "@workspace/api-zod";
import { loadAppState } from "../lib/boardwork-repo";

const router: IRouter = Router();

router.get("/app-state", async (req, res): Promise<void> => {
  req.log.info("Loading app state");
  const state = await loadAppState();
  res.json(GetAppStateResponse.parse(state));
});

export default router;
