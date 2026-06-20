"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const FloatingDock = ({ items, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-xl border border-emerald-900/20",
        className
      )}
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
        >
          {item}
        </motion.div>
      ))}
    </motion.div>
  );
};
