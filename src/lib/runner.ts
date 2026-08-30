import { rewriteProject } from "./rewrite";

export type ConsoleKind = "log" | "info" | "warn" | "error";

export type ConsoleLine = {
  kind: ConsoleKind;
  text: string;
};

type ParentMsg = {
  type: "run";
  nonce: number;
  entry: string;
  files: Record<string, string>;
};

function iframeSrcdoc(): string {
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline' blob: data:",
    "connect-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    "img-src 'none'",
    "style-src 'none'",
  ].join("; ");

  return `<!doctype html><html><head>
<meta http-equiv="Content-Security-Policy" content="${csp}">
</head><body>
<script>
(() => {
  const allowed = ["log", "info", "warn", "error"];
  function send(type, nonce, payload) {
    parent.postMessage({ type, nonce, ...payload }, "*");
  }
  function encode(args) {
    return args.map((v) => {
      if (typeof v === "string") return v;
      try { return JSON.stringify(v); } catch { return String(v); }
    }).join(" ");
  }
  window.addEventListener("message", async (ev) => {
    const data = ev.data;
    if (!data || data.type !== "run") return;
    const { nonce, entry, files } = data;
    try {
      allowed.forEach((k) => {
        console[k] = (...args) => send("console", nonce, { kind: k, text: encode(args) });
      });
      window.onerror = (msg) => { send("console", nonce, { kind: "error", text: String(msg) }); return true; };
      window.onunhandledrejection = (e) => send("console", nonce, { kind: "error", text: String(e.reason) });
      const imports = {};
      for (const [path, source] of Object.entries(files)) {
        const blob = new Blob([source], { type: "text/javascript" });
        imports["vfs:///" + path] = URL.createObjectURL(blob);
      }
      const map = document.createElement("script");
      map.type = "importmap";
      map.textContent = JSON.stringify({ imports });
      document.head.appendChild(map);
      const url = imports["vfs:///" + entry];
      if (!url) throw new Error("Entry file missing");
      await import(url);
      send("done", nonce, {});
    } catch (err) {
      send("console", nonce, { kind: "error", text: err && err.message ? err.message : String(err) });
      send("done", nonce, {});
    }
  });
  parent.postMessage({ type: "ready" }, "*");
})();
</script>
</body></html>`;
}

export function prepareRun(
  files: Record<string, string>,
  entry: string,
): { files: Record<string, string> } | { error: string } {
  if (!files[entry]) return { error: "Select a JavaScript file to run" };
  const rewritten = rewriteProject(files);
  if (!rewritten.ok) return { error: rewritten.error };
  return { files: rewritten.files };
}

export function mountSandbox(onLine: (line: ConsoleLine, nonce: number) => void, onReady: () => void): {
  run: (msg: ParentMsg) => void;
  destroy: () => void;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.setAttribute("title", "JavaScript execution sandbox");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.display = "none";
  iframe.srcdoc = iframeSrcdoc();

  const onMessage = (ev: MessageEvent) => {
    if (ev.source !== iframe.contentWindow) return;
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "ready") {
      onReady();
      return;
    }
    if (data.type === "console" && typeof data.nonce === "number") {
      onLine({ kind: data.kind, text: String(data.text ?? "") }, data.nonce);
    }
  };
  window.addEventListener("message", onMessage);
  document.body.appendChild(iframe);

  return {
    run(msg) {
      iframe.contentWindow?.postMessage(msg, "*");
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      iframe.remove();
    },
  };
}
