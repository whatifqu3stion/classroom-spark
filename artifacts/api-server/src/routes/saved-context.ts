import { Router, type IRouter } from "express";
import {
  ArchiveSavedContextParams,
  ArchiveSavedContextResponse,
  CreateContextCategoryBody,
  CreateContextCategoryResponse,
  CreateSavedContextBody,
  CreateSavedContextResponse,
  ListSavedContextsQueryParams,
  ListSavedContextsResponse,
  UpdateSavedContextBody,
  UpdateSavedContextParams,
  UpdateSavedContextResponse,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";
import {
  archiveSavedContext,
  createContextCategory,
  createSavedContext,
  listSavedContextLibrary,
  SavedContextError,
  updateSavedContext,
} from "../lib/saved-context";

const router: IRouter = Router();

function errorStatus(error: SavedContextError): number {
  if (error.code === "not_found") return 404;
  if (error.code === "conflict") return 409;
  return 400;
}

router.get("/saved-context", async (req, res): Promise<void> => {
  const parsed = ListSavedContextsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const library = await listSavedContextLibrary(parsed.data.classId);
    res.json(ListSavedContextsResponse.parse(library));
  } catch (error) {
    if (error instanceof SavedContextError) {
      res.status(errorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/saved-context", async (req, res): Promise<void> => {
  const parsed = CreateSavedContextBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const created = await createSavedContext(parsed.data);
    res.status(201).json(CreateSavedContextResponse.parse(created));
  } catch (error) {
    if (error instanceof SavedContextError) {
      res.status(errorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.patch("/saved-context/:contextId", async (req, res): Promise<void> => {
  const params = UpdateSavedContextParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSavedContextBody.safeParse(
    sanitizeUnicodeValue(req.body),
  );
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const updated = await updateSavedContext(params.data.contextId, parsed.data);
    res.json(UpdateSavedContextResponse.parse(updated));
  } catch (error) {
    if (error instanceof SavedContextError) {
      res.status(errorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post(
  "/saved-context/:contextId/archive",
  async (req, res): Promise<void> => {
    const params = ArchiveSavedContextParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    try {
      const archived = await archiveSavedContext(params.data.contextId);
      res.json(ArchiveSavedContextResponse.parse(archived));
    } catch (error) {
      if (error instanceof SavedContextError) {
        res.status(errorStatus(error)).json({ error: error.message });
        return;
      }
      throw error;
    }
  },
);

router.post("/context-categories", async (req, res): Promise<void> => {
  const parsed = CreateContextCategoryBody.safeParse(
    sanitizeUnicodeValue(req.body),
  );
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const category = await createContextCategory(parsed.data.name);
    res.status(201).json(CreateContextCategoryResponse.parse(category));
  } catch (error) {
    if (error instanceof SavedContextError) {
      res.status(errorStatus(error)).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export default router;