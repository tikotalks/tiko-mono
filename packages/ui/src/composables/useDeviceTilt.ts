import { reactive, onMounted, onBeforeUnmount } from "vue";

type TiltOpts = {
  maxDeg?: number;
  smooth?: number;         // 0..1
  liftPx?: number;
  area?: () => HTMLElement | null;
  source?: "auto" | "sensor" | "pointer";
};

type TiltState = {
  rx: number;  // deg
  ry: number;  // deg
  tz: number;  // px
  source: "sensor" | "pointer" | "none";
};

export function useDeviceTilt(opts: TiltOpts = {}) {
  const maxDeg  = opts.maxDeg  ?? 10;
  const smooth  = opts.smooth  ?? 0.15;
  const liftPx  = opts.liftPx  ?? 8;
  const desired = opts.source  ?? "auto";

  const tilt = reactive<TiltState>({ rx: 0, ry: 0, tz: 0, source: "none" });

  let targetX = 0, targetY = 0;
  let pending = false;

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  function scheduleTick() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(tick);
  }

  function tick() {
    tilt.rx += (targetX - tilt.rx) * smooth;
    tilt.ry += (targetY - tilt.ry) * smooth;
    const activity = Math.abs(tilt.rx) + Math.abs(tilt.ry);
    tilt.tz = activity > 2 ? liftPx : 0;
    pending = false;
  }

  // --- SENSOR (mobile tilt) ---
  function onOrientation(e: DeviceOrientationEvent) {
    // Check if we actually have valid sensor data
    if (e.beta === null || e.gamma === null) {
      console.log('[useDeviceTilt] Device orientation event has null values');
      return;
    }
    
    const beta  = e.beta  ?? 0;  // front/back
    const gamma = e.gamma ?? 0;  // left/right
    targetX = clamp((-beta / 45) * maxDeg,  -maxDeg, maxDeg); // rotateX
    targetY = clamp(( gamma / 45) * maxDeg, -maxDeg, maxDeg); // rotateY
    tilt.source = "sensor";
    scheduleTick();
  }

  // --- POINTER (desktop mouse / touchpad) ---
  function onPointer(e: PointerEvent) {
    const areaEl = opts.area?.() ?? null;
    let cx: number, cy: number, w: number, h: number;

    if (areaEl) {
      const r = areaEl.getBoundingClientRect();
      cx = e.clientX - (r.left + r.width / 2);
      cy = e.clientY - (r.top + r.height / 2);
      w = r.width; h = r.height;
    } else {
      cx = e.clientX - window.innerWidth / 2;
      cy = e.clientY - window.innerHeight / 2;
      w = window.innerWidth; h = window.innerHeight;
    }

    const nx = clamp(cx / (w / 2), -1, 1);
    const ny = clamp(cy / (h / 2), -1, 1);

    targetX = clamp(-ny * maxDeg, -maxDeg, maxDeg); // rotateX
    targetY = clamp( nx * maxDeg, -maxDeg, maxDeg); // rotateY
    tilt.source = "pointer";
    scheduleTick();
  }

  // iOS permission helper (call from a click if you want sensors)
  async function requestPermission(): Promise<"granted"|"denied"|"not-needed"> {
    // @ts-expect-error iOS-only API
    const need = typeof DeviceOrientationEvent !== "undefined" &&  typeof DeviceOrientationEvent.requestPermission === "function";
    if (!need) return "not-needed";
    try {
      // @ts-expect-error
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }

  const reduceMotion = () =>
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  function start() {
    console.log('[useDeviceTilt] Starting device tilt tracking');
    
    if (reduceMotion()) { 
      console.log('[useDeviceTilt] Reduced motion preference detected, disabling tilt');
      tilt.source = "none"; 
      return; 
    }

    const secure     = typeof window !== "undefined" && window.isSecureContext;
    const hasSensor  = typeof window !== "undefined" && "DeviceOrientationEvent" in window;

    console.log('[useDeviceTilt] Environment check:', { secure, hasSensor, desired });

    const wantPointer = desired === "pointer" || desired === "auto";
    const wantSensor  = desired === "sensor"  || (desired === "auto" && hasSensor && secure);

    if (wantPointer) {
      console.log('[useDeviceTilt] Adding pointer move listener');
      window.addEventListener("pointermove", onPointer, { passive: true });
    }
    if (wantSensor) {
      console.log('[useDeviceTilt] Adding device orientation listener');
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
    }
  }

  function stop() {
    window.removeEventListener("deviceorientation", onOrientation as EventListener);
    window.removeEventListener("pointermove", onPointer as EventListener);
    tilt.source = "none";
  }

  onMounted(start);
  onBeforeUnmount(stop);

  return { tilt, requestPermission, start, stop };
}
