import express from "express";

const app = express();
const PORT = 3000;

// autorise ton front local
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/pokepaste/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // le plus simple: endpoint raw
    const url = `https://pokepast.es/${id}/raw`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return res.status(r.status).send("Failed to fetch pokepaste");
    const txt = await r.text();
    res.type("text/plain").send(txt);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
});

app.listen(PORT, () => console.log("Proxy running on http://localhost:" + PORT));
