"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

export default function MobileHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animateOverlay, setAnimateOverlay] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  // Handle animation sequence
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Start animation immediately
      setAnimateOverlay(true);
      // Add overflow hidden to body when menu is open
      document.body.style.overflow = "hidden";
    } else {
      // Delay state change until animation completes
      const timer = setTimeout(() => {
        setAnimateOverlay(false);
        // Restore body overflow when menu is closed
        document.body.style.overflow = "";
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu only when pathname changes
  useEffect(() => {
    if (previousPathname.current !== pathname && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    previousPathname.current = pathname;
  }, [pathname, isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="main-bg flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Let's Talk Logo"
            width={32}
            height={32}
            className="transition-transform duration-300 hover:scale-110 active:scale-95"
          />
          <span className="text-lg font-semibold">Let's Talk</span>
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={toggleMobileMenu}
          className="hover:bg-opacity-20 rounded p-2 transition-all duration-300 hover:bg-white focus:outline-none active:scale-95"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-300 ease-out ${isMobileMenuOpen ? "rotate-90" : ""}`}
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Mobile Sidebar Overlay - Always rendered but initially hidden */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out md:hidden ${
          isMobileMenuOpen || animateOverlay ? "visible" : "invisible"
        }`}
        style={{ pointerEvents: isMobileMenuOpen ? "auto" : "none" }}
      >
        {/* Semi-transparent overlay to darken the background */}
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />

        {/* Sidebar container with fixed position and improved slide animation */}
        <div
          className="fixed top-0 left-0 flex h-full max-w-[250px] shadow-xl transition-all duration-300 ease-out"
          style={{
            transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            willChange: "transform",
          }}
        >
          <Sidebar />

          {/* Close Button */}
          <button
            onClick={toggleMobileMenu}
            className="absolute top-4 right-4 rounded-full bg-white p-1 text-gray-500 shadow-md transition-all duration-300 ease-out hover:rotate-90 focus:outline-none active:scale-90"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
