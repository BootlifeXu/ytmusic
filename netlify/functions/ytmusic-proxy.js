export async function handler(event) {
  const q = event.queryStringParameters.q;
  const pageToken = event.queryStringParameters.pageToken || "";

  if (!q) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: 'Missing query parameter "q"' })
    };
  }

  const keys = (process.env.YT_KEYS || "").split(",").filter(Boolean);

  if (!keys.length) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "YT_KEYS not set in environment variables" })
    };
  }

  let lastError = null;

  for (const apiKey of keys) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q + " music");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", "10");
    url.searchParams.set("maxResults", "10");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    url.searchParams.set("key", apiKey);

    try {
      const res = await fetch(url.toString());
      const data = await res.text();

      // If quota exceeded, try next key
      if (res.status === 403 && data.includes("quota")) {
        lastError = data;
        continue;
      }

      return {
        statusCode: res.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: data
      };

    } catch (err) {
      lastError = err.message;
    }
  }

  // All keys failed
  return {
    statusCode: 403,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ error: "All API keys exhausted", details: lastError })
  };
      }
