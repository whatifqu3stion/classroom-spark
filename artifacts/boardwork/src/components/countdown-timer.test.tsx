import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdownTimer } from "./countdown-timer";

const START_TIME = new Date("2026-08-24T12:00:00.000Z");

type MockAudio = {
  close: ReturnType<typeof vi.fn>;
};

const audioInstances: MockAudio[] = [];

class MockAudioContext {
  currentTime = 0;
  destination = {};

  constructor() {
    audioInstances.push({ close: vi.fn() });
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  close() {
    return Promise.resolve();
  }
}

function TimerHarness({
  durationMinutes = 2,
  alarmEnabled = true,
}: {
  durationMinutes?: number;
  alarmEnabled?: boolean;
}) {
  const timer = useCountdownTimer({
    durationMinutes,
    alarmEnabled,
  });

  return (
    <div>
      <output data-testid="status">{timer.status}</output>
      <output data-testid="remaining">{timer.remainingSeconds}</output>
      <output data-testid="alarm">{String(timer.alarmActive)}</output>
      <button type="button" onClick={timer.startTimer}>
        Start or resume
      </button>
      <button type="button" onClick={timer.pauseTimer}>
        Pause
      </button>
      <button type="button" onClick={timer.resetTimer}>
        Reset
      </button>
      <button type="button" onClick={() => timer.adjustTimer(-60)}>
        Minus one minute
      </button>
      <button type="button" onClick={() => timer.adjustTimer(60)}>
        Add one minute
      </button>
      <button type="button" onClick={timer.dismissAlarm}>
        Dismiss alarm
      </button>
    </div>
  );
}

function readTimer() {
  return {
    status: screen.getByTestId("status").textContent,
    remaining: Number(screen.getByTestId("remaining").textContent),
    alarmActive: screen.getByTestId("alarm").textContent === "true",
  };
}

function advanceClock(milliseconds: number) {
  vi.setSystemTime(new Date(Date.now() + milliseconds));
}

function notifyVisibilityChange() {
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("useCountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME);
    audioInstances.length = 0;
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses the absolute deadline after pause and resume", () => {
    render(<TimerHarness durationMinutes={2} />);

    fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
    expect(readTimer()).toMatchObject({ status: "running", remaining: 120 });

    advanceClock(10_250);
    notifyVisibilityChange();
    expect(readTimer()).toMatchObject({ status: "running", remaining: 110 });

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(readTimer()).toMatchObject({ status: "paused", remaining: 110 });

    advanceClock(30_000);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(readTimer()).toMatchObject({ status: "paused", remaining: 110 });

    fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
    advanceClock(110_000);
    notifyVisibilityChange();
    expect(readTimer()).toMatchObject({
      status: "completed",
      remaining: 0,
      alarmActive: true,
    });
  });

  it("catches up from the deadline when a running timer becomes visible", () => {
    render(<TimerHarness durationMinutes={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
    advanceClock(45_500);
    notifyVisibilityChange();

    expect(readTimer()).toMatchObject({ status: "running", remaining: 15 });

    advanceClock(14_500);
    notifyVisibilityChange();
    expect(readTimer()).toMatchObject({
      status: "completed",
      remaining: 0,
      alarmActive: true,
    });
  });

  it.each(["idle", "paused", "running", "completed"] as const)(
    "supports both one-minute adjustments while %s",
    (state) => {
      render(<TimerHarness durationMinutes={2} />);

      if (state === "paused") {
        fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
        fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      } else if (state === "running") {
        fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
      } else if (state === "completed") {
        fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
        advanceClock(120_000);
        notifyVisibilityChange();
      }

      const expectedBefore = state === "completed" ? 0 : 120;
      expect(readTimer().remaining).toBe(expectedBefore);

      fireEvent.click(screen.getByRole("button", { name: "Minus one minute" }));
      expect(readTimer().remaining).toBe(state === "completed" ? 0 : 60);
      expect(readTimer().status).toBe(state);

      fireEvent.click(screen.getByRole("button", { name: "Add one minute" }));
      expect(readTimer().remaining).toBe(state === "completed" ? 60 : 120);
      expect(readTimer().status).toBe(state === "completed" ? "paused" : state);
      expect(readTimer().alarmActive).toBe(false);
    },
  );

  it("clamps idle adjustments at zero and can recover with a positive adjustment", () => {
    render(<TimerHarness durationMinutes={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Minus one minute" }));
    expect(readTimer()).toMatchObject({ status: "idle", remaining: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Add one minute" }));
    expect(readTimer()).toMatchObject({ status: "idle", remaining: 60 });
  });

  it("resets idle, paused, running, and completed timers to a clean idle session", () => {
    const states = ["idle", "paused", "running", "completed"] as const;

    for (const state of states) {
      const { unmount } = render(<TimerHarness durationMinutes={1} />);

      if (state === "paused" || state === "running" || state === "completed") {
        fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
      }
      if (state === "paused") {
        fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      }
      if (state === "completed") {
        advanceClock(60_000);
        notifyVisibilityChange();
      }

      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(readTimer()).toMatchObject({
        status: "idle",
        remaining: 60,
        alarmActive: false,
      });
      unmount();
    }
  });

  it("does not play a disabled alarm, starts it when enabled, repeats, and stops on dismiss", () => {
    const { rerender } = render(<TimerHarness durationMinutes={1} alarmEnabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
    advanceClock(60_000);
    notifyVisibilityChange();
    expect(readTimer().alarmActive).toBe(true);
    expect(audioInstances).toHaveLength(0);

    rerender(<TimerHarness durationMinutes={1} alarmEnabled />);
    expect(audioInstances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(audioInstances).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss alarm" }));
    act(() => {
      vi.advanceTimersByTime(16_000);
    });
    expect(audioInstances).toHaveLength(2);
  });

  it("keeps a dismissed completion alarm inactive", () => {
    render(<TimerHarness durationMinutes={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Start or resume" }));
    advanceClock(60_000);
    notifyVisibilityChange();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss alarm" }));

    expect(readTimer()).toMatchObject({
      status: "completed",
      remaining: 0,
      alarmActive: false,
    });
  });
});