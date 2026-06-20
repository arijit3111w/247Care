"use client";

import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineDNA() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="w-full h-full relative"
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        }
      >
        <Spline scene="https://prod.spline.design/HZ1l5NSibwSu1d6U/scene.splinecode" />
      </Suspense>
    </motion.div>
  );
}
