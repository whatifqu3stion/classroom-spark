import { Router, type IRouter } from "express";
import {
  GenerateActivityBody,
  GenerateActivityResponse,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";
import { generateAndSaveActivity } from "../services/ai/generation-service";
import { createGenerationProvider } from "../services/ai/provider-factory";
import { GenerationError } from "../services/ai/types";
import { hasAIKey } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();
const inFlightClassIds = new Set<string>();

function errorStatus(error: GenerationError): number {
  switch (error.code) {
    case "invalid_request":
      return 400;
    case "configuration":
      return 503;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "rate_limit":
      return 429;
    case "timeout":
      return 504;
    case "malformed":
    case "provider":
      return 502;
  }
}

router.post("/generate", async (req, res): Promise<void> => {
  if (!hasAIKey()) {
    res.status(400).json({ error: "Add your OpenAI API key in AI settings before creating a board." });
    return;
  }
  const parsed = GenerateActivityBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: "Check the generation details and try again." });
    return;
  }

  if (inFlightClassIds.has(parsed.data.classId)) {
    res
      .status(409)
      .json({ error: "An activity is already being generated for this class." });
    return;
  }

  inFlightClassIds.add(parsed.data.classId);
  try {
    const activity = await generateAndSaveActivity(
      parsed.data,
      createGenerationProvider(),
    );
    res.status(201).json(GenerateActivityResponse.parse(activity));
  } catch (error) {
    if (error instanceof GenerationError) {
      req.log.warn(
        { code: error.code, errorName: error.name },
        "Boardwork generation failed",
      );
      res.status(errorStatus(error)).json({ error: error.message });
      return;
    }

    req.log.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Unexpected Boardwork generation failure",
    );
    res
      .status(502)
      .json({ error: "Boardwork could not generate an activity. Try again." });
  } finally {
    inFlightClassIds.delete(parsed.data.classId);
  }
});

export default router;
