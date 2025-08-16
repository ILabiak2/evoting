"use client";
import React, { useState } from "react";
import {
  useJoinPublicElection,
  useLeavePublicElection,
} from "@/lib/hooks/useJoinElection";
import { X, Heart, CheckCircle2 } from "lucide-react";

export const JoinElectionButton = ({
  electionAddress,
  electionType,
  isCreator,
  isParticipant,
}) => {
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joined, setJoined] = useState(isParticipant);
  const [modalMode, setModalMode] = useState(null); // 'joined' | 'left'
  const joinMutation = useJoinPublicElection();
  const leaveMutation = useLeavePublicElection();

  const handgleButtonClick = async () => {
    if (!String(electionType).includes("public")) return;
    setJoinError("");
    try {
      if (!joined) {
        const res = await joinMutation.mutateAsync(electionAddress);
        if (res?.joined) {
          setJoined(true);
          setModalMode("joined");
          setJoinOpen(true);
        }
      } else {
        const res = await leaveMutation.mutateAsync(electionAddress);
        if (res?.left) {
          setJoined(false);
          setModalMode("left");
          setJoinOpen(true);
        }
      }
    } catch (err) {
      setJoinError(err?.message || "Action failed.");
      setJoinOpen(true);
    }
  };

  return (
    <>
      {!isCreator && (
        <button
          onClick={handgleButtonClick}
          disabled={joinMutation.isPending || leaveMutation.isPending}
          className="ml-3 inline-flex cursor-pointer items-center rounded-lg border-1 bg-black px-3 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
          title={
            !String(electionType).includes("public")
              ? "You can join private election only with invite code"
              : joined
                ? "Remove from your elections"
                : "Add to your elections"
          }
          aria-label={joined ? "Leave public election" : "Join public election"}
        >
          {joined ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Heart className="h-5 w-5" />
          )}
        </button>
      )}
      {joinOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {joinError
                  ? "Could not complete"
                  : modalMode === "left"
                    ? "Election removed"
                    : "Election added"}
              </h3>
              <button
                onClick={() => setJoinOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {joinError ? (
              <div className="rounded bg-red-100 border border-red-400 text-red-700 px-4 py-3">
                {joinError}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <p className="text-sm">
                  {modalMode === "left"
                    ? "This public election has been removed from your list."
                    : "This public election has been added to your list. You can find it on your dashboard."}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setJoinOpen(false)}
                className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-black px-4 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
