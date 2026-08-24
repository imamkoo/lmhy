"use client";

import { useEffect } from "react";

const LOADER_ID = "lmhy-litera-loader";
const EMBED_URL = "https://cdn.literaa.xyz/litera-embed.js";
const ROOT_ID = "my-react-plugin-root";

export function LiteraWidget({ title }: { title: string }) {
  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const current = (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData;
    (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData = {
      permalink: window.location.href,
      title,
    };

    window.dispatchEvent(new CustomEvent("litera:article-change", {
      detail: { permalink: window.location.href, title },
    }));

    if (!document.getElementById(LOADER_ID)) {
      const script = document.createElement("script");
      script.id = LOADER_ID;
      script.src = EMBED_URL;
      script.dataset.articleUrl = window.location.href;
      script.dataset.title = title;
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
