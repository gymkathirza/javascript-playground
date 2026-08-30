import type { ConsoleLine } from "../lib/runner";

type Props = {
  lines: ConsoleLine[];
};

export function ConsolePanel({ lines }: Props) {
  return (
    <section className="console" aria-labelledby="console-h">
      <h2 id="console-h">Console</h2>
      <div role="log" aria-live="polite" aria-relevant="additions" className="console-log">
        {lines.length === 0 ? (
          <p className="hint">Run a file to see native module output.</p>
        ) : (
          lines.map((line, i) => (
            <p key={i} className={`line ${line.kind}`}>
              {line.text}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
