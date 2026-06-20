"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import gsap from "gsap";
import { usePathname } from "next/navigation";

export default function Header() {
  const user = useQuery(api.users.getCurrentUser);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refs for GSAP
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef(null);
  const actionsRef = useRef(null);
  const glowRef = useRef(null);
  const hasAnimated = useRef(false);

  // Credit allocation — once per session
  const hasAllocated = useRef(false);
  const checkAndAllocateCredits = useMutation(api.credits.checkAndAllocateCredits);

  useEffect(() => {
    if (user?.role === "PATIENT" && isSignedIn && !hasAllocated.current) {
      hasAllocated.current = true;
      checkAndAllocateCredits({ plan: "free_user" }).catch(() => {});
    }
  }, [user, isSignedIn, checkAndAllocateCredits]);

  // GSAP entrance animation (progressive enhancement — header is always visible)
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    try {
      const ctx = gsap.context(() => {
        // Header slides in from top
        gsap.from(headerRef.current, {
          y: -40, opacity: 0, duration: 0.7, ease: "power3.out",
        });

        // Logo scales in
        gsap.from(logoRef.current, {
          scale: 0.85, opacity: 0, duration: 0.6, delay: 0.15, ease: "back.out(1.7)",
        });

        // Nav links stagger in
        if (navLinksRef.current) {
          const links = navLinksRef.current.querySelectorAll(".nav-item");
          if (links.length) {
            gsap.from(links, {
              y: -15, opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.3, ease: "power2.out",
            });
          }
        }

        // Actions area fades in
        gsap.from(actionsRef.current, {
          x: 20, opacity: 0, duration: 0.5, delay: 0.4, ease: "power2.out",
        });

        // Ambient glow pulse
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            opacity: 0.4, scale: 1.2, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut",
          });
        }
      });

      return () => ctx.revert();
    } catch (e) {
      // Ensure header is visible even if GSAP fails
      console.warn("GSAP animation failed:", e);
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Build nav items based on role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case "ADMIN":
        return [{ label: "Admin", href: "/admin" }];
      case "DOCTOR":
        return [{ label: "Doctor Dashboard", href: "/doctor" }];
      case "CHEMIST":
        return [{ label: "Pharmacy", href: "/chemist" }];
      case "PATIENT":
        return [
          { label: "Find Doctors", href: "/doctors" },
          { label: "Medicines", href: "/medicines" },
          { label: "Appointments", href: "/appointments" },
          { label: "Prescriptions", href: "/prescriptions" },
          { label: "AI Chat", href: "/chat" },
        ];
      case "UNASSIGNED":
        return [{ label: "Complete Profile", href: "/onboarding" }];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Credit badge info
  const getCreditInfo = () => {
    if (!user || user.role === "ADMIN") return null;
    return {
      href: user.role === "PATIENT" ? "/pricing" : user.role === "CHEMIST" ? "/chemist" : "/doctor",
      value: user.credits,
      label: user.role === "PATIENT" ? "Credits" : "Earned",
    };
  };

  const creditInfo = getCreditInfo();

  return (
    <header
      ref={headerRef}
      className="fixed top-0 w-full z-50"
    >
      {/* Ambient glow behind header */}
      <div
        ref={glowRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[120px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)",
          opacity: 0.2,
          filter: "blur(40px)",
        }}
      />

      {/* Glass backdrop */}
      <div className="absolute inset-0 bg-[#030706]/75 backdrop-blur-2xl border-b border-white/[0.04]" />

      <nav className="relative container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          ref={logoRef}
          href="/"
          className="flex items-center gap-2 group shrink-0"
        >
          <span className="font-extrabold text-[20px] tracking-tight text-white transition-colors duration-300">
            247<span className="text-emerald-400/80 group-hover:text-emerald-400 transition-colors duration-300">.CARE</span>
          </span>
        </Link>

        <div
          ref={navLinksRef}
          className="hidden md:flex items-center gap-6 lg:gap-8 mx-auto"
        >
          <SignedIn>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item relative py-1 text-[11.5px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                    isActive
                      ? "text-emerald-400"
                      : "text-white/50 hover:text-white/90"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                  )}
                </Link>
              );
            })}
          </SignedIn>

          <SignedOut>
            <Link
              href="/doctors"
              className="nav-item py-1 text-[11.5px] uppercase tracking-[0.15em] font-medium text-white/50 hover:text-white/90 transition-all duration-300"
            >
              Find Doctors
            </Link>
            <Link
              href="/medicines"
              className="nav-item py-1 text-[11.5px] uppercase tracking-[0.15em] font-medium text-white/50 hover:text-white/90 transition-all duration-300"
            >
              Medicines
            </Link>
            <Link
              href="/chat"
              className="nav-item py-1 text-[11.5px] uppercase tracking-[0.15em] font-medium text-white/50 hover:text-white/90 transition-all duration-300"
            >
              AI Chat
            </Link>
          </SignedOut>
        </div>

        {/* Right side actions */}
        <div
          ref={actionsRef}
          className="flex items-center gap-2 md:gap-3 shrink-0"
        >
          {/* Credits Badge */}
          <SignedIn>
            {creditInfo && (
              <Link
                href={creditInfo.href}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:shadow-[0_0_20px_-6px_rgba(16,185,129,0.3)]"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span>{creditInfo.value}</span>
                <span className="hidden lg:inline text-emerald-400/70">{creditInfo.label}</span>
              </Link>
            )}
          </SignedIn>

          {/* Auth */}
          <SignedOut>
            <SignInButton>
              <button className="relative px-5 py-2 text-[13px] font-semibold tracking-wide text-black bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_16px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-4px_rgba(16,185,129,0.5)] hover:brightness-110 transition-all duration-300 active:scale-[0.97]">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-9 h-9 ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-[#030706] hover:ring-emerald-500/40 transition-all duration-300",
                  userButtonPopoverCard: "shadow-xl bg-[#0a0f0d] border border-white/10",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-[5px] w-[18px]">
              <span
                className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "rotate-45 translate-y-[3.25px]" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-300 ${
                  mobileOpen ? "opacity-0 scale-0" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] bg-white/70 rounded-full transition-all duration-300 origin-center ${
                  mobileOpen ? "-rotate-45 -translate-y-[3.25px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#030706]/95 backdrop-blur-2xl border-b border-white/[0.04] px-4 py-4 space-y-1">
          <SignedIn>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile credits */}
            {creditInfo && (
              <Link
                href={creditInfo.href}
                className="flex items-center gap-2 px-4 py-2.5 mt-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {creditInfo.value} {creditInfo.label}
              </Link>
            )}
          </SignedIn>

          <SignedOut>
            <Link
              href="/doctors"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              Find Doctors
            </Link>
            <Link
              href="/medicines"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              Medicines
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
