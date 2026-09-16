import { motion } from "framer-motion";
import { type PropsWithChildren } from "react";

// Animated gradient-text headline (a React Bits "Gradient Text" style
// treatment), built with a plain CSS background-position keyframe rather
// than pulling the library in.
export function GradientHeading({ children }: PropsWithChildren) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="animate-gradient-x bg-[length:200%_auto] bg-gradient-to-r from-accent via-cyan-300 to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent"
    >
      {children}
    </motion.h1>
  );
}
