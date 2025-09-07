import React, { useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { useTxStatus } from "@/lib/hooks/useTxStatus";
import { useDeleteCandidate } from "@/lib/hooks/useDeleteCandidate";

export const DeleteCandidateButton = ({
  electionAddress,
  candidateId,
  candidateName,
}) => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const delMutation = useDeleteCandidate();

  const { data: statusData, error: statusError } = useTxStatus(
    txHash || undefined,
    electionAddress
  );
  const confirmed = Boolean(statusData?.confirmed);

  const handleOpen = () => {
    setErrorMessage("");
    setTxHash(null);
    setOpen(true);
  };

  const handleConfirmDelete = async () => {
    setErrorMessage("");
    setTxHash(null);
    try {
      const res = await delMutation.mutateAsync({
        address: electionAddress,
        candidateId,
      });
      if (res?.txHash) setTxHash(res.txHash);
      else setErrorMessage("Unexpected server response.");
    } catch (err) {
      setErrorMessage(err?.message || "Failed to delete candidate.");
    }
  };

  const busy = delMutation.isPending || (!!txHash && !confirmed);

  return (
    <div className="flex items-center justify-end text-right">
      <button
        onClick={handleOpen}
        disabled={busy}
        title={"Delete candidate"}
        className={`flex max-h-20 transform rounded-lg border-1 px-6 py-2 font-medium md:w-16 md:max-w-16
            ${
              busy
                ? "cursor-not-allowed opacity-50 bg-red-400 text-white dark:bg-red-600 dark:text-white"
                : "cursor-pointer bg-red-600 hover:-translate-y-0.5 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-600"
            }
          `}
      >
        <Trash2 className=" h-4 w-4 md:h-6 md:w-6 md:scale-150" />
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
              <h3 className="text-lg font-semibold">Delete candidate</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!txHash && (
              <p className="mb-4 text-sm text-neutral-700 dark:text-neutral-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{candidateName}</span>? This
                action cannot be undone.
              </p>
            )}

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
                  Deleting candidate…{" "}
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
                Candidate deleted on-chain.
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              {!txHash && (
                <>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={delMutation.isPending}
                    className={`inline-flex items-center cursor-pointer rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300
                        ${
                          delMutation.isPending
                            ? "opacity-50 cursor-not-allowed bg-black text-white dark:bg-white dark:text-black"
                            : "bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        }
                      `}
                  >
                    Delete
                  </button>
                </>
              )}
              {txHash && (
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
