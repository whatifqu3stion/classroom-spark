import { OpenAIGenerationProvider } from "./openai-adapter";
import { type BoardworkGenerationProvider } from "./types";
import { getAIModel } from "@workspace/integrations-openai-ai-server";

export function createGenerationProvider(): BoardworkGenerationProvider {
  return new OpenAIGenerationProvider(getAIModel());
}
