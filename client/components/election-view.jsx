"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";


export default function ElectionView({ address }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
        <h1 className="text-2xl font-bold">{address}</h1>
      </div>
    </div>
  );
}
