import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const backdropVariants = cva(
  "fixed inset-0 flex items-center justify-center transition-all",
  {
    variants: {
      variant: {
        default: "bg-background/80 backdrop-blur-sm",
        dim: "bg-black/50",
        blur: "backdrop-blur-sm bg-black/30",
      },
      fullscreen: {
        true: "z-50",
        false: "z-40",
      },
    },
    defaultVariants: {
      variant: "default",
      fullscreen: true,
    },
  }
);


const Backdrop = React.forwardRef(
  (
    {
      className,
      variant,
      fullscreen,
      open = false,
      onClose,
      closeOnClick = true,
      children,
      ...props
    },
    ref
  ) => {
    if (!open) return null;

    const handleClick = (e) => {
      if (e.target === e.currentTarget && closeOnClick && onClose) {
        onClose();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(backdropVariants({ variant, fullscreen }), className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Backdrop.displayName = "Backdrop";

export { Backdrop, backdropVariants };