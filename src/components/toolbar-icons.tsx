// src/components/post-card/toolbar-icons.tsx
//
// `poll` and `mic` don't exist in your Icon component's OUTLINE/SOLID maps —
// and because Icon falls back SILENTLY to the grid glyph for any unrecognized
// name (`OUTLINE[n] ?? OUTLINE.grid`), both were rendering as a grid icon with
// no error to catch it. These two are drawn directly instead, so they render
// correctly no matter what's in your icon set. Same {s, c} shape as Icon,
// dropped in wherever `<Icon n="poll" .../>` or `<Icon n="mic" .../>` was.

export function PollGlyph({
  s = 20,
  c = "currentColor",
}: {
  s?: number;
  c?: string;
}) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={c}
      style={{ flex: "none" }}
    >
      <rect x="3" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="4" width="4" height="16" rx="1" />
      <rect x="17" y="7" width="4" height="13" rx="1" />
    </svg>
  );
}

export function MicGlyph({
  s = 20,
  c = "currentColor",
}: {
  s?: number;
  c?: string;
}) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={c}
      style={{ flex: "none" }}
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
    </svg>
  );
}
