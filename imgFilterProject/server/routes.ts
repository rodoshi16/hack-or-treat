import { Express, Request, Response } from "express";
import { pool } from "./pg";

export function setupRoutes(app: Express) {
  app.post("/api/gifs", async (req: Request, res: Response) => {
    try {
      const { gifBase64, filterType, roastText } = req.body as { gifBase64: string; filterType: string; roastText?: string };
      if (!gifBase64 || !filterType) return res.status(400).json({ error: "gifBase64 and filterType required" });

      const base64Data = gifBase64.replace(/^data:image\/gif;base64,/, "");
      const gifBuffer = Buffer.from(base64Data, "base64");

      const result = await pool.query(
        "insert into gifs (gif_data, filter_type) values ($1, $2) returning id",
        [gifBuffer, filterType]
      );
      const id = result.rows[0].id as string;

      if (roastText) {
        await pool.query("insert into roasts (gif_id, roast_text) values ($1, $2)", [id, roastText]);
      }

      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/gifs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rows } = await pool.query("select gif_data from gifs where id = $1", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "not found" });
      const data: Buffer = rows[0].gif_data;
      res.setHeader("Content-Type", "image/gif");
      res.send(data);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
}


