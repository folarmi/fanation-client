// src/components/post-card/MediaAttachments.tsx
//
// The blob-URL caching/cleanup logic here is carried over from the old
// project's MediaPreviewGrid (that's the part worth keeping — getting this
// wrong leaks object URLs). The rendering is new: a compact horizontal strip
// rather than a full 2x2 grid, since this sits inside a comment box, not a
// full-width post composer.

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/ui";

export function MediaAttachments({
  files,
  onRemove,
  totalMB,
  maxMB = 50,
}: {
  files: File[];
  onRemove: (index: number) => void;
  totalMB?: string;
  maxMB?: number;
}) {
  const urlCacheRef = useRef<Map<File, string>>(new Map());
  const [urlMap, setUrlMap] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    const cache = urlCacheRef.current;
    const nextCache = new Map<File, string>();
    files.forEach((file) => {
      nextCache.set(file, cache.get(file) ?? URL.createObjectURL(file));
    });
    cache.forEach((url, file) => {
      if (!nextCache.has(file)) URL.revokeObjectURL(url);
    });
    urlCacheRef.current = nextCache;
    setUrlMap(new Map(nextCache));
  }, [files]);

  useEffect(() => {
    return () => {
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    };
  }, []);

  if (files.length === 0) return null;

  const isNearLimit = totalMB !== undefined && Number(totalMB) > maxMB * 0.8;

  return (
    <div className="col gap6" style={{ marginTop: 8 }}>
      {totalMB !== undefined && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <span
            className="t12"
            style={{ color: isNearLimit ? "var(--coral-ink)" : "var(--muted)" }}
          >
            {totalMB}MB / {maxMB}MB
          </span>
        </div>
      )}

      <div className="row gap8" style={{ overflowX: "auto" }}>
        {files.map((file, i) => {
          const url = urlMap.get(file);
          if (!url) return null;
          const isVisual =
            file.type.startsWith("image/") || file.type.startsWith("video/");

          if (isVisual) {
            return (
              <div
                key={i}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  overflow: "hidden",
                  position: "relative",
                  flex: "none",
                }}
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <video
                    src={url}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Remove file"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon n="x" s={12} c="#fff" />
                </button>
              </div>
            );
          }

          const isAudio = file.type.startsWith("audio/");
          const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
          return (
            <div
              key={i}
              className="row gap8 pill"
              style={{ padding: "6px 10px", flex: "none" }}
            >
              {isAudio ? (
                <audio
                  controls
                  src={url}
                  style={{ height: 28, maxWidth: 160 }}
                />
              ) : (
                <>
                  <span className="tag t12" style={{ padding: "1px 6px" }}>
                    {ext}
                  </span>
                  <span
                    className="t12 muted"
                    style={{
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Remove file"
              >
                <Icon n="x" s={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
