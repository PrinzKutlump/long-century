const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, "dist");
const entryHtml = path.join(distDir, "long-century.html");

app.use(express.static(distDir, { index: "index.html" }));

app.get("*", (_req, res) => {
  if (fs.existsSync(entryHtml)) {
    return res.sendFile(entryHtml);
  }
  return res.status(503).send("Build output missing. Run npm run build first.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`The Long Century listening on http://0.0.0.0:${port}`);
});
