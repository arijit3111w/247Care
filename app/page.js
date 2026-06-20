"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Spline from '@splinetool/react-spline';
import { Globe } from "@/components/ui/globe";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const pillRef = useRef(null);
  const splineWrapRef = useRef(null);
  const btnWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pill animation
      gsap.fromTo(
        pillRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      // Heading stagger
      const headingLines = headingRef.current?.querySelectorAll(".heading-line");
      if (headingLines) {
        gsap.fromTo(
          headingLines,
          { opacity: 0, y: 80, rotateX: -15 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1,
            stagger: 0.15,
            delay: 0.4,
            ease: "power3.out",
          }
        );
      }

      // Buttons
      if (btnWrapRef.current) {
        gsap.fromTo(
          btnWrapRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 1.0, ease: "power3.out" }
        );
      }

      // Spline container
      gsap.fromTo(
        splineWrapRef.current,
        { opacity: 0, scale: 0.85, x: 60 },
        { opacity: 1, scale: 1, x: 0, duration: 1.2, delay: 0.8, ease: "power3.out" }
      );
      // Features Section (3D Cards)
      gsap.fromTo(
        ".feature-wrapper",
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".features-section",
            start: "top 70%",
          },
        }
      );

      // How It Works Steps
      gsap.fromTo(
        ".step-item",
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".how-it-works-section",
            start: "top 60%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Custom 3D Card Component
  const FeatureCard3D = ({ title, badge, description, tags, transformStyle, index }) => (
    <div className="feature-wrapper h-[450px] lg:h-[550px] w-full" style={{ perspective: "1200px" }}>
      <div 
        className="relative w-full h-full rounded-[2rem] p-8 lg:p-12 border border-white/5 bg-[#0a0a0a] overflow-hidden flex flex-col justify-between transition-transform duration-700 ease-out hover:!transform-none group shadow-2xl"
        style={{ transform: transformStyle, transformStyle: "preserve-3d" }}
      >
        {/* Glow Effects */}
        <div className={`absolute top-0 ${index === 0 ? 'right-0' : 'left-0'} w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50`}></div>
        <div className={`absolute bottom-0 ${index === 0 ? 'left-0' : 'right-0'} w-[200px] h-[200px] bg-teal-500/10 blur-[80px] pointer-events-none rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-50`}></div>

        <div className="relative z-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold tracking-widest uppercase mb-8 shadow-sm">
            {badge}
          </div>
          
          <h3 className="text-3xl lg:text-5xl font-semibold text-white mb-6 tracking-tight">
            {title}
          </h3>
          
          <p className="text-neutral-400 text-lg leading-relaxed mb-8 max-w-md font-light">
            {description}
          </p>
          
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag, idx) => (
              <span key={idx} className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-xs font-semibold tracking-wide">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between mt-auto pt-8 border-t border-white/5">
          <button className="flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 text-white text-sm font-semibold group/btn">
            View Details
            <span className="font-bold group-hover/btn:translate-x-1.5 transition-transform">&gt;</span>
          </button>
          <span className="text-neutral-600 font-black tracking-widest uppercase text-3xl opacity-20 select-none">
            0{index + 1}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <main className="bg-background min-h-screen text-foreground font-sans overflow-hidden">
      {/* Premium Dot Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      ></div>

      <section ref={sectionRef} className="relative z-10 w-full min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Typography & CTAs */}
          <div className="flex flex-col items-start justify-center pt-10 lg:pt-0">
            
            {/* Pill Badge */}
            <div 
              ref={pillRef}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold tracking-widest text-emerald-500 uppercase">
                Introducing 24/7 Care
              </span>
            </div>

            {/* Huge Typography */}
            <div ref={headingRef} className="flex flex-col font-black tracking-tight leading-[0.9] text-[4rem] sm:text-[5.5rem] lg:text-[6.5rem] mb-12 uppercase">
              <span className="heading-line text-foreground">BUILDING</span>
              <span className="heading-line text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                DIGITAL
              </span>
              <span className="heading-line text-foreground">HEALTHCARE</span>
            </div>

            {/* Intro text */}
            <p className="heading-line text-muted-foreground text-lg sm:text-xl max-w-lg leading-relaxed mb-10 border-l-2 border-emerald-500/50 pl-4 font-light">
              Experience the future of medicine. A seamless platform connecting you with top specialists, smart diagnostics, and a complete pharmacy network.
            </p>

            {/* Buttons */}
            <div ref={btnWrapRef} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Link 
                href="/onboarding" 
                className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-300 font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-900/20"
              >
                Start Your Journey
                <span className="font-bold">&gt;</span>
              </Link>
              <Link 
                href="/doctors" 
                className="w-full sm:w-auto bg-transparent border border-emerald-500/30 text-foreground hover:bg-emerald-500/10 transition-colors duration-300 font-medium px-8 py-4 rounded-full flex items-center justify-center gap-2 text-base"
              >
                View Specialists
                <span className="font-bold">&gt;</span>
              </Link>
            </div>
            
          </div>

          {/* Right Column: Spline DNA */}
          <div className="relative w-full h-[500px] lg:h-[700px] flex items-center justify-center lg:justify-end">
            
            {/* The Badge matching PB Portfolio */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 animate-spin-slow flex items-center justify-center">
                <div className="w-4 h-4 bg-[#0B0A0A] rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-neutral-300">Built with Spline</span>
            </div>

            {/* Floating Tags */}
            <div className="absolute top-1/4 left-0 lg:-left-12 z-20 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest uppercase shadow-lg transform -rotate-6">
              Doctors
            </div>
            <div className="absolute bottom-1/4 right-0 lg:-right-4 z-20 px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400 text-xs font-bold tracking-widest uppercase shadow-lg transform rotate-3">
              Pharmacy
            </div>

            {/* Spline Wrapper with interceptor to stop zooming */}
            <div 
              ref={splineWrapRef} 
              className="w-full h-full relative z-10"
              onWheelCapture={(e) => {
                // Prevent the scroll event from reaching the canvas (stops Spline zoom)
                // but allow the rest of the page to scroll normally!
                e.stopPropagation();
              }}
            >
              <Spline scene="https://prod.spline.design/HZ1l5NSibwSu1d6U/scene.splinecode" />
            </div>

          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="features-section relative z-10 w-full py-32 bg-neutral-950 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-emerald-900/20 blur-[120px] pointer-events-none rounded-full"></div>
        
        <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
          <div className="mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">The Ecosystem</h2>
            <p className="text-muted-foreground text-xl max-w-2xl font-light">
              A scalable healthcare platform featuring real-time video consultations, live local pharmacy stock broadcasting, and an incentivized doctor network.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FeatureCard3D 
              index={0}
              badge="For Patients & Chemists"
              title="Medicine Locator"
              description="A large-scale live inventory platform for your city. Chemists manage their stock digitally, and patients can instantly search which nearby shop has their required medicines to avoid unnecessary travel."
              tags={["REACT", "CONVEX", "MAPBOX", "LIVE STOCK"]}
              transformStyle="rotateY(10deg) rotateX(5deg)"
            />
            
            <FeatureCard3D 
              index={1}
              badge="For Doctors & Patients"
              title="Telemedicine Flow"
              description="A seamless consultation environment featuring real-time HD video appointments, secure medical records, and digital prescriptions. Doctors earn credits sustainably for every consultation they provide."
              tags={["NEXT.JS", "VONAGE SDK", "CLERK AUTH", "WEB RTC"]}
              transformStyle="rotateY(-5deg) rotateX(2deg)"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section relative z-10 w-full py-32 bg-[#050505] border-t border-white/5 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-900/10 blur-[150px] pointer-events-none rounded-full transform -translate-y-1/2"></div>

        <div className="max-w-[90rem] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <div className="order-2 lg:order-1 relative z-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold tracking-widest uppercase mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              The Journey
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Connecting the <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Medical World</span>
            </h2>
            
            <p className="text-neutral-400 text-xl mb-16 font-light max-w-lg leading-relaxed">
              Our platform ensures nobody travels unnecessarily, saving time and delivering care instantly through a globally connected ecosystem.
            </p>

            <div className="relative space-y-2 lg:pl-2">
              {/* Vertical connecting line */}
              <div className="absolute left-[27px] top-[40px] bottom-[40px] w-px bg-gradient-to-b from-emerald-500/50 via-teal-500/20 to-transparent hidden sm:block"></div>
              
              {[
                { step: "01", title: "Claim Your Profile", desc: "Instantly sign up as a Patient, Doctor, or Chemist. Our intelligent onboarding routes you to a completely tailored dashboard equipped with exactly what you need." },
                { step: "02", title: "The Global Network", desc: "Doctors provide premium care via encrypted HD video. Chemists dynamically broadcast live medicine stock to a geo-fenced radius of patients." },
                { step: "03", title: "Instant Solutions", desc: "Patients receive digital prescriptions and can view exactly which nearby pharmacy has their medications in stock, saving hours of unnecessary travel." }
              ].map((item, i) => (
                <div key={i} className="step-item relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start group">
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-[#0a0a0a] border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-lg group-hover:border-emerald-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-300 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] mt-1">
                    {item.step}
                  </div>
                  <div className="pt-2 pb-10">
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-emerald-400 transition-colors duration-300">{item.title}</h3>
                    <p className="text-neutral-400 text-lg leading-relaxed font-light max-w-md">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 relative h-[500px] lg:h-[700px] w-full rounded-[2rem] bg-gradient-to-b from-emerald-900/10 to-[#0a0a0a] border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-emerald-900/5 mix-blend-overlay"></div>
            
            {/* The Interactive Globe Component */}
            <div className="absolute inset-0 flex items-center justify-center w-full h-full scale-[1.4] lg:scale-[1.6]">
              <Globe className="pointer-events-auto" />
            </div>

            <div className="absolute top-8 left-8 right-8 flex justify-between items-center pointer-events-none z-20">
                <div className="px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-xl">
                    <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Live Network</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-xl">
                  <span className="text-white text-xs font-bold tracking-widest uppercase opacity-80">Syncing</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
                </div>
            </div>

            <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                <div className="px-6 py-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl max-w-[280px]">
                  <p className="text-white font-bold text-lg mb-1">Global Scale</p>
                  <p className="text-neutral-400 text-sm font-light">Drag to explore the interconnected nodes of our network</p>
                </div>
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 w-full py-32 bg-emerald-950 flex flex-col items-center justify-center text-center overflow-hidden border-t border-emerald-900/50">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">
            Ready to change healthcare?
          </h2>
          <p className="text-emerald-200/70 text-xl mb-10 max-w-xl mx-auto">
            Join thousands of patients, doctors, and pharmacies building a faster, smarter medical network.
          </p>
          <Link 
            href="/onboarding" 
            className="inline-flex items-center justify-center gap-2 bg-white text-emerald-950 hover:bg-emerald-50 transition-colors duration-300 font-bold px-10 py-5 rounded-full text-lg shadow-xl shadow-emerald-900/50"
          >
            Get Started Now
            <span className="font-black">&gt;</span>
          </Link>
        </div>
      </section>
      
    </main>
  );
}
