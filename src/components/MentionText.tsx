// src/components/post-card/MentionText.tsx
//
// Replaces the old PostHeader's <MentionLinkText message mentionsMap />.
// I haven't seen MentionLinkText or parseMentions, so this doesn't depend on
// a mentions map: any `@username` at the start of the text or after
// whitespace becomes a link to /creator/<username>. (An "@" inside an email
// address — "a@b.com" — is left alone because it isn't preceded by
// whitespace.) If your old component only linked users that were actually in
// the post's `mentions` list, share it and I'll match that rule.

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function MentionText({ text }: { text: string }) {
  const navigate = useNavigate();
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(/(^|\s)@(\w+)/g)) {
    const at = (match.index ?? 0) + match[1].length; // position of the "@"
    if (at > last) nodes.push(text.slice(last, at));
    const handle = match[2];
    nodes.push(
      <span
        key={`${at}-${handle}`}
        role="link"
        className="blue b6"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation(); // don't trigger the card's own click
          navigate(`/creator/${handle}`);
        }}
      >
        @{handle}
      </span>,
    );
    last = at + 1 + handle.length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}
