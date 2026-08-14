const { createServer } = require("node:http");
const { randomBytes, createHash } = require("node:crypto");

// Google blocks OAuth in embedded user agents, so signInWithPopup cannot work
// inside Electron. This is the sanctioned alternative: RFC 8252 (OAuth 2.0 for
// Native Apps) — the user signs in in their real browser and Google redirects
// back to a one-shot loopback listener. Google matches loopback redirect URIs
// on host only, so the ephemeral port needs no Cloud Console registration.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TIMEOUT_MS = 5 * 60 * 1000;

const DONE_PAGE = `<!doctype html><meta charset="utf-8">
<title>Apostello</title>
<body style="font:16px system-ui;background:#101415;color:#e0e3e5;display:grid;place-items:center;height:100vh;margin:0">
<p>Signed in. You can close this tab and return to Apostello.</p>`;

const b64url = (buf) => buf.toString("base64url");

function pkce() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function awaitAuthCode({ clientId, challenge, state }) {
  return new Promise((resolve, reject) => {
    let redirectUri;

    const server = createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname !== "/") {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(DONE_PAGE);
      finish();

      if (url.searchParams.get("state") !== state) {
        reject(new Error("OAuth state mismatch"));
      } else if (url.searchParams.get("code")) {
        resolve({ code: url.searchParams.get("code"), redirectUri });
      } else {
        reject(new Error(url.searchParams.get("error") || "No authorization code"));
      }
    });

    const timer = setTimeout(() => {
      finish();
      reject(new Error("Sign-in timed out"));
    }, TIMEOUT_MS);

    function finish() {
      clearTimeout(timer);
      server.close();
    }

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      redirectUri = `http://127.0.0.1:${server.address().port}`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state,
      });
      // Required lazily so this module stays loadable outside Electron.
      require("electron").shell.openExternal(`${AUTH_URL}?${params}`);
    });
  });
}

/**
 * Runs the full flow and returns a Google ID token. The renderer turns it into
 * a Firebase session with signInWithCredential — useAuthUser, useOperatorStatus
 * and the approval gate are untouched, only credential acquisition changes.
 */
async function signInWithGoogle() {
  const clientId = process.env.GOOGLE_DESKTOP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DESKTOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_DESKTOP_CLIENT_ID / GOOGLE_DESKTOP_CLIENT_SECRET are not set — see docs/desktop-migration.md"
    );
  }

  const { verifier, challenge } = pkce();
  const state = b64url(randomBytes(16));
  const { code, redirectUri } = await awaitAuthCode({ clientId, challenge, state });

  // Installed-app clients still send a client_secret here; per RFC 8252 it is
  // not treated as confidential (it ships in the binary), which is why PKCE
  // above is what actually binds the code to this request.
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.id_token) {
    throw new Error(payload.error_description || payload.error || "Token exchange failed");
  }
  return payload.id_token;
}

module.exports = { signInWithGoogle, pkce };
