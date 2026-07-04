import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass disabled:pointer-events-none disabled:opacity-50";

const variants = {
  // Public site
  brass: "bg-brass text-ink hover:bg-brass-bright font-sans uppercase tracking-[0.14em] text-[12px]",
  outline:
    "border border-parchment/30 text-parchment hover:border-brass hover:text-brass font-sans uppercase tracking-[0.14em] text-[12px]",
  // Admin dashboard
  dark: "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-900",
  light:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:ring-zinc-900",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-900",
  danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700",
} as const;

const sizes = {
  sm: "h-8 px-3",
  md: "h-10 px-5",
  lg: "h-12 px-7",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "dark", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
