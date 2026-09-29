// src/components/post-card/MentionDropdown.tsx
//
// Same behavior as the old project's MentionDropdown (keyboard-highlighted
// list, floats next to the "@", closes on outside click) — none of its
// markup. Built entirely from the new design's Avatar/card/row/t13 system.

import { useEffect, useRef } from "react";
import { Avatar } from "@/lib/ui";
import type { DropdownPosition, MentionUser } from "@/hooks/useMentions";

export function MentionDropdown({
  candidates,
  isLoading,
  highlightedIndex,
  position,
  onSelect,
  onClose,
}: {
  candidates: MentionUser[];
  isLoading: boolean;
  highlightedIndex: number;
  position: DropdownPosition;
  onSelect: (user: MentionUser) => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[highlightedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onMouseDown={onClose}
      />
      <ul
        ref={listRef}
        role="listbox"
        className="card"
        style={{
          position: "fixed",
          top: position.top + 24,
          left: position.left,
          zIndex: 50,
          minWidth: 220,
          maxWidth: 300,
          maxHeight: 208,
          overflowY: "auto",
          padding: 6,
          listStyle: "none",
        }}
      >
        {isLoading && (
          <li className="muted t13" style={{ padding: "10px 12px" }}>
            Loading…
          </li>
        )}

        {!isLoading && candidates.length === 0 && (
          <li className="muted t13" style={{ padding: "10px 12px" }}>
            No users found
          </li>
        )}

        {candidates.map((user, i) => (
          <li
            key={user.usid}
            role="option"
            aria-selected={i === highlightedIndex}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent textarea blur before insertion
              onSelect(user);
            }}
            className="row gap10"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              cursor: "pointer",
              background:
                i === highlightedIndex ? "var(--fill)" : "transparent",
            }}
          >
            <Avatar
              name={user.displayName}
              src={user.profileImageUrl}
              size={30}
            />
            <div className="col" style={{ minWidth: 0 }}>
              <span
                className="t13 b6"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.displayName}
              </span>
              <span
                className="muted t12"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{user.username}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
