"use client";
import React, { useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  ExternalLink,
  Clock,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Play,
  StopCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserActions } from "@/lib/hooks/useUserActions";

function shortAddr(addr = "", len = 6) {
  if (!addr) return "";
  if (addr.length <= len * 2) return addr;
  return `${addr.slice(0, len)}...${addr.slice(-len)}`;
}

function formatLocalTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function getIconForDescription(desc) {
  if (!desc || typeof desc !== "string") return { Icon: null, color: "" };
  const d = desc.toLowerCase();
  if (
    d.includes("casted vote") ||
    d.includes("votecast") ||
    d.includes("cast vote")
  )
    return { Icon: Check, color: "text-green-600 dark:text-green-400" };
  if (d.includes("added candidate"))
    return { Icon: Plus, color: "text-blue-600 dark:text-blue-400" };
  if (d.includes("removed candidate"))
    return { Icon: Trash2, color: "text-red-600 dark:text-red-400" };
  if (d.includes("renamed candidate") || d.includes("renamed"))
    return { Icon: Edit3, color: "text-yellow-600 dark:text-yellow-400" };
  if (d.includes("started"))
    return { Icon: Play, color: "text-indigo-600 dark:text-indigo-400" };
  if (d.includes("ended"))
    return { Icon: StopCircle, color: "text-pink-600 dark:text-pink-400" };
  if (d.includes("created"))
    return { Icon: Plus, color: "text-cyan-600 dark:text-cyan-400" };
  if (d.includes("end time"))
    return { Icon: Clock, color: "text-blue-600 dark:text-blue-400" };
  return { Icon: null, color: "" };
}

export default function Profile() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: actions, isLoading, error } = useUserActions();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex h-full w-full flex-1 flex-col gap-2 border-neutral-200 bg-white p-2 md:p-10 md:pt-0 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex items-center justify-between mb-4 md:mt-4">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Recent actions you performed
            </p>
          </div>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-[90vh] pb-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black dark:border-white" />
            </div>
          ) : error ? (
            <div className="text-red-600">
              {error?.message || "Failed to load actions"}
            </div>
          ) : !actions || actions.length === 0 ? (
            <div className="flex text-2xl text-center items-center justify-center h-[90vh] pb-12 text-neutral-600">
              No recent activity
            </div>
          ) : (
            <div className="">
              <ul className="space-y-4 max-h-[75vh] overflow-y-auto">
                {actions
                  .slice((page - 1) * 10, (page - 1) * 10 + 10)
                  .map((action) => {
                    const addr =
                      action?.election_meta?.election_address ||
                      action?.election_address ||
                      "";
                    const name = action?.election_meta?.name || addr;
                    return (
                      <li key={action.id} className="list-none">
                        <div className="relative rounded-2xl border p-4 bg-white dark:bg-neutral-900 dark:border-neutral-800">
                          <GlowingEffect
                            blur={0}
                            borderWidth={1}
                            spread={24}
                            glow={false}
                            disabled={true}
                            proximity={64}
                            inactiveZone={0.01}
                          />

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-semibold">
                                  {name}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <span>{shortAddr(action.tx_hash)}</span>
                                  <a
                                    href={`https://sepolia.arbiscan.io/tx/${action.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                              <div className="mt-2 space-y-1">
                                {(
                                  action.descriptions || [action.description]
                                ).map((desc, i) => {
                                  const { Icon, color } =
                                    getIconForDescription(desc);
                                  return (
                                    <div
                                      key={i}
                                      className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex items-start gap-2"
                                    >
                                      {Icon ? (
                                        <Icon
                                          className={`h-5 w-5 shrink-0 mt-0.5 ${color}`}
                                        />
                                      ) : null}
                                      <div className="whitespace-pre-wrap">
                                        {desc}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center text-sm text-muted-foreground gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatLocalTime(
                                    action.time || action.created_at
                                  )}
                                </span>
                              </div>

                              <div className="w-full md:w-auto flex justify-end md:justify-end">
                                <a
                                  href={`/election/${addr}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    router.push(`/election/${addr}`);
                                  }}
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span>Visit</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 cursor-pointer rounded-md border ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                >
                  Prev
                </button>

                <div className="text-sm text-muted-foreground">
                  Page {page} of {Math.max(1, Math.ceil(actions.length / 10))}
                </div>

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(actions.length / 10), p + 1)
                    )
                  }
                  disabled={page >= Math.ceil(actions.length / 10)}
                  className={`px-3 py-1 cursor-pointer rounded-md border ${page >= Math.ceil(actions.length / 10) ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
