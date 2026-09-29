// src/hooks/useVoiceRecorder.ts
//
// Ported from the old project's useVoiceRecorder, same API and same messages,
// with the project's toast style (S.toast via useNotify) and two real bugs
// fixed:
//
//  1. CANCEL USED TO DELIVER THE RECORDING. cancelRecording() called
//     recorder.stop(), and onstop unconditionally called onRecordingComplete —
//     so cancelling could attach a stray clip to the post. A `cancelled` flag
//     now makes onstop discard the audio instead.
//
//  2. THE 5-MINUTE AUTO-STOP NEVER WORKED. The timer's callback closed over a
//     stale stopRecording (captured while isRecording was still false), so it
//     silently did nothing at the limit; it also ran side effects inside a
//     setState updater. Everything the timer touches is a ref now.
//
// It also releases the microphone if the component unmounts mid-recording.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotify } from "@/hooks/useNotify";

interface UseVoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number; // seconds
}

export const useVoiceRecorder = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes
}: UseVoiceRecorderProps) => {
  const notify = useNotify();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);
  const cancelledRef = useRef(false);

  // Latest callbacks without re-creating the recorder handlers.
  const onCompleteRef = useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop(); // onstop delivers the blob
    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
  }, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setRecordingTime(elapsedRef.current);
      if (elapsedRef.current >= maxDuration) {
        stopRecording();
        notifyRef.current.info(
          `Maximum recording duration of ${maxDuration / 60} minutes reached`,
        );
      }
    }, 1000);
  }, [maxDuration, stopRecording, stopTimer]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      elapsedRef.current = 0;
      setRecordingTime(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const cancelled = cancelledRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        releaseStream();
        chunksRef.current = [];
        elapsedRef.current = 0;
        setRecordingTime(0);
        if (!cancelled) onCompleteRef.current(blob);
      };

      recorder.start(100); // collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
      notifyRef.current.success("Recording started");
    } catch {
      notifyRef.current.error(
        "Could not access microphone. Please check permissions.",
      );
    }
  }, [releaseStream, startTimer]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      stopTimer();
      notifyRef.current.info("Recording paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      startTimer();
      notifyRef.current.info("Recording resumed");
    }
  }, [startTimer]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    cancelledRef.current = true; // onstop will discard the audio
    if (recorder.state !== "inactive") recorder.stop();
    else releaseStream();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    elapsedRef.current = 0;
    stopTimer();
    notifyRef.current.info("Recording cancelled");
  }, [releaseStream, stopTimer]);

  // Release the microphone if we unmount mid-recording.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      releaseStream();
      stopTimer();
    },
    [releaseStream, stopTimer],
  );

  return {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
};
