"use client";

import React, { useState, useEffect } from 'react';
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(null)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark)
        setIsDark(isDarkMode)
        document.documentElement.classList.toggle('dark', isDarkMode)
    }, [])


    // Toggle theme
    const toggleTheme = () => {
        const newTheme = !isDark
        setIsDark(newTheme)
        localStorage.setItem('theme', newTheme ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', newTheme)
    }

    if (isDark === null) return null

    return (
        <Toggle
            variant="outline"
            className="max-md:mt-[3px] cursor-pointer transform border-1 data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted h-[37px] w-[37px] flex items-center justify-center max-md:h-[32px] max-md:w-[34px]"
            pressed={!isDark}
            onClick={toggleTheme}
            aria-label={`Switch to ${!isDark ? "light" : "dark"} mode`}
        >
            {isDark ? (
                <Moon size={16} strokeWidth={2} className="transition-all max-md:size-3 scale-150" />
            ) : (
                <Sun size={16} strokeWidth={2} className="transition-all max-md:size-3 scale-150" />
            )}
        </Toggle>
    );
};
