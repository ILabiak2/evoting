import { IconMenu2 } from "@tabler/icons-react";
import React from "react";
import { useSidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export const MobileMenuButton = ({ className, size = 28 }) => {
  const { open, setOpen } = useSidebar();
  return (
    <button
      aria-label="Open menu"
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center p-2 rounded-md",
        className
      )}
    >
      <IconMenu2
        size={size}
        className="text-neutral-800 dark:text-neutral-200"
      />
    </button>
  );
};


export default MobileMenuButton;