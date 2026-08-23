import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h2: ({ children }) => <h2 className="mt-10 text-2xl font-bold tracking-tight text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-7 text-xl font-semibold text-slate-900">{children}</h3>,
  p: ({ children }) => <p className="mt-4 text-[1.05rem] leading-8 text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">{children}</ol>,
  a: ({ href, children }) => <a href={href} className="font-semibold text-[#b86644] underline underline-offset-4" target="_blank" rel="noreferrer">{children}</a>,
  blockquote: ({ children }) => <blockquote className="mt-6 border-l-4 border-[#d07954] bg-[#fff8f4] px-5 py-4 italic text-slate-700">{children}</blockquote>,
};
