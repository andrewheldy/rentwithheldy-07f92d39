import { useCallback, useEffect, useRef, useState } from "react";

const POINTER_INTENT_WINDOW_MS = 750;
const MOTION_WINDOW_MS = 220;

export function usePointerMotion() {
  const [motionActive, setMotionActive] = useState(false);
  const pointerIntent = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  const cancelMotion = useCallback(() => {
    clearTimer();
    pointerIntent.current = false;
    setMotionActive(false);
  }, [clearTimer]);

  const markPointerIntent = useCallback(() => {
    clearTimer();
    pointerIntent.current = true;
    timeout.current = setTimeout(() => {
      pointerIntent.current = false;
      timeout.current = null;
    }, POINTER_INTENT_WINDOW_MS);
  }, [clearTimer]);

  const commitMotion = useCallback(() => {
    const shouldAnimate = pointerIntent.current;
    clearTimer();
    pointerIntent.current = false;

    if (!shouldAnimate) {
      setMotionActive(false);
      return;
    }

    setMotionActive(true);
    timeout.current = setTimeout(() => {
      setMotionActive(false);
      timeout.current = null;
    }, MOTION_WINDOW_MS);
  }, [clearTimer]);

  useEffect(
    () => () => {
      clearTimer();
      pointerIntent.current = false;
    },
    [clearTimer],
  );

  return {
    motionActive,
    markPointerIntent,
    cancelMotion,
    commitMotion,
  };
}
