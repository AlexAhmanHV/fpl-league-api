import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { type PropsWithChildren } from "react";

// Cursor-tracked spotlight hover, in the spirit of Aceternity UI's "Spotlight
// Card" / React Bits "Spotlight Card" — a soft radial highlight that follows
// the pointer, implemented locally rather than pulled in as a dependency.
export function GlowCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(0,255,135,0.08), transparent 70%)`;

  return (
    <motion.div
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-panel p-5 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
