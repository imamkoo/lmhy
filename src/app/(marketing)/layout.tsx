import "@/styles/landing.css";
import { MotionConfig } from "motion/react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
