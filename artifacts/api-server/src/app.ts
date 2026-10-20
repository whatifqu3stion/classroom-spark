import express, { type ErrorRequestHandler, type Express } from "express";
import pinoHttp from "pino-http";
import {
  ACTIVITY_PAYLOAD_TOO_LARGE_ERROR,
  ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
} from "@workspace/api-zod";
import router from "./routes";
import { logger } from "./lib/logger";
import { byokContext } from "./middlewares/byok";
import { serveFrontend } from "./lib/serve-frontend";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Same-origin frontend only; never reflect arbitrary credentialed CORS origins.
app.use("/api", byokContext);
app.use(express.json({ limit: ACTIVITY_REQUEST_BODY_LIMIT_BYTES }));
app.use(
  express.urlencoded({
    extended: true,
    limit: ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
  }),
);
app.use("/api", router);
app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found" }); });
if (process.env.STATIC_DIR) serveFrontend(app, process.env.STATIC_DIR);

const bodyParserErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: ACTIVITY_PAYLOAD_TOO_LARGE_ERROR });
    return;
  }
  next(error);
};

app.use(bodyParserErrorHandler);

export default app;
