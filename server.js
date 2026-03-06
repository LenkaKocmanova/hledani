import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const resultsDir = path.join(__dirname, "saved-results");

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const safeFilename = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50) || "results";

app.get("/api/search", async (req, res) => {
  const query = (req.query.q || "").toString().trim();

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'." });
  }

  const serpKey = process.env.SERPAPI_KEY;

  if (!serpKey) {
    return res.status(500).json({
      error: "Server is missing SERPAPI_KEY.",
    });
  }

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        api_key: serpKey,
        engine: "google",
        num: 10,
      },
    });

    const items = Array.isArray(data.organic_results)
      ? data.organic_results
      : [];

    const results = items
      .map((item, index) => ({
        position: index + 1,
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
      }))
      .filter((item) => item.title && item.link);

    const fileName = `${Date.now()}-${safeFilename(query)}.json`;
    const filePath = path.join(resultsDir, fileName);
    const payload = { query, results };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

    return res.json({ query, results, savedFile: fileName });
  } catch (error) {
    const message =
      error?.response?.data?.error || error.message || "Unknown error";
    return res.status(500).json({ error: message });
  }
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
