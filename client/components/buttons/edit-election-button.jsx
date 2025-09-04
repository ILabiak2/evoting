"use client";
import React, { useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { useTxStatus } from "@/lib/hooks/useTxStatus";
import { useEditElectionName } from "@/lib/hooks/useEditElectionName";

export const EditElectionNameButton = ({
  electionAddress,
  currentName,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const editName = useEditElectionName();

  const { data: statusData, error: statusError } = useTxStatus(
    txHash || undefined,
    electionAddress
  );
  const confirmed = Boolean(statusData?.confirmed);

  useEffect(() => {
    setName(currentName || "");
  }, [currentName]);

  const handleOpen = () => {
    if (disabled) return;
    setErrorMessage("");
    setTxHash(null);
    setOpen(true);
  };

  const submitRename = async () => {
    if (!name || name.trim().length < 3) {
      setErrorMessage("Name must be at least 3 characters.");
      return;
    }
    if (name.trim().length > 30) {
      setErrorMessage("Name must be less than 30 characters.");
      return;
    }
    setErrorMessage("");
    setConfirming(true);
    setTxHash(null);
    try {
      const res = await editName.mutateAsync({
        address: electionAddress,
        newName: name,
      });
      if (res?.txHash) setTxHash(res.txHash);
      else setErrorMessage("Unexpected server response.");
    } catch (err) {
      setErrorMessage(err?.message || "Failed to rename election.");
    } finally {
      setConfirming(false);
    }
  };

  const busy =
    disabled || confirming || editName.isPending || (!!txHash && !confirmed);

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={busy}
        title={
          disabled
            ? "Election has already started or ended"
            : "Edit election name"
        }
        className={`ml-3 inline-flex items-center justify-center rounded-md border-1 p-2 text-sm transform transition-transform duration-300
          ${busy ? "cursor-not-allowed opacity-50 bg-black text-white dark:bg-white dark:text-black" : "cursor-pointer bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
        aria-label="Edit election name"
      >
        <Pencil className="h-4 w-4" />
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
                  ? "Could not rename"
                  : txHash
                    ? statusError
                      ? "Could not verify"
                      : confirmed
                        ? "Changes confirmed"
                        : "Submitting changes…"
                    : "Edit election name"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {!txHash ? (
              <div className="space-y-4">
                <label htmlFor="new-name" className="block text-sm font-medium">
                  New name
                </label>
                <input
                  id="new-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Enter new election name"
                />
                {errorMessage && (
                  <div className="rounded bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm">
                    {errorMessage}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRename}
                    disabled={confirming || editName.isPending || !name?.trim()}
                    className={`inline-flex items-center cursor-pointer rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300 ${confirming || editName.isPending || !name?.trim() ? "opacity-50 cursor-not-allowed bg-black text-white dark:bg-white dark:text-black" : "bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
                  >
                    {confirming || editName.isPending ? "Submitting…" : "Save"}
                  </button>
                </div>
              </div>
            ) : !confirmed ? (
              <div className="flex items-center gap-3 text-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <div>
                  Waiting for confirmations…{" "}
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
            ) : (
              <div className="inline-flex items-center gap-2 text-green-600 font-medium text-sm">
                <Check className="h-5 w-5" /> Name change was confirmed
                on-chain.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
