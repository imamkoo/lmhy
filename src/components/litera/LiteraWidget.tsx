"use client";

import { useEffect } from "react";

const LOADER_ID = "lmhy-litera-loader";
const EMBED_URL = "https://cdn.literaa.xyz/litera-embed.js";
const ROOT_ID = "my-react-plugin-root";

export function LiteraWidget({ title }: { title: string }) {
  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const currentHref = window.location.href;
    (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData = {
      permalink: currentHref,
      title,
    };

    window.dispatchEvent(new CustomEvent("litera:article-change", {
      detail: { permalink: currentHref, title },
    }));

    const mount = (window as Window & { literaMount?: (container: HTMLElement) => void }).literaMount;
    if (mount) mount(root);

    if (!document.getElementById(LOADER_ID)) {
      const script = document.createElement("script");
      script.id = LOADER_ID;
      script.src = EMBED_URL;
      script.dataset.articleUrl = currentHref;
      script.dataset.title = title;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [window.location.href, title]);

  return <div id={ROOT_ID} className="mt-12 min-h-16" aria-label="Litera article access" />;
}
