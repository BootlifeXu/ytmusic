export async function handler(event) {
  try {
    const params = event.queryStringParameters || {};
    const { q, videoId } = params;

    // 🎧 AUDIO MODE — Sophos-safe
    if (videoId) {
      const invidious = "https://inv.nadeko.net";

      const infoRes = await fetch(`${invidious}/api/v1/videos/${videoId}`);
      if (!infoRes.ok) {
        return respond(502, { error: "Invidious fetch failed" });
      }

      const info = await infoRes.json();
      const audio = info.adaptiveFormats.find(f => f.type.includes("audio"));

      if (!audio) {
        return respond(404, { error: "No audio stream found" });
      }

      return respond(200, { audioUrl: audio.url });
    }

    // 🔍 SEARCH MODE — Key rotation + quota handling
    if (!q) return respond(400, { error: "Missing query parameter q" });

    const keys = [process.env.YT_KEY_1, process.env.YT_KEY_2].filter(Boolean);

    if (!keys.length) {
      return respond(500, { error: "No API keys configured" });
    }

    let lastError = null;

    for (const key of keys) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(q)}&key=${key}`;

      try {
        const res = await fetch(url);
        const data = await res.text();

        if (res.ok) return respond(200, data, true);

        if (res.status === 403 && data.includes("quota")) {
          lastError = "API key quota exceeded";
          continue;
        }

        return respond(res.status, data, true);

      } catch (err) {
        lastError = err.message;
      }
    }

    return respond(500, { error: "All API keys exhausted", details: lastError });

  } catch (err) {
    return respond(500, { crash: err.message });
  }
}

function respond(status, body, raw = false) {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: raw ? body : JSON.stringify(body)
  };
}
