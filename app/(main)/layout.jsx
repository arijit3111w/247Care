import React from "react";
import { GsapReveal } from "@/components/gsap-reveal";

const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto my-20">
      <GsapReveal stagger={0.1} direction="up">
        <div className="reveal-target">
          {children}
        </div>
      </GsapReveal>
    </div>
  );
};

export default MainLayout;
