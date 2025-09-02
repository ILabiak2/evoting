"use client";
import React, { useState } from "react";
import { useVoteStatus } from "@/lib/hooks/useVoteStatus";
import { useVoteInElection } from "@/lib/hooks/useVoteInElection";
import { Check, X } from "lucide-react";

export const VoteButton = ({
  candidateId,
  candidateIds,
  candidates,
  maxChoices,
  electionAddress,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false); // true only while sending tx
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const voteMutation = useVoteInElection();
  const {
    data: statusData,
    isLoading: polling,
    error: statusError,
  } = useVoteStatus(txHash, electionAddress);

  const confirmed = Boolean(statusData?.confirmed);

  const handleOpenConfirm = () => {
    if (disabled) return;
    // reset any previous state and open confirmation dialog
    setErrorMessage("");
    setTxHash(null);
    setOpen(true);
  };

  const handleConfirmVote = async () => {
    if (disabled || confirming) return;
    setErrorMessage("");
    setTxHash(null);
    setConfirming(true);
    try {
      const res = await voteMutation.mutateAsync({
        address: electionAddress,
        voteData: candidateIds?.length > 0 ? { candidateIds } : { candidateId },
      });
      if (res?.txHash) {
        setTxHash(res.txHash);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to submit vote.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center justify-end text-right">
      <button
        onClick={handleOpenConfirm}
        disabled={
          disabled ||
          voteMutation.isPending ||
          confirming ||
          (txHash && !confirmed)
        }
        className={`flex-1 w-24 max-h-20 transform max-md:text-xs rounded-lg border-1 px-6 py-2 font-medium transition-all duration-300 md:w-32 md:max-w-32 border-neutral-800 dark:border-neutral-200 ${
          disabled ||
          voteMutation.isPending ||
          confirming ||
          (txHash && !confirmed)
            ? "cursor-not-allowed opacity-50 bg-black text-white dark:bg-white dark:text-black"
            : "cursor-pointer bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        }`}
        title={
          disabled
            ? "You can't vote in this election"
            : (txHash && !confirmed) || confirming
              ? "Waiting for confirmation…"
              : "Vote for this candidate"
        }
      >
        {confirming || voteMutation.isPending
          ? "Voting..."
          : txHash && !confirmed
            ? "Pending…"
            : candidateIds?.length > 0
              ? `Vote (${candidateIds.length}${maxChoices ? `/${maxChoices}` : ""})`
              : "Vote"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {errorMessage
                  ? "Could not vote"
                  : txHash
                    ? statusError
                      ? "Could not verify"
                      : confirmed
                        ? "Vote confirmed"
                        : "Submitting your vote…"
                    : "Confirm your vote"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error state */}
            {errorMessage ? (
              <div className="rounded bg-red-100 border border-red-400 text-red-700 px-4 py-3">
                {errorMessage}
              </div>
            ) : txHash && statusError ? (
              <div className="rounded bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3">
                {statusError?.message || "Unable to fetch transaction status."}
              </div>
            ) : (
              <>
                {/* No tx yet -> confirmation UI */}
                {!txHash ? (
                  <div className="text-sm space-y-4">
                    <p>
                      You are about to cast your vote for{" "}
                      {candidateIds?.length > 0 ? (
                        <span className="font-semibold">
                          {candidateIds
                            .map(
                              (id) =>
                                candidates.find((c) => c.id === id)?.name ||
                                `Candidate ${id}`
                            )
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="font-semibold">
                          {candidates.find((c) => c.id === candidateId)?.name ||
                            candidateName}
                        </span>
                      )}
                      .
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmVote}
                        disabled={confirming}
                        className={`inline-flex items-center cursor-pointer rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300 ${
                          confirming
                            ? "opacity-50 cursor-not-allowed bg-black text-white dark:bg-white dark:text-black"
                            : "bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        }`}
                      >
                        {confirming ? "Submitting…" : "Confirm vote"}
                      </button>
                    </div>
                  </div>
                ) : !confirmed ? (
                  // Tx sent, waiting for confirmations
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <div className="text-sm">
                      Waiting for confirmations…
                      {txHash && (
                        <>
                          {" "}
                          <a
                            className="underline"
                            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on explorer
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  // Confirmed
                  <div className="text-sm space-y-1">
                    <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                      <Check className="h-5 w-5" />
                      Vote confirmed on-chain.
                    </div>
                    {typeof statusData?.candidateId === "number" && (
                      <div>Candidate ID: {statusData.candidateId}</div>
                    )}
                    {Array.isArray(statusData?.candidateIds) && (
                      <div>
                        Candidate IDs: {statusData.candidateIds.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-black px-4 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};
