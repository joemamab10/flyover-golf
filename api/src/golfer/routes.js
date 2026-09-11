import { validateFeedback } from "./feedback.js";
import { Router } from "express";
import { InputError, validateProfile, validateRound, validateScore, getStats } from "./service.js";

export function golferRoutes(store) {
  const router = Router();
  router.get("/golfer-profile", async (_req, res) => res.json({ profile: (await store.read()).profile }));
  router.put("/golfer-profile", async (req, res) => {
    const patch = validateProfile(req.body);
    const profile = await store.update(state => (state.profile = { ...state.profile, ...patch }));
    res.json({ profile });
  });
  router.get("/rounds", async (_req, res) => res.json({ rounds: (await store.read()).rounds }));
  router.post("/rounds", async (req, res) => {
    const round = validateRound(req.body);
    if (req.body.score != null) {
      round.score = validateScore(req.body.score, round);
      round.status = "completed";
    }
    if(req.body.feedback!=null)round.feedback=validateFeedback(req.body.feedback,round);
    const requestId = req.body.requestId;
    if (requestId != null && (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId))) throw new InputError("Invalid requestId.");
    const saved = await store.update(state => {
      const existing = requestId && state.rounds.find(row => row.requestId === requestId);
      if (existing) return existing;
      if (requestId) round.requestId = requestId;
      state.rounds.unshift(round);
      return round;
    });
    res.status(201).json({ round: saved });
  });
  router.put("/rounds/:roundId/score", async (req, res) => {
    const round = await store.update(state => {
      const round = state.rounds.find(row => row.id === req.params.roundId);
      if (!round) throw new InputError("Round not found.", 404);
      round.score = validateScore(req.body, round);
      round.status = "completed";
      round.updatedAt = new Date().toISOString();
      return round;
    });
    res.json({ round });
  });
  router.put("/rounds/:roundId/feedback", async(req,res)=>{
    const round=await store.update(state=>{
      const round=state.rounds.find(row=>row.id===req.params.roundId);
      if(!round)throw new InputError("Round not found.",404);
      round.feedback=validateFeedback(req.body,round);round.updatedAt=new Date().toISOString();return round;
    });res.json({round});
  });
  router.get("/stats", async (_req, res) => res.json({ stats: getStats((await store.read()).rounds) }));
  return router;
}
