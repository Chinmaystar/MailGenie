import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { prospectsRouter } from "./routes/prospects.js";
import { knowledgeRouter } from "./routes/knowledge.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use(healthRouter);
app.use(campaignsRouter);
app.use(prospectsRouter);
app.use(knowledgeRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[error]", err);
    res.status(500).json({ error: err.message || "internal server error" });
  },
);

app.listen(config.port, () => {
  console.log(`[server] Kelvor Outreach API listening on http://localhost:${config.port}`);
});