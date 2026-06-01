"use client";

import { useEffect } from "react";

export function LandingEffects() {
  useEffect(() => {
    const preloader = document.querySelector(".js-preloader");
    if (preloader) {
      preloader.classList.add("fade-out");
      const t = setTimeout(() => {
        (preloader as HTMLElement).style.display = "none";
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const navToggler = document.querySelector(".js-nav-toggler");
    const nav = document.querySelector(".js-nav");
    if (!navToggler || !nav) return;

    function navToggle() {
      nav?.classList.toggle("active");
      navToggler?.classList.toggle("active");
    }

    const onTogglerClick = () => navToggle();
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !nav.contains(target) &&
        !navToggler.contains(target) &&
        nav.classList.contains("active")
      ) {
        navToggle();
      }
    };

    navToggler.addEventListener("click", onTogglerClick);
    document.addEventListener("click", onDocClick);

    return () => {
      navToggler.removeEventListener("click", onTogglerClick);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  // Cleanup: ensure dark mode is removed so it doesn't leak
  useEffect(() => {
    document.body.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  return null;
}
