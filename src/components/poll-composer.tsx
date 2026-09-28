// src/components/post-card/PollComposer.tsx
//
// The new design's version of the old project's Poll.tsx. Same rules (2–5
// options, 25 chars each, a question, at least one unit of duration) and the
// exact same payload to `contents`:
//   { message, pollChoices: [{ choice }], pollDuration: { days, hours, minutes }, mentions: [], media: [] }
// It drops react-hook-form / CustomSelect: plain state is plenty for a form
// this size, and native <select>s pick up the `.input` styling for free.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/lib/ui";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useAppStore } from "@/lib/core";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const OPTION_MAX_LENGTH = 25;

// The old project fed these from `pollDaysOptions` etc. in `@/data`; local
// ranges here so this file has no dependency on that module. Adjust freely.
const range = (count: number, step = 1) =>
  Array.from({ length: count }, (_, i) => i * step);
const DAYS = range(8); //          0–7
const HOURS = range(24); //        0–23
const MINUTES = range(12, 5); //   0, 5, … 55

export function PollComposer({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted?: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useAppStore((s) => s.toast);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [duration, setDuration] = useState({ days: 1, hours: 0, minutes: 0 });

  const createPoll = useCustomMutation({
    endpoint: "contents",
    onSuccessCallback: () => {
      queryClient.invalidateQueries({
        queryKey: ["GetContents"],
        exact: false,
      });
      onPosted?.();
      onClose();
    },
    successMessage: () => "Poll posted successfully",
    onError: (err: any) =>
      toast(err?.response?.data?.message || "Could not post poll", "err"),
  });

  const setOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  const addOption = () =>
    setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ""] : prev));
  const removeOption = (index: number) =>
    setOptions((prev) =>
      prev.length > MIN_OPTIONS ? prev.filter((_, i) => i !== index) : prev,
    );

  // Same gate as the old form: a question, and every visible option filled in.
  const canPost =
    question.trim().length > 0 &&
    options.length >= MIN_OPTIONS &&
    options.every((o) => o.trim().length > 0) &&
    !createPoll.isPending;

  const submit = () => {
    const { days, hours, minutes } = duration;
    if (!days && !hours && !minutes) {
      toast("Set at least one duration", "err");
      return;
    }
    if (!question.trim()) {
      toast("Please enter a question", "err");
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < MIN_OPTIONS) {
      toast("Please provide at least 2 options", "err");
      return;
    }

    createPoll.mutate({
      message: question.trim(),
      pollChoices: validOptions.map((choice) => ({ choice })),
      pollDuration: { days, hours, minutes },
      mentions: [],
      media: [],
    });
  };

  const durationField = (
    label: string,
    key: "days" | "hours" | "minutes",
    values: number[],
  ) => (
    <label className="col gap4 grow">
      <span className="muted t12">{label}</span>
      <select
        className="input"
        value={duration[key]}
        onChange={(e) =>
          setDuration((d) => ({ ...d, [key]: Number(e.target.value) }))
        }
      >
        {values.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="card col gap12" style={{ padding: 18 }}>
      <input
        className="input b7"
        placeholder="Ask a question…"
        value={question}
        style={{ fontSize: 17 }}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="col gap8">
        {options.map((opt, i) => (
          <div key={i} className="row gap8">
            <input
              className="input grow"
              placeholder={`Choice ${i + 1}`}
              maxLength={OPTION_MAX_LENGTH}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {options.length > MIN_OPTIONS && (
              <button
                type="button"
                className="muted"
                aria-label={`Remove choice ${i + 1}`}
                onClick={() => removeOption(i)}
              >
                <Icon n="x" s={16} />
              </button>
            )}
          </div>
        ))}

        {options.length < MAX_OPTIONS ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={addOption}
          >
            <Icon n="plus" s={15} />
            Add option
          </button>
        ) : (
          <span className="muted t12">Maximum {MAX_OPTIONS} options</span>
        )}
      </div>

      <div className="col gap8">
        <span className="up muted">Poll duration</span>
        <div className="row gap8">
          {durationField("Days", "days", DAYS)}
          {durationField("Hours", "hours", HOURS)}
          {durationField("Minutes", "minutes", MINUTES)}
        </div>
      </div>

      <div className="row gap10" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
        >
          Cancel poll
        </button>
        <button
          type="button"
          className="btn btn-blue btn-sm"
          disabled={!canPost}
          onClick={submit}
        >
          {createPoll.isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
