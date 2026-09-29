// src/components/post-card/SchedulePicker.tsx
//
// The new design's version of the old DateTimePicker. Same technique: a
// visible chip shows the formatted value, and a transparent native
// <input type="date"> / <input type="time"> sits on top of it, so a tap opens
// the device's own picker (which is what you want on a phone). The
// differences: it's controlled by plain props instead of react-hook-form's
// Controller, it's built from the project's `.btn` chip instead of Tailwind,
// and past dates can't be picked (`min`).

import type { CSSProperties, MouseEvent } from "react";
import { Icon } from "@/lib/ui";
import {
  formatScheduleDate,
  formatScheduleTime,
  localDateISO,
  localTimeHHMM,
} from "@/utils/schedule";

// The input fills the chip but is invisible — no pointer-events:none, or the
// tap wouldn't reach it.
const overlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
};

// Desktop browsers only open the picker from the little built-in icon unless
// asked; showPicker() makes a click anywhere on the chip do it. Not every
// browser supports it, so failure is fine — native focus behaviour still works.
const openPicker = (event: MouseEvent<HTMLInputElement>) => {
  const input = event.currentTarget;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      /* unsupported, or not a user gesture */
    }
  }
};

export function SchedulePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const today = localDateISO();

  return (
    <div className="row gap8" style={{ width: "100%" }}>
      <div className="grow" style={{ position: "relative", minWidth: 0 }}>
        <div
          className="btn btn-ghost"
          style={{
            width: "100%",
            justifyContent: "center",
            color: date ? undefined : "var(--muted)",
          }}
        >
          <Icon n="cal" s={15} />
          {formatScheduleDate(date)}
        </div>
        <input
          type="date"
          aria-label="Schedule date"
          value={date}
          min={today}
          onChange={(e) => onDateChange(e.target.value)}
          onClick={openPicker}
          style={overlay}
        />
      </div>

      <div className="grow" style={{ position: "relative", minWidth: 0 }}>
        <div
          className="btn btn-ghost"
          style={{
            width: "100%",
            justifyContent: "center",
            color: time ? undefined : "var(--muted)",
          }}
        >
          {formatScheduleTime(time)}
        </div>
        <input
          type="time"
          aria-label="Schedule time"
          value={time}
          // Only "today" needs a floor; a later date can be any time.
          min={date === today ? localTimeHHMM() : undefined}
          onChange={(e) => onTimeChange(e.target.value)}
          onClick={openPicker}
          style={overlay}
        />
      </div>
    </div>
  );
}
