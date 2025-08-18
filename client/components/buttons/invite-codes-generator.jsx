"use client";
import React, { useState } from "react";
import { useGenerateInvites } from "@/lib/hooks/useGenerateInvites";
import { Copy, X } from "lucide-react";

export const InviteCodesGenerator = ({ electionAddress }) => {
  const [qty, setQty] = useState("1");
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const invitesMutation = useGenerateInvites();

  const handleGenerate = async () => {
    setErrorMessage("");
    try {
      setLoading(true);
      const count = Math.max(1, Math.min(parseInt(qty || "0", 10) || 1, 200));
      const res = await invitesMutation.mutateAsync({
        electionAddress,
        quantity: count,
      });
      const out = Array.isArray(res?.codes) ? res.codes : [];
      setCodes(out);
      setOpen(true);
    } catch (err) {
      console.error("Failed to generate invites:", err);
      setErrorMessage(err?.message || "Failed to generate invites.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const copyOne = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
  };

  const copyAll = async () => {
    try {
      const text = codes
        .map((c) => String(c).trim())
        .filter(Boolean)
        .join("\r\n");
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={qty}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return setQty("");
            if (/^\d{0,3}$/.test(v)) setQty(v);
          }}
          onBlur={() => {
            const n = Math.max(1, Math.min(parseInt(qty || "0", 10) || 1, 200));
            setQty(String(n));
          }}
          className="w-24 rounded-lg border border-neutral-300 bg-white px-3 py-3 md:py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
          aria-label="Invite codes quantity"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || invitesMutation.isPending}
          className="flex-1 w-24 max-h-20 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-3 md:py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-70 md:max-w-80 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading || invitesMutation.isPending
            ? "Generating..."
            : "Generate Invite Codes"}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-neutral-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invite Codes</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 cursor-pointer rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded bg-red-100 border border-red-400 text-red-700 px-4 py-3">
                {errorMessage}
              </div>
            )}

            <div className="max-h-[50vh] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
              {codes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between py-2"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyOne(code)}
                    className="inline-flex items-center cursor-pointer gap-1 rounded px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title="Copy code"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              ))}
              {codes.length === 0 && (
                <div className="py-6 text-center text-sm text-neutral-500">
                  No codes generated.
                </div>
              )}
            </div>

            {!errorMessage && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={copyAll}
                  className="flex items-center justify-center cursor-pointer rounded-lg border-1 bg-black px-5 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
                >
                  Copy all
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
