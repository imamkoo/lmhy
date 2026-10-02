"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LOADER_ID = "lmhy-litera-loader";
const EMBED_URL = "https://cdn.literaa.xyz/litera-embed.js";
const ROOT_ID = "litera";

export function LiteraWidget({ title }: { title: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const currentHref = window.location.href;
    (window as Window & { myReactPluginData?: { permalink: string; title: string } }).myReactPluginData = {
      permalink: currentHref,
      title,
    };

    const script = document.getElementById(LOADER_ID) as HTMLScriptElement | null;
    if (script) {
      script.dataset.article = currentHref;
      script.dataset.title = title;
    }

    window.dispatchEvent(new CustomEvent("litera:article-change", {
      detail: { permalink: currentHref, title },
    }));

    const mount = (window as Window & { literaMount?: (container: HTMLElement | string) => void }).literaMount;
    if (mount) {
      mount(root);
    }

    if (!script) {
      const newScript = document.createElement("script");
      newScript.id = LOADER_ID;
      newScript.src = EMBED_URL;
      newScript.dataset.article = currentHref;
      newScript.dataset.title = title;
      newScript.async = true;
      newScript.onload = () => {
        const m = (window as Window & { literaMount?: (container: HTMLElement | string) => void }).literaMount;
        if (m) m(root);
      };
      document.body.appendChild(newScript);
    }

    const timer = setInterval(() => {
      const m = (window as Window & { literaMount?: (container: HTMLElement | string) => void }).literaMount;
      if (m && root) {
        m(root);
        if (root.childElementCount > 0) {
          clearInterval(timer);
        }
      }
    }, 200);

    const timeout = setTimeout(() => clearInterval(timer), 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [pathname, title]);

  return <div id={ROOT_ID} data-litera-widget="true" className="mt-12 min-h-16" aria-label="Litera article access" />;
}
