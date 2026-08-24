import { useEffect, useRef, useState } from "react";

export type CountdownTimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed";

export interface CountdownTimerState {
  status: CountdownTimerStatus;
  remainingSeconds: number;
  alarmActive: boolean;
}

interface UseCountdownTimerOptions {
  durationMinutes: number;
  resetKey?: string;
  alarmEnabled: boolean;
}

const ALARM_REPEAT_MS = 8_000;

function playCalmAlarm() {
  const AudioContextClass =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) return;

  const audio = new AudioContextClass();
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
  gain.connect(audio.destination);

  [523.25, 659.25].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const startAt = now + index * 0.18;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.connect(gain);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.52);
  });

  window.setTimeout(() => {
    void audio.close();
  }, 1_000);
}

export function useCountdownTimer({
  durationMinutes,
  resetKey,
  alarmEnabled,
}: UseCountdownTimerOptions): CountdownTimerState & {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  adjustTimer: (deltaSeconds: number) => void;
  dismissAlarm: () => void;
} {
  const initialSeconds = Math.max(0, durationMinutes * 60);
  const [status, setStatus] = useState<CountdownTimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [alarmActive, setAlarmActive] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const pausedSecondsRef = useRef(initialSeconds);

  useEffect(() => {
    setRemainingSeconds(initialSeconds);
    setStatus("idle");
    setAlarmActive(false);
    endAtRef.current = null;
    pausedSecondsRef.current = initialSeconds;
  }, [initialSeconds, resetKey]);

  useEffect(() => {
    if (status !== "running") return;

    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt === null) return;

      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1_000));
      setRemainingSeconds(next);
      if (next <= 0) {
        endAtRef.current = null;
        pausedSecondsRef.current = 0;
        setStatus("completed");
        setAlarmActive(true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [status]);

  useEffect(() => {
    if (!alarmActive || !alarmEnabled) return;

    playCalmAlarm();
    const interval = window.setInterval(playCalmAlarm, ALARM_REPEAT_MS);
    return () => window.clearInterval(interval);
  }, [alarmActive, alarmEnabled]);

  const startTimer = () => {
    if (remainingSeconds <= 0) return;

    endAtRef.current = Date.now() + remainingSeconds * 1_000;
    pausedSecondsRef.current = remainingSeconds;
    setAlarmActive(false);
    setStatus("running");
  };

  const pauseTimer = () => {
    if (endAtRef.current === null) return;

    const pausedSeconds = Math.max(
      0,
      Math.ceil((endAtRef.current - Date.now()) / 1_000),
    );
    endAtRef.current = null;
    pausedSecondsRef.current = pausedSeconds;
    setRemainingSeconds(pausedSeconds);
    setStatus("paused");
  };

  const resetTimer = () => {
    endAtRef.current = null;
    pausedSecondsRef.current = initialSeconds;
    setAlarmActive(false);
    setRemainingSeconds(initialSeconds);
    setStatus("idle");
  };

  const adjustTimer = (deltaSeconds: number) => {
    const current =
      endAtRef.current === null
        ? remainingSeconds
        : Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1_000));
    const next = Math.max(0, current + deltaSeconds);

    pausedSecondsRef.current = next;
    setRemainingSeconds(next);
    if (status === "running") {
      endAtRef.current = Date.now() + next * 1_000;
    }
    if (next > 0 && status === "completed") {
      setAlarmActive(false);
      setStatus("paused");
    }
  };

  return {
    status,
    remainingSeconds,
    alarmActive,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    dismissAlarm: () => setAlarmActive(false),
  };
}