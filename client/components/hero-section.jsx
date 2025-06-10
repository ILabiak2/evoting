"use client";

import React, { useState, useEffect } from 'react';

import Link from 'next/link'
import { motion } from "motion/react";
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function HeroSectionOne() {
  return (
    <div
      className="relative mx-auto flex max-w flex-col items-center justify-center">
      <Navbar />
      <div
        className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div
          className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div
        className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div
          className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div
          className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20">
        <h1
          className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Secure. Transparent. Unchangeable."
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block">
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400">
          Empowering democracy with blockchain—where every vote counts and every result is undeniable.
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 1,
          }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Explore Now
          </button>
          <button
            className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900">
            Contact Support
          </button>
        </motion.div>
        {/* <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 1.2,
          }}
          className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <div
            className="w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
            <img
              src="https://assets.aceternity.com/pro/aceternity-landing.webp"
              alt="Landing page preview"
              className="aspect-[16/9] h-auto w-full object-cover"
              height={1000}
              width={1000} />
          </div>
        </motion.div> */}
      </div>
    </div>
  );
}

export function Navbar() {
  const [isDark, setIsDark] = useState(null)

  // Load theme on first render
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
    <nav
      className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 min-md:pl-15 min-md:pr-15">
      <Link href={'/'} className="flex items-center gap-2">
        {/* <div
          className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" /> */}
        <h1 className="text-base font-bold md:text-2xl">ChainVote</h1>
      </Link>

      <div className="flex items-center gap-x-2">
          <Toggle
            variant="outline"
            className="cursor-pointer transform border-1 data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted h-[42px] w-[42px] flex items-center justify-center max-md:h-[34px] max-md:w-[34px]"
            pressed={!isDark}
            onClick={toggleTheme}
            aria-label={`Switch to ${!isDark ? "light" : "dark"} mode`}
          >
            {
              isDark ? <Moon size={16} strokeWidth={2} className="transition-all max-md:size-3" />
                : <Sun size={16} strokeWidth={2} className="transition-all max-md:size-3" />
            }
          </Toggle>
          <div className="flex items-center">
          <Link href={'/login'}
            className="w-24 transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-32 dark:border-gray-600 dark:bg-black dark:text-white dark:hover:bg-gray-800">
            Login
          </Link>
          <Link href={'/signup'}
            className="w-24 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Sign Up
          </Link>
          </div>
      </div>

    </nav>
  );
};
