import express from "express";
import type { Cradle } from "awilix";

export function app({
  port,
  meteocielAdapter,
}: Pick<Cradle, "port" | "meteocielAdapter">) {
  const PORT = port || 3000;

  const app = express();

  app.get("/", (_, res) => {
    res.send("Hello world");
  });

  app.get("/rain", async (_, res) => {
    const rainData = await meteocielAdapter.getNext24HoursRain();
    res.json(rainData);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
