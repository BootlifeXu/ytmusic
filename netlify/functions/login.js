export async function handler(event) {
  try {
    const { username, password } = JSON.parse(event.body || '{}');

    if (!username || !password) {
      return respond(400, { error: 'Missing credentials' });
    }

    if (
      username === process.env.LOGIN_USER &&
      password === process.env.LOGIN_PASS
    ) {
      return respond(200, { success: true });
    }

    return respond(401, { error: 'Invalid login' });

  } catch (err) {
    return respond(500, { error: err.message });
  }
}

function respond(status, body) {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}
