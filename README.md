# JavaScript module playground

In-browser playground for **native ES (ECMAScript) modules**: `import` / `export` across `.js` and `.mjs` files. Unlike [RunJS Play](https://runjs.app/play), this is a multi-file project, not a single `eval` buffer.

Anonymous, static, no login, no application server.

## Try it (GitHub Pages — validation)

After Pages is enabled: https://gymkathirza.github.io/javascript-playground/

```bash
npm install
npm test
npm run dev
```

Dev URL uses Vite’s local server. Production builds assume the GitHub Pages base path `/javascript-playground/`.

Drag the vertical bars between the file tree, editor, and console to resize them (sizes are remembered in this browser).

**IntelliSense (Intelligent Sense):** completions, hover types, and diagnostics come from the open-source [TypeScript](https://www.typescriptlang.org/) language service plus [@valtown/codemirror-ts](https://github.com/val-town/codemirror-ts) in CodeMirror. That covers JavaScript and JSDoc across your project files. Standard library types load from `playgroundcdn.typescriptlang.org` on first use (allowed in `_headers` `connect-src`). If that fetch fails, project-file completions still work.

## Hosting plan

1. **Now:** GitHub Pages for validation (this repo). Pages cannot send real `Content-Security-Policy (CSP)` *headers*; sandbox isolation still applies in the iframe.
2. **Next:** Harden, then deploy the same build to **Cloudflare Pages** (free) so `_headers` is enforced at the edge.
3. **Later:** Extract `src/lib` as an npm package. This app stays `private` until then.

## Safety model

User code never runs on the app origin. It runs in an opaque iframe (`sandbox="allow-scripts"` only). Relative `./` and `../` imports are rewritten to a virtual module graph; remote and npm specifiers are rejected. Max **1 MiB (Mebibyte)** per file (UTF-8 bytes), 32 files, session JSON ≤ 1.5M characters. Session restore does **not** auto-run.

## Accessibility

UI follows [WAI-ARIA 1.2](https://www.w3.org/WAI/standards-guidelines/aria/) and the [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/): tree, tabs, menu button, modal dialogs, console live region.

## License

MIT (Massachusetts Institute of Technology). See [LICENSE](LICENSE). Dependencies keep their own licenses.

Runtime licenses we use:

- **MIT / ISC** — same freedom (use, change, sell; keep the notice). MIT is this project. ISC is `@valtown/codemirror-ts` (shorter wording).
- **Apache-2.0** — TypeScript; same use/change/sell, plus NOTICE / patent terms.

No GPL (GNU General Public License) / copyleft runtime dependencies. JSZip is dual-licensed MIT OR GPL-3.0-or-later; this project uses the MIT grant.

## Glossary

| Term | Expansion | In this project |
| --- | --- | --- |
| ESM | ECMAScript Module | Native `import` / `export` |
| CSP | Content-Security-Policy | Browser allow-list for scripts and network |
| ARIA | Accessible Rich Internet Applications | Roles, states, and keyboard patterns |
| VFS | Virtual File System | In-browser folder tree, not a real disk |
| APG | ARIA Authoring Practices Guide | How to implement ARIA widgets |
| IntelliSense | Intelligent Sense | Editor completions, hover, and diagnostics |
| OSI | Open Source Initiative | Defines approved free/open licenses |
| GPL | GNU General Public License | Copyleft license we do not take as a runtime dep |
| ISC | Internet Systems Consortium | Same freedom as MIT; shorter wording |
