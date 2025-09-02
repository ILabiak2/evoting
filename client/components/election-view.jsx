"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useElectionData } from "@/lib/hooks/useElectionData";
import { Copy, Check } from "lucide-react";
import {
  VoteButton,
  JoinElectionButton,
  InviteCodesGenerator,
  StopButton,
  StartButton,
  EditCandidateButton,
  AddCandidateButton,
  DeleteCandidateButton,
} from "@/components/buttons";

const ElectionType = {
  public_single_choice: "Public (Single Choice)",
  private_single_choice: "Private (Single Choice)",
  public_multi_choice: "Public (Multi Choice)",
  private_multi_choice: "Private (Multi Choice)",
};

export default function ElectionView({ address }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: election, isLoading, error } = useElectionData(address);
  // const election = {
  //   id: 0,
  //   name: "Election for Student Body President",
  //   startTime: 1754477820,
  //   endTime: 0,
  //   creator: "0x076bC5E783c557287A88a1Ee427b0fbf3E17c5bF",
  //   isActive: false,
  //   startedManually: false,
  //   endedManually: false,
  //   candidateCount: 3,
  //   voterLimit: 0,
  //   electionType: "public_single_choice",
  //   contractAddress: "0xAEe41ce7bd26596E31236ff34260B163fBb29D9D",
  //   candidates: [
  //     {
  //       id: 0,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 1,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 2,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //     {
  //       id: 3,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 4,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 5,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //     {
  //       id: 6,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 7,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 8,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //   ],
  //   totalVotes: 325,
  //   isCreator: true,
  //   hasVoted: false,
  //   votedCandidateIds: [1, 4],
  // };
  // const isLoading = false;
  // const error = false;

  const handleCopyAddress = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Multi-choice UX state
  const isMulti = String(election?.electionType || "").includes("multi");
  const maxChoices = Number(election?.maxChoicesPerVoter || 0) || 0;
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    // Reset selection when election changes
    setSelectedIds([]);
  }, [election?.contractAddress]);

  const toggleSelect = (cid) => {
    setSelectedIds((prev) => {
      const has = prev.includes(cid);
      if (has) return prev.filter((x) => x !== cid);
      if (maxChoices && prev.length >= maxChoices) return prev; // cap
      return [...prev, cid];
    });
  };

  const atMax = maxChoices > 0 && selectedIds.length >= maxChoices;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 md:pt-0 dark:border-neutral-700 dark:bg-neutral-950">
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

          {error && (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <p className="text-2xl text-center font-bold">
                Error loading election data.
              </p>
              <p className="text-2xl text-center text-red-500 font-bold mb-2">
                {error?.message}
              </p>
              <div className="h-15 md:h-20 flex justify-center items-center w-full rounded-lg">
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
          )}

          {!isLoading && !error && election && (
            <div className="w-full">
              {/* Election Title */}
              <div className="mb-8">
                <div className="flex flex-row items-center justify-between md:pr-0">
                  <div className="flex flex-row items-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {election.name}
                    </h1>
                    <span
                      className={`ml-5 p-2 inline-block h-3 w-3 rounded-full
                      ${
                        election?.isActive
                          ? "bg-green-500 animate-pulse shadow-[0_0_12px_4px_rgba(34,197,94,0.7)]"
                          : "bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.7)]"
                      }`}
                    ></span>
                  </div>
                  <JoinElectionButton
                    electionAddress={election?.contractAddress}
                    electionType={election?.electionType}
                    isCreator={election?.isCreator}
                    isParticipant={election?.isParticipant}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Address:</p>
                  <p
                    className="cursor-pointer text-sm font-medium hover:text-primary break-words hyphens-auto"
                    title="Click to copy address"
                    onClick={() => handleCopyAddress(election.contractAddress)}
                  >
                    {election.contractAddress}
                  </p>
                  <button
                    onClick={() => handleCopyAddress(election.contractAddress)}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span
                    title={election.electionType}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    {ElectionType[election.electionType] ??
                      election.electionType}
                  </span>
                </div>
              </div>

              {/* Candidates Section */}
              <div className="mb-8">
                <div className="flex flex-row justify-between items-center mb-4">
                  <h2 className="text-xl font-bold  align-middle">
                    Candidates
                  </h2>
                  {election?.isCreator &&
                    !election.isActive &&
                    election.endTime == 0 && (
                      <AddCandidateButton
                        electionAddress={election.contractAddress}
                      />
                    )}
                </div>

                <div className="border border-neutral-200 rounded-lg overflow-hidden dark:border-neutral-700">
                  <div className="bg-sidebar-primary px-6 py-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <span className="font-medium">Candidate</span>
                      <span className="font-medium">Votes</span>
                      {election?.hasVoted ? (
                        <span className="font-medium text-right md:mr-10">
                          Your vote
                        </span>
                      ) : isMulti && !election?.isCreator ? (
                        <span className="font-medium text-right md:mr-10">
                          Select
                        </span>
                      ) : (
                        <span className="font-medium text-right mr-8 md:mr-10">
                          Action
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-700 items-center max-h-[30vh] md:max-h-[40vh] overflow-y-auto">
                    {election.candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="px-6 py-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center w-full">
                            <span className="font-medium break-words hyphens-auto w-full">
                              {candidate.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">
                              {candidate.votes}
                            </span>
                          </div>
                          {election?.isCreator ? (
                            <div className="flex flex-row justify-end">
                              <EditCandidateButton
                                disabled={
                                  election.isActive || election.endTime > 0
                                }
                                candidateId={candidate.id}
                                electionAddress={election.contractAddress}
                                currentName={candidate.name}
                              />
                              {!election.isActive && election.endTime <= 0 && (
                                <div className="ml-2">
                                  <DeleteCandidateButton
                                    candidateId={candidate.id}
                                    electionAddress={election.contractAddress}
                                    candidateName={candidate.name}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {election?.hasVoted ? (
                                <div className="flex items-center justify-end text-right md:mr-10">
                                  {Array.isArray(election.votedCandidateIds) &&
                                  election.votedCandidateIds.includes(
                                    candidate.id
                                  ) ? (
                                    <span className="inline-flex items-center text-green-500 font-medium">
                                      <Check className="h-5 w-5 mr-1" />
                                      Voted
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </div>
                              ) : isMulti ? (
                                <div className="flex items-center justify-end text-right mr-2 md:mr-12">
                                  <input
                                    type="checkbox"
                                    className="h-6 w-6 cursor-pointer"
                                    checked={selectedIds.includes(candidate.id)}
                                    onChange={() => toggleSelect(candidate.id)}
                                    disabled={
                                      (!selectedIds.includes(candidate.id) &&
                                        atMax) ||
                                      !election?.isActive ||
                                      (String(election?.electionType).includes(
                                        "private"
                                      ) &&
                                        !election.isParticipant)
                                    }
                                    title={
                                      !selectedIds.includes(candidate.id) &&
                                      atMax
                                        ? `You can choose up to ${maxChoices}`
                                        : "Select candidate"
                                    }
                                  />
                                </div>
                              ) : (
                                <VoteButton
                                  candidateId={candidate.id}
                                  candidates={election.candidates}
                                  electionAddress={election.contractAddress}
                                  disabled={
                                    (String(election?.electionType).includes(
                                      "private"
                                    ) &&
                                      !election.isParticipant) ||
                                    !election?.isActive
                                  }
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {isMulti && !election?.isCreator && !election?.hasVoted && (
                  <div className="mt-4 w-full flex justify-end">
                    <VoteButton
                      candidateIds={selectedIds}
                      candidates={election.candidates}
                      maxChoices={maxChoices}
                      electionAddress={election.contractAddress}
                      disabled={
                        (String(election?.electionType).includes("private") &&
                          !election.isParticipant) ||
                        !election?.isActive ||
                        selectedIds.length === 0
                      }
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {election?.isCreator && election.endTime <= 0 && (
                <div className="flex flex-col md:flex-row gap-4">
                  {election?.isActive ? (
                    <StopButton electionAddress={election.contractAddress} />
                  ) : (
                    <StartButton electionAddress={election.contractAddress} />
                  )}
                  {election.electionType.includes("private") && (
                    <InviteCodesGenerator
                      electionAddress={election.contractAddress}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
