import { OpenAIGenerationProvider } from "./openai-adapter";
import {
  GenerationError,
  type BoardworkGenerationProvider,
} from "./types";

export function createGenerationProvider(): BoardworkGenerationProvider {
  const model = process.env.AI_MODEL?.trim();
  if (!model) {
    throw new GenerationError(
      "configuration",
      "AI generation is not configured. Set AI_MODEL and try again.",
    );
  }
  return new OpenAIGenerationProvider(model);
}