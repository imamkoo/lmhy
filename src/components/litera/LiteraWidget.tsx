"use client";

import { useEffect } from "react";

const LOADER_ID = "lmhy-litera-loader";
const ROOT_ID = "my-react-plugin-root";
const LOADER_URL = "https://cdn.literaa.xyz/loader.js";

export function LiteraWidget({ title }: { title: string }) {
  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const current = (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData;
    (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData = {
      permalink: window.location.href,
      title,
    };

    if (!document.getElementById(LOADER_ID)) {
      const script = document.createElement("script");
      script.id = LOADER_ID;
      script.src = LOADER_URL;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (current) {
        (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData = current;
      }
    };
  }, [title]);

  return <div id={ROOT_ID} className="mt-12 min-h-16" aria-label="Litera article access" />;
}
