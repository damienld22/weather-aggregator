import express from "express";
import { env } from "node:process";
import { MeteocielAdapter } from "./MeteocielAdapter.ts";

const PORT = env.PORT || 3000;

const app = express();

app.get("/", (_, res) => {
  res.send("Hello world");
});

app.get("/rain", async (_, res) => {
  const meteocielAdapter = new MeteocielAdapter();
  const rainData = await meteocielAdapter.getNext24HoursRain();
  res.json(rainData);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
