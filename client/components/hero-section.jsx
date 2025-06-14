"use client";

import React, { useState, useEffect } from 'react';

import { motion } from "motion/react";
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  ShieldCheck,
  BarChart3,
  LockKeyhole,
  Globe
} from "lucide-react";

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
          <button onClick={() => window.location.href = '/signup'}
            className="w-60 transform rounded-lg cursor-pointer bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Explore Now
          </button>
          <button onClick={() => window.location.href = '/contacts'}
            className="w-60 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900">
            Contact Support
          </button>
        </motion.div>
        <FeautesGrid />
      </div>
      <Footer />
    </div>
  );
}


function FeautesGrid() {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <GridItem
        icon={<ShieldCheck className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="Tamper-Proof Voting"
        description="Every vote is recorded on the blockchain, making it immutable and resistant to fraud or manipulation." />

      <GridItem
        icon={<BarChart3 className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="Transparent Results"
        description="Vote counts and outcomes are fully auditable by anyone, ensuring trust in the election process." />

      <GridItem
        icon={<LockKeyhole className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="Secure & Private"
        description="Votes are encrypted and anonymized, so your identity is protected without compromising vote integrity." />

      <GridItem
        icon={<Globe className="h-4 w-4 text-black dark:text-neutral-400" />}
        title="Global Accessibility"
        description="Users can vote from any device, anywhere in the world—no physical polling station required." />
    </ul>
  );
}

const GridItem = ({
  area,
  icon,
  title,
  description
}) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          blur={0}
          borderWidth={1}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01} />
        <div
          className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3
                className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2
                className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
