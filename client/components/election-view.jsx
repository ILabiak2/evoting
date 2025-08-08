"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, Copy, ArrowLeft } from "lucide-react";

export default function ElectionView({ address }) {
  const router = useRouter();
  const { user } = useAuth();
  const data = {
    id: 0,
    name: "Election for Student Body President",
    startTime: 1754477820,
    endTime: 0,
    creator: "0x076bC5E783c557287A88a1Ee427b0fbf3E17c5bF",
    isActive: true,
    startedManually: false,
    endedManually: false,
    candidateCount: 3,
    voterLimit: 0,
    electionType: "public_single_choice",
    contractAddress: "0xAEe41ce7bd26596E31236ff34260B163fBb29D9D",
    candidates: [
      {
        id: 0,
        name: "Sarah Chen",
        votes: 120,
      },
      {
        id: 1,
        name: "David Lee",
        votes: 110,
      },
      {
        id: 2,
        name: "Maria RodriguezRodriguezRodriguez",
        votes: 95,
      },
    ],
    totalVotes: 325,
  };
  const isLoading = false;
  const isError = false;

  const handleCopyAddress = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateInviteCode = () => {
    // TODO: Implement invite code generation
    console.log("Generate invite code");
  };

  const handleCastVote = () => {
    // TODO: Implement vote casting
    console.log("Cast vote");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
        {/* <h1 className="text-2xl font-bold">{address}</h1> */}
        <div className="flex gap-2 border-b">
          <div className="h-15 md:h-20 w-full rounded-lg flex flex-row items-center gap-2">
            <p className=" md:inline text-bg md:text-3xl">
              Your address:&nbsp;
            </p>
            <p
              className="text-bg md:text-2xl cursor-pointer"
              title="Click to copy address"
              onClick={() => {
                if (user.public_address) {
                  navigator.clipboard.writeText(user.public_address);
                }
              }}
            >
              {user.public_address
                ? `${user.public_address.slice(
                    0,
                    4
                  )}...${user.public_address.slice(-4)}`
                : ""}
            </p>
          </div>
          <div className="h-15 md:h-20 flex justify-end items-center w-full rounded-lg">
            <button
              onClick={() => {
                router.push("/dashboard");
              }}
              className="w-60 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Back to dashboard
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-1 overflow-y-auto items-start">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mb-4"></div>
              <p className="text-2xl text-center font-bold mb-20">
                Loading election data...
              </p>
            </div>
          )}
          
          {isError && (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <p className="text-2xl text-center font-bold mb-20">
                Error loading election data.
              </p>
            </div>
          )}
          
          {!isLoading && !isError && data && (
            <div className="w-full">
              {/* Election Title */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.name}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Address:</p>
                  <p
                    className="cursor-pointer text-sm font-medium hover:text-primary break-words hyphens-auto"
                    title="Click to copy address"
                    onClick={() => handleCopyAddress(data.contractAddress)}
                  >
                    {data.contractAddress}
                  </p>
                  <button
                    onClick={() => handleCopyAddress(data.contractAddress)}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Candidates Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Candidates</h2>
                <div className="border border-neutral-200 rounded-lg overflow-hidden dark:border-neutral-700">
                  <div className="bg-sidebar-primary px-6 py-3 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-2 gap-4">
                      <span className="font-medium">Candidate</span>
                      <span className="font-medium">Votes</span>
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {data.candidates.map((candidate) => (
                      <div key={candidate.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="grid grid-cols-2 gap-4">
                          <span className="font-medium break-words hyphens-auto">{candidate.name}</span>
                          <span className="font-medium">{candidate.votes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleGenerateInviteCode}
                  className="flex-1 w-24 transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-32 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800"
                >
                  Generate Invite Code
                </button>
                <button
                  onClick={handleCastVote}
                  className="flex-1 w-24 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
                >
                  Cast Vote
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
