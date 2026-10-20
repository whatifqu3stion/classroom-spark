import type { RequestHandler } from "express";
import {
  AI_KEY_HEADER,
  AI_USAGE_HEADER,
  AIRequestError,
  validateAIKey,
  withAIRequest,
  type AIUsage,
} from "@workspace/integrations-openai-ai-server";

export const byokContext: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const key = validateAIKey(req.headers[AI_KEY_HEADER]);
    delete req.headers[AI_KEY_HEADER];
    const usage: AIUsage = {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      unreportedRequests: 0,
    };
    const json = res.json;
    res.json = function (body) {
      if (usage.requests > 0)
        this.setHeader(AI_USAGE_HEADER, JSON.stringify(usage));
      return json.call(this, body);
    };
    withAIRequest(key, usage, next);
  } catch (error) {
    delete req.headers[AI_KEY_HEADER];
    if (error instanceof AIRequestError)
      res.status(error.status).json({ error: error.message });
    else next(error);
  }
};
