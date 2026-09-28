// src/hooks/useMentions.ts
//
// Headless logic only — ported from the old project's CommentBox.tsx. This
// file has no design opinions in it (no classNames, no markup), so nothing
// here needed to change to respect the new design: it just detects "@" in
// text, fetches candidate users, and computes where a dropdown should sit.
// The dropdown's actual rendering lives in MentionDropdown.tsx instead,
// which IS restyled for the new design.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetData } from "@/hooks/api/use-api";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";

export type MentionUser = {
  usid: string;
  email: string;
  username: string;
  displayName: string;
  fullName: string;
  profileImageUrl?: string;
};

export type DropdownPosition = { top: number; left: number };

/** Merges "people who subscribe to me" and "people I subscribe to" into one
 *  mentionable list, deduplicated. Unchanged from the old project other than
 *  import paths. */
export function useMentionUsers() {
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const { data: creatorSubscriptionsData, isLoading: loadingCreator } =
    useGetData({
      url: `subscriptions/creator/${userObject?.usid}/subscribers?page=0&size=20`,
      queryKey: ["GetSubscriptions"],
      enabled: !!userObject?.usid,
    });

  const { data: viewerSubscriptionsData, isLoading: loadingViewer } =
    useGetData({
      url: `subscriptions?page=0&size=20&subscriberEmail=${userObject?.email}`,
      queryKey: ["GetSubscriptionsForViewer"],
    });

  const mentionableUsers = useMemo<MentionUser[]>(() => {
    const seen = new Set<string>();
    const result: MentionUser[] = [];
    const add = (u: any) => {
      if (!u?.usid || seen.has(u.usid)) return;
      if (u.usid === userObject?.usid) return;
      seen.add(u.usid);
      result.push({
        usid: u.usid,
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        fullName: u.fullName,
        profileImageUrl: u.profileImageUrl,
      });
    };

    const toArray = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data?.content)) return data.data.content;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.content)) return data.content;
      return [];
    };

    toArray(creatorSubscriptionsData).forEach((s) => add(s.subscriber));
    toArray(viewerSubscriptionsData).forEach((s) => add(s.creator));

    return result;
  }, [creatorSubscriptionsData, viewerSubscriptionsData, userObject?.usid]);

  return { mentionableUsers, isLoading: loadingCreator || loadingViewer };
}

/** "@" detection, filtering, keyboard nav, and insertion. Unchanged from the
 *  old project — this is exactly the kind of logic that shouldn't need to
 *  differ between design systems. */
export function useMentions(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  mentionableUsers: MentionUser[],
) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<MentionUser[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({
    top: 0,
    left: 0,
  });

  const filteredUsers = useMemo<MentionUser[]>(() => {
    if (mentionQuery === null) return [];
    if (!mentionQuery.trim()) return mentionableUsers.slice(0, 8);
    const q = mentionQuery.toLowerCase();
    return mentionableUsers
      .filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [mentionQuery, mentionableUsers]);

  const computeDropdownPosition = useCallback(
    (textarea: HTMLTextAreaElement, atIndex: number): DropdownPosition => {
      const mirror = document.createElement("div");
      const style = window.getComputedStyle(textarea);

      [
        "boxSizing",
        "width",
        "height",
        "overflowX",
        "overflowY",
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "fontStyle",
        "fontVariant",
        "fontWeight",
        "fontStretch",
        "fontSize",
        "fontSizeAdjust",
        "lineHeight",
        "fontFamily",
        "textAlign",
        "textTransform",
        "textIndent",
        "textDecoration",
        "letterSpacing",
        "wordSpacing",
        "tabSize",
      ].forEach((prop) => {
        (mirror.style as any)[prop] = (style as any)[prop];
      });

      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.style.whiteSpace = "pre-wrap";
      mirror.style.wordWrap = "break-word";
      document.body.appendChild(mirror);

      const textBefore = textarea.value.slice(0, atIndex);
      mirror.textContent = textBefore;
      const span = document.createElement("span");
      span.textContent = "@";
      mirror.appendChild(span);

      const mirrorRect = mirror.getBoundingClientRect();
      const spanRect = span.getBoundingClientRect();
      const textareaRect = textarea.getBoundingClientRect();

      document.body.removeChild(mirror);

      const top =
        spanRect.top -
        mirrorRect.top +
        parseInt(style.paddingTop) -
        textarea.scrollTop +
        textareaRect.top;
      const left =
        spanRect.left -
        mirrorRect.left +
        parseInt(style.paddingLeft) +
        textareaRect.left;

      return { top, left };
    },
    [],
  );

  const handleTextareaChange = useCallback(
    (value: string, cursorPos: number) => {
      const textBeforeCursor = value.slice(0, cursorPos);
      const match = textBeforeCursor.match(/@(\w*)$/);

      if (match) {
        setMentionQuery(match[1]);
        const atIndex = cursorPos - match[0].length;
        setMentionStart(atIndex);
        setHighlightedIndex(0);
        requestAnimationFrame(() => {
          const textarea = textareaRef.current;
          if (textarea)
            setDropdownPos(computeDropdownPosition(textarea, atIndex));
        });
      } else {
        setMentionQuery(null);
      }
    },
    [computeDropdownPosition, textareaRef],
  );

  const pickMention = useCallback(
    (
      user: MentionUser,
      currentValue: string,
      onChange: (v: string) => void,
    ) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart ?? currentValue.length;
      const before = currentValue.slice(0, mentionStart);
      const after = currentValue.slice(cursorPos);
      const inserted = `@${user.username} `;

      onChange(before + inserted + after);

      const newCursor = mentionStart + inserted.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      });

      setSelectedMentions((prev) =>
        prev.find((m) => m.usid === user.usid) ? prev : [...prev, user],
      );
      setMentionQuery(null);
    },
    [mentionStart, textareaRef],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      currentValue: string,
      onChange: (v: string) => void,
    ) => {
      if (mentionQuery === null || filteredUsers.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % filteredUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (i) => (i - 1 + filteredUsers.length) % filteredUsers.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(filteredUsers[highlightedIndex], currentValue, onChange);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
      }
    },
    [mentionQuery, filteredUsers, highlightedIndex, pickMention],
  );

  return {
    mentionQuery,
    filteredUsers,
    highlightedIndex,
    dropdownPos,
    selectedMentions,
    handleTextareaChange,
    handleKeyDown,
    pickMention,
    closeMentionDropdown: () => setMentionQuery(null),
    mentionIds: selectedMentions.map((m) => m?.email),
  };
}
