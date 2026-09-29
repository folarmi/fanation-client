// src/components/post-card/ConfirmDialog.tsx
//
// The new design's stand-in for the old ConfirmActionModal (same idea: a
// title, a message, Cancel / confirm, and a pending state while the request
// runs). Built from the project's `.overlay` + `.card`, and generic enough to
// reuse for any "are you sure?" prompt.

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  isPending,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    // stopPropagation: this can be rendered inside a card whose own click
    // navigates somewhere — clicking the dialog must not trigger that.
    <div
      className="overlay"
      style={{ background: "rgba(2,4,12,.72)" }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPending) onCancel();
      }}
    >
      <div
        className="card col gap12"
        style={{ padding: 22, width: 380, maxWidth: "92vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="b7 t18">{title}</div>
        <div className="muted t14" style={{ lineHeight: 1.5 }}>
          {message}
        </div>
        <div
          className="row gap10"
          style={{ justifyContent: "flex-end", marginTop: 4 }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-blue btn-sm"
            style={{ background: "var(--coral)", color: "#fff" }}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
