import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import {
  ACTIVITY_PAYLOAD_TOO_LARGE_ERROR,
  ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
} from "@workspace/api-zod";
import router from "./routes";
import { logger } from "./lib/logger";
import { cookieMiddleware, requireAuth } from "./middlewares/auth";

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
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: ACTIVITY_REQUEST_BODY_LIMIT_BYTES }));
app.use(
  express.urlencoded({
    extended: true,
    limit: ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
  }),
);
app.use(cookieMiddleware());
app.use("/api", requireAuth());

app.use("/api", router);

const bodyParserErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: ACTIVITY_PAYLOAD_TOO_LARGE_ERROR });
    return;
  }
  next(error);
};

app.use(bodyParserErrorHandler);

export default app;
