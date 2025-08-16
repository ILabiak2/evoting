"use client";
import React, { useState } from "react";
import { useTxStatus } from "@/lib/hooks/useTxStatus";
import { useStopElection } from "@/lib/hooks/useStopElection";
import { Check, X } from "lucide-react";

export const StopButton = ({ electionAddress }) => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const stopMutation = useStopElection();
  const {
    data: statusData,
    isLoading: polling,
    error: statusError,
  } = useTxStatus(txHash, electionAddress);

  const confirmed = Boolean(statusData?.confirmed);

  const handleStopElection = async () => {
    setErrorMessage("");
    setTxHash(null);
    try {
      const res = await stopMutation.mutateAsync({ address: electionAddress });
      if (res?.txHash) {
        setTxHash(res.txHash);
        setOpen(true);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to stop election.");
    } finally {
      setOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleStopElection}
        disabled={stopMutation.isPending || (txHash && !confirmed)}
        className={`flex-1 md:inline transform max-md:text-xs mr-2 rounded-lg border-1 bg-white px-6 py-3 md:py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-52 md:max-w-80 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800 ${
          stopMutation.isPending || (txHash && !confirmed)
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:-translate-y-0.5"
        }`}
      >
        {stopMutation.isPending
          ? "Stopping..."
          : txHash && !confirmed
            ? "Pending…"
            : "Stop Election"}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {errorMessage
                  ? "Could not stop the election"
                  : statusError
                    ? "Could not verify"
                    : confirmed
                      ? "Election stopped"
                      : "Stopping election…"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage ? (
              <div className="rounded bg-red-100 border border-red-400 text-red-700 px-4 py-3">
                {errorMessage}
              </div>
            ) : statusError ? (
              <div className="rounded bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3">
                {statusError?.message || "Unable to fetch transaction status."}
              </div>
            ) : !confirmed ? (
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
              <div className="text-sm space-y-1">
                <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                  <Check className="h-5 w-5" />
                  The election was successfully stopped.
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpen(false)}
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
