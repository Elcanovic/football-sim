// Dev-only Agentation toolbar. Injected by src/server.ts when AGENTATION=1; never bundled into standalone.html.
// Runs in the browser (no bundler / import map), so full CDN URLs are required here.
// deno-lint-ignore-file no-import-prefix
import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { Agentation } from "https://esm.sh/agentation@3.1.2?deps=react@18.3.1,react-dom@18.3.1";

const host = document.createElement("div");
host.id = "agentation-root";
document.body.appendChild(host);
createRoot(host).render(
  React.createElement(Agentation, { endpoint: "http://localhost:4747" }),
);
