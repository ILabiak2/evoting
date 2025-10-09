"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Copy, Check, X, Calendar, Clock } from "lucide-react";
import { useTxStatus } from "@/lib/hooks/useTxStatus";
import { useEditEndTime } from "@/lib/hooks/useEditEndTime";

export const SetEndDateButton = ({ electionAddress, endTime }) => {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const { data: statusData, error: statusError } = useTxStatus(
    txHash,
    electionAddress
  );
  const confirmed = Boolean(statusData?.confirmed);
  const editEndTime = useEditEndTime();

  useEffect(() => {
    if (endTime !== undefined && endTime !== 0) {
      const d = new Date(endTime * 1000);
      setWhen(formatLocalInput(d));
    }
  }, [endTime]);

  const [showPanel, setShowPanel] = useState(false);
  const [panelMonth, setPanelMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [panelDate, setPanelDate] = useState(() => new Date());
  const [panelHour, setPanelHour] = useState(() => new Date().getHours());
  const [panelMinute, setPanelMinute] = useState(() => new Date().getMinutes());

  const pad = (n) => String(n).padStart(2, "0");
  const formatLocalInput = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseLocalInput = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const openPanel = () => {
    const base = parseLocalInput(when) || new Date();
    const m = new Date(base);
    m.setDate(1);
    m.setHours(0, 0, 0, 0);
    setPanelMonth(m);
    setPanelDate(base);
    setPanelHour(base.getHours());
    setPanelMinute(base.getMinutes());
    setShowPanel(true);
  };
  const closePanel = () => setShowPanel(false);

  const applyPanel = () => {
    const d = new Date(panelDate);
    d.setHours(panelHour, panelMinute, 0, 0);
    setWhen(formatLocalInput(d));
    setShowPanel(false);
  };

  const addInterval = (ms) => {
    const base = parseLocalInput(when) || new Date();
    const after = new Date(base.getTime() + ms);
    setWhen(formatLocalInput(after));
  };

  const nowLocalForMin = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`; // local
  }, []);

  const handleOpen = () => {
    setErrorMessage("");
    setTxHash(null);
    if (endTime && endTime !== 0) {
      const d = new Date(Number(endTime) * 1000);
      setWhen(formatLocalInput(d));
    } else {
      setWhen("");
    }
    setOpen(true);
  };

  const handleConfirm = async () => {
    setErrorMessage("");
    try {
      if (!when) {
        setErrorMessage("Please pick date & time");
        return;
      }
      const picked = new Date(when); // local time
      const now = new Date();
      if (picked.getTime() <= now.getTime()) {
        setErrorMessage("End time must be in the future");
        return;
      }
      const endTime = Math.floor(picked.getTime() / 1000);

      const data = await editEndTime.mutateAsync({
        address: electionAddress,
        newEndTime: endTime,
      });
      if (data?.txHash) {
        setTxHash(data.txHash);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to set end date.");
    }
  };

  const busy = !!txHash && !confirmed;

  const handleClear = async () => {
    setErrorMessage("");
    setTxHash(null);
    try {
      const data = await editEndTime.mutateAsync({
        address: electionAddress,
        newEndTime: 0,
      });
      if (data?.txHash) {
        setTxHash(data.txHash);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to clear end date.");
    }
  };

  return (
    <>
      <div className="flex flex-row gap-2">
        <button
          onClick={handleOpen}
          disabled={busy || editEndTime.isPending}
          title="Schedule end date"
          className={`flex-1 md:inline transform max-md:text-xs rounded-lg border-1 bg-white px-6 py-3 md:py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-52 md:max-w-80 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800 ${busy || editEndTime.isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:-translate-y-0.5"}`}
        >
          Set end date
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setOpen(false);
            closePanel();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {errorMessage
                  ? "Could not set end date"
                  : txHash
                    ? statusError
                      ? "Could not verify"
                      : confirmed
                        ? "End date scheduled"
                        : "Submitting…"
                    : "Set end date"}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  closePanel();
                }}
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
            ) : !txHash ? (
              <div className="space-y-4">
                <label
                  htmlFor="end-datetime"
                  className="block text-sm font-medium mb-2"
                >
                  End date & time
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    {/* Input */}
                    <input
                      id="end-datetime"
                      type="datetime-local"
                      className="w-full appearance-none rounded-lg border border-neutral-300/80 bg-white pl-3 pr-14 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                      min={nowLocalForMin}
                    />
                    <style jsx>{`
                      #end-datetime::-webkit-calendar-picker-indicator {
                        display: none;
                        opacity: 0;
                      }
                      #end-datetime::-webkit-clear-button {
                        display: none;
                      }
                      #end-datetime::-webkit-inner-spin-button {
                        display: none;
                      }
                      #end-datetime::-webkit-outer-spin-button {
                        display: none;
                      }
                      /* Edge/IE fallback */
                      #end-datetime::-ms-clear {
                        display: none;
                      }
                      #end-datetime::-ms-reveal {
                        display: none;
                      }
                    `}</style>

                    <button
                      type="button"
                      onClick={() => {
                        if (showPanel) {
                          closePanel();
                        } else {
                          openPanel();
                        }
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 flex items-center justify-center rounded-md cursor-pointer hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300/60 dark:hover:bg-neutral-800 dark:focus:ring-neutral-700/60"
                      aria-label="Open calendar"
                    >
                      <Calendar className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                    </button>

                    {showPanel && (
                      <div className="absolute z-50 mt-2 w-[22rem] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Date(panelMonth);
                              m.setMonth(m.getMonth() - 1);
                              setPanelMonth(m);
                            }}
                            className="rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            ‹
                          </button>
                          <div className="text-sm font-medium">
                            {panelMonth.toLocaleString(undefined, {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Date(panelMonth);
                              m.setMonth(m.getMonth() + 1);
                              setPanelMonth(m);
                            }}
                            className="rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            ›
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (d) => (
                              <div key={d}>{d}</div>
                            )
                          )}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const firstDay = new Date(panelMonth);
                            const startIdx = firstDay.getDay();
                            const daysInMonth = new Date(
                              panelMonth.getFullYear(),
                              panelMonth.getMonth() + 1,
                              0
                            ).getDate();
                            const cells = [];
                            for (let i = 0; i < startIdx; i++)
                              cells.push(<div key={`b${i}`} />);
                            for (let d = 1; d <= daysInMonth; d++) {
                              const dayDate = new Date(
                                panelMonth.getFullYear(),
                                panelMonth.getMonth(),
                                d
                              );
                              const isSelected =
                                panelDate.getFullYear() ===
                                  dayDate.getFullYear() &&
                                panelDate.getMonth() === dayDate.getMonth() &&
                                panelDate.getDate() === dayDate.getDate();
                              const isPast =
                                dayDate <
                                new Date(new Date().setHours(0, 0, 0, 0));
                              const isDisabled = isPast;
                              cells.push(
                                <button
                                  type="button"
                                  key={`d${d}`}
                                  disabled={isDisabled}
                                  onClick={() => setPanelDate(dayDate)}
                                  className={[
                                    "rounded-md py-1 text-sm",
                                    isSelected
                                      ? "bg-black text-white dark:bg-white dark:text-black"
                                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                    !isDisabled
                                      ? "cursor-pointer"
                                      : "cursor-not-allowed opacity-60",
                                  ].join(" ")}
                                >
                                  {d}
                                </button>
                              );
                            }
                            return cells;
                          })()}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              Time
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={23}
                              value={panelHour}
                              onChange={(e) =>
                                setPanelHour(
                                  Math.max(
                                    0,
                                    Math.min(
                                      23,
                                      parseInt(e.target.value || "0", 10)
                                    )
                                  )
                                )
                              }
                              className="w-14 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                            />
                            <span>:</span>
                            <input
                              type="number"
                              min={0}
                              max={59}
                              step={5}
                              value={panelMinute}
                              onChange={(e) =>
                                setPanelMinute(
                                  Math.max(
                                    0,
                                    Math.min(
                                      59,
                                      parseInt(e.target.value || "0", 10)
                                    )
                                  )
                                )
                              }
                              className="w-14 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={closePanel}
                              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={applyPanel}
                              className="rounded-lg border px-3 py-1.5 text-sm bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Quick picks:
                    </span>
                    <button
                      type="button"
                      onClick={() => addInterval(5 * 60 * 1000)}
                      className="rounded-full cursor-pointer border border-neutral-300/70 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                    >
                      +5 min
                    </button>
                    <button
                      type="button"
                      onClick={() => addInterval(60 * 60 * 1000)}
                      className="rounded-full cursor-pointer border border-neutral-300/70 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                    >
                      +1 hour
                    </button>
                    <button
                      type="button"
                      onClick={() => addInterval(24 * 60 * 60 * 1000)}
                      className="rounded-full cursor-pointer border border-neutral-300/70 px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
                    >
                      +1 day
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    You can’t pick a past time. Minimum is now.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    {endTime !== 0 && (
                      <button
                        onClick={handleClear}
                        disabled={busy || editEndTime.isPending}
                        title="Clear end date"
                        className={`inline-flex items-center rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300 ${busy || editEndTime.isPending ? 'cursor-not-allowed opacity-50 bg-red-500 text-white dark:bg-red-700' : 'cursor-pointer bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'}`}
                      >
                        Clear end date
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center cursor-pointer rounded-lg border-1 bg-neutral-100 px-4 py-2 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={editEndTime.isPending}
                      className={`inline-flex items-center rounded-lg border-1 px-4 py-2 font-medium transition-all duration-300 ${editEndTime.isPending ? 'cursor-not-allowed opacity-50 bg-black text-white dark:bg-white dark:text-black' : 'cursor-pointer bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
                    >
                      {editEndTime.isPending ? "Submitting…" : "Set end date"}
                    </button>
                  </div>
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
                <Check className="h-5 w-5" /> End date set on-chain.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
