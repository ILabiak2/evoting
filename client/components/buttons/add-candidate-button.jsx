import React, { useEffect, useMemo, useState } from "react";
import { Check, X, Plus } from "lucide-react";
import { useTxStatus } from "@/lib/hooks/useTxStatus";
import { useAddCandidate } from "@/lib/hooks/useAddCandidate";

export const AddCandidateButton = ({ electionAddress }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);

  const addMutation = useAddCandidate();
  const {
    data: statusData,
    isLoading: polling,
    error: statusError,
  } = useTxStatus(txHash || undefined, electionAddress);

  const confirmed = Boolean(statusData?.confirmed);
  const nameValid = useMemo(() => name.trim().length >= 3, [name]);

  const handleOpen = () => {
    setErrorMessage("");
    setTxHash(null);
    setName("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setTxHash(null);
    try {
      const res = await addMutation.mutateAsync({
        address: electionAddress,
        candidateNames: [name],
      });
      if (res?.txHash) {
        setTxHash(res.txHash);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to update candidate name.");
    }
  };

  const busy = addMutation.isPending || (!!txHash && !confirmed);

  return (
    <div className="flex items-center justify-end text-right">
      <button
        onClick={handleOpen}
        disabled={busy}
        title={"Add candidate"}
        className={`flex flex-1 w-16 max-h-10 transform max-md:text-xs rounded-lg border-1 h-8 font-medium max-w-16 items-center justify-center text-xl leading-none
          ${
            busy
              ? "cursor-not-allowed opacity-50 bg-black text-white dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black"
              : "cursor-pointer bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
          }`}
      >
        <Plus className="w-6 h-6 font-bold" />
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
              <h3 className="text-lg font-semibold">Add candidate</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input */}
            <div className="mb-4">
              <label
                htmlFor="candidateName"
                className="block text-sm font-medium mb-1"
              >
                Candidate name
              </label>
              <input
                id="candidateName"
                type="text"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:border-neutral-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alice Johnson"
                disabled={!!txHash && !confirmed}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Minimum 3 characters.
              </p>
            </div>

            {/* Errors / Status */}
            {errorMessage && (
              <div className="mb-3 rounded bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm">
                {errorMessage}
              </div>
            )}
            {statusError && (
              <div className="mb-3 rounded bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 text-sm">
                {statusError?.message || "Unable to fetch transaction status."}
              </div>
            )}

            {txHash && !confirmed && (
              <div className="mb-3 flex items-center gap-3 text-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <div>
                  Submitting your change…{" "}
                  <a
                    className="underline"
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on explorer
                  </a>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="mb-3 inline-flex items-center gap-2 text-green-600 font-medium">
                <Check className="h-5 w-5" />
                Candidate added on-chain.
              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                Close
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !nameValid ||
                  addMutation.isPending ||
                  (!!txHash && !confirmed)
                }
                className={`inline-flex items-center cursor-pointer rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300
                  ${
                    !nameValid ||
                    addMutation.isPending ||
                    (!!txHash && !confirmed)
                      ? "opacity-50 cursor-not-allowed bg-black text-white dark:bg-white dark:text-black"
                      : "bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  }`}
              >
                {addMutation.isPending
                  ? "Adding…"
                  : txHash && !confirmed
                    ? "Pending…"
                    : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
