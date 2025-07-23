import express from "express";
import { env } from "node:process";

const PORT = env.PORT || 3000;

const app = express();

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
