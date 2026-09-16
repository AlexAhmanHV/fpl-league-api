import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

// Count-up number, the small polish piece present in most "cool" React UI
// kits (React Bits' CountUp, Aceternity's NumberTicker) — reimplemented
// directly on top of framer-motion's spring/animate primitives.
export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString("sv-SE"));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
