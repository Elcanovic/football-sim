import {
  AGENTS_CATALOG,
  type CareerState,
  CATALOG,
  type DevelopmentProfile,
  executeDecisionAndSimulate,
  fireCurrentAgent,
  type GameMode,
  hireNewAgent,
  initPlayerCareer,
  type Position,
  renegotiateWageWithCurrentAgent,
} from "./index.ts";

let currentState: CareerState | null = null;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // API Routes
  if (url.pathname === "/api/catalog") {
    return jsonResponse({
      countries: CATALOG.countries.map((c) => ({
        fifa_code: c.fifa_code,
        iso_alpha2: c.iso_alpha2,
        name: c.name_en,
        flag_url: c.flag_url,
        confederation: c.confederation,
        international_reputation: c.international_reputation,
      })),
    });
  }

  if (url.pathname === "/api/start" && req.method === "POST") {
    const body = await req.json();
    const {
      seed = `career-${Date.now()}`,
      mode = "normal",
      lastName = "Valente",
      preferredNumber = 10,
      preferredFoot = "right",
      nationalityIso = "AR",
      position = "ST",
      developmentProfile = "normal",
      secondNationalityIso,
    } = body;

    currentState = initPlayerCareer(
      seed,
      mode as GameMode,
      lastName,
      Number(preferredNumber),
      preferredFoot as "left" | "right",
      nationalityIso,
      position as Position,
      developmentProfile as DevelopmentProfile,
      secondNationalityIso,
    );

    return jsonResponse(currentState);
  }

  if (url.pathname === "/api/decision" && req.method === "POST") {
    if (!currentState) {
      return jsonResponse({ error: "No active career." }, 400);
    }
    const body = await req.json();
    const { optionId } = body;
    currentState = executeDecisionAndSimulate(currentState, optionId);
    return jsonResponse(currentState);
  }

  if (url.pathname === "/api/agents") {
    return jsonResponse(AGENTS_CATALOG);
  }

  if (url.pathname === "/api/agent/hire" && req.method === "POST") {
    if (!currentState) {
      return jsonResponse({ error: "No active career." }, 400);
    }
    const body = await req.json();
    const { agentId } = body;
    currentState = hireNewAgent(currentState, agentId);
    return jsonResponse(currentState);
  }

  if (url.pathname === "/api/agent/fire" && req.method === "POST") {
    if (!currentState) {
      return jsonResponse({ error: "No active career." }, 400);
    }
    currentState = fireCurrentAgent(currentState);
    return jsonResponse(currentState);
  }

  if (url.pathname === "/api/agent/renegotiate" && req.method === "POST") {
    if (!currentState) {
      return jsonResponse({ error: "No active career." }, 400);
    }
    const result = renegotiateWageWithCurrentAgent(currentState);
    currentState = result.state;
    return jsonResponse(result);
  }

  if (url.pathname === "/api/state") {
    return jsonResponse(currentState ?? { error: "No career active" });
  }

  // Static Assets from src/web
  let filePath = url.pathname;
  if (filePath === "/" || filePath === "/index.html" || filePath === "/standalone.html") {
    filePath = "/standalone.html";
  } else {
    filePath = `/src/web${filePath}`;
  }

  try {
    const cleanPath = "." + filePath;
    const file = await Deno.readFile(cleanPath);

    // Dev-only: inject the Agentation toolbar when AGENTATION=1 (never in the offline build)
    if (filePath === "/standalone.html" && Deno.env.get("AGENTATION") === "1") {
      const html = new TextDecoder().decode(file)
        .replace("</body>", '<script type="module" src="/agentation-dev.js"></script></body>');
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const ext = cleanPath.substring(cleanPath.lastIndexOf("."));
    return new Response(file, {
      headers: { "Content-Type": MIME_TYPES[ext] || "text/plain" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
};

const port = 8000;
console.log(`\n🚀 Enhanced Football Simulator running at http://localhost:${port}\n`);

Deno.serve({ port, handler });
