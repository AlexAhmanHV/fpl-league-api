import path from "path";

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import { FPLNotFoundError, getClient } from "./fplClient";
import openapiSpec from "./openapi.json";
import * as services from "./services";

export function createApp() {
  const app = express();
  app.use(cors());

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.use(express.static(path.join(__dirname, "..", "public")));

  const client = getClient();

  const asyncHandler =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
      fn(req, res).catch(next);
    };

  app.get(
    "/leagues/:league_id/standings",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      res.json(await services.leagueStandings(client, leagueId));
    })
  );

  app.get(
    "/leagues/:league_id/history",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      res.json(await services.leagueRankHistory(client, leagueId));
    })
  );

  app.get(
    "/leagues/:league_id/chips",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      res.json(await services.leagueChipTracker(client, leagueId));
    })
  );

  app.get(
    "/leagues/:league_id/chip-status",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      res.json(await services.leagueChipStatus(client, leagueId));
    })
  );

  app.get(
    "/leagues/:league_id/captains",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      const eventId = req.query.event_id
        ? Number(req.query.event_id)
        : await services.getCurrentEventId(client);
      res.json(await services.leagueCaptainAnalysis(client, leagueId, eventId));
    })
  );

  app.get(
    "/leagues/:league_id/transfers",
    asyncHandler(async (req, res) => {
      const leagueId = Number(req.params.league_id);
      const eventId = req.query.event_id
        ? Number(req.query.event_id)
        : await services.getCurrentEventId(client);
      res.json(await services.leagueTransfers(client, leagueId, eventId));
    })
  );

  app.get(
    "/head-to-head",
    asyncHandler(async (req, res) => {
      const entryA = Number(req.query.entry_a);
      const entryB = Number(req.query.entry_b);
      if (!entryA || !entryB) {
        res.status(400).json({ detail: "entry_a and entry_b are required" });
        return;
      }
      if (entryA === entryB) {
        res.status(400).json({ detail: "entry_a and entry_b must differ" });
        return;
      }
      res.json(await services.headToHead(client, entryA, entryB));
    })
  );

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof FPLNotFoundError) {
      res.status(404).json({ detail: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  });

  return app;
}
