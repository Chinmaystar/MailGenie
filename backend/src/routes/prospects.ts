import { Router } from "express";
import {
  deleteProspect,
  getProspect,
  updateProspect,
} from "../db/repositories/prospects.js";
import { resendProspect } from "../services/outreach/sendService.js";

export const prospectsRouter = Router();

prospectsRouter.patch("/api/prospects/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = getProspect(id);
  if (!existing) {
    res.status(404).json({ error: "prospect not found" });
    return;
  }

  const patch: Parameters<typeof updateProspect>[1] = {};

  if (req.body.name !== undefined) patch.name = String(req.body.name);
  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      res.status(400).json({ error: "a valid email is required" });
      return;
    }
    patch.email = email;
  }
  if (req.body.company !== undefined) patch.company = String(req.body.company);
  if (req.body.project_description !== undefined)
    patch.project_description = String(req.body.project_description);
  if (req.body.generated_subject !== undefined)
    patch.generated_subject = String(req.body.generated_subject);
  if (req.body.generated_body !== undefined)
    patch.generated_body = String(req.body.generated_body);
  if (req.body.approved !== undefined)
    patch.approved = req.body.approved === true || req.body.approved === 1 || req.body.approved === "1";
  if (req.body.status !== undefined && typeof req.body.status === "string")
    patch.status = req.body.status;

  const result = updateProspect(id, patch);
  if (!result.ok) {
    res.status(409).json({ error: result.error });
    return;
  }
  res.json({ prospect: getProspect(id) });
});

prospectsRouter.post("/api/prospects/:id/resend", async (req, res) => {
  const id = Number(req.params.id);
  if (!getProspect(id)) {
    res.status(404).json({ error: "prospect not found" });
    return;
  }
  const result = await resendProspect(id);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ ok: true, prospect: getProspect(id) });
});

prospectsRouter.delete("/api/prospects/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getProspect(id)) {
    res.status(404).json({ error: "prospect not found" });
    return;
  }
  deleteProspect(id);
  res.json({ ok: true });
});