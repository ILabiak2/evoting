"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Check, Filter } from "lucide-react";

export function ElectionResults({ election }) {
  const candidates = election.candidates || [];
  const totalVotes = Number(
    election.totalVotes ||
      candidates.reduce((s, c) => s + Number(c.votes || 0), 0)
  );

  const [sortKey, setSortKey] = useState("id");
  const [order, setOrder] = useState("asc");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const votesWithPct = useMemo(() => {
    const arr = candidates.map((c) => {
      const votes = Number(c.votes || 0);
      const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
      return { ...c, votes, pct };
    });

    const sorted = [...arr].sort((a, b) => {
      if (sortKey === "id") {
        return order === "asc"
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }
      if (sortKey === "votes") {
        return order === "asc" ? a.votes - b.votes : b.votes - a.votes;
      }
      return 0;
    });

    return sorted;
  }, [candidates, totalVotes, sortKey, order]);

  const maxVotes = votesWithPct.reduce((m, c) => Math.max(m, c.votes), 0);
  const winners = votesWithPct.filter(
    (c) => c.votes === maxVotes && maxVotes > 0
  );

  const currentLabel = useMemo(() => {
    if (sortKey === "id") return order === "asc" ? "ID ↑" : "ID ↓";
    return order === "asc" ? "Votes ↑" : "Votes ↓";
  }, [sortKey, order]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Results</h2>
          <p className="text-sm text-muted-foreground">
            Total votes: {totalVotes}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Winner Details */}
          <div className="text-right">
            {winners.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground">
                  Winner{winners.length > 1 ? "s" : ""}:
                </div>
                <div className="font-medium">
                  {winners.map((w) => w.name).join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No votes were cast
              </div>
            )}
          </div>

          {/* Filter dropdown */}
          <div className="relative mr-1" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((s) => !s);
              }}
              title="Sort results"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300/60 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {currentLabel}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-neutral-200 bg-white shadow-lg z-50 dark:border-neutral-800 dark:bg-neutral-900">
                <ul className="py-1">
                  <li
                    className={`px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer dark:text-neutral-100 ${sortKey === "id" && order === "asc" ? "font-semibold bg-neutral-50 dark:bg-neutral-800" : ""}`}
                    onClick={() => {
                      setSortKey("id");
                      setOrder("asc");
                      setMenuOpen(false);
                    }}
                  >
                    <span>ID ↑ (asc)</span>
                    {sortKey === "id" && order === "asc" && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </li>

                  <li
                    className={`px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer dark:text-neutral-100 ${sortKey === "id" && order === "desc" ? "font-semibold bg-neutral-50 dark:bg-neutral-800" : ""}`}
                    onClick={() => {
                      setSortKey("id");
                      setOrder("desc");
                      setMenuOpen(false);
                    }}
                  >
                    <span>ID ↓ (desc)</span>
                    {sortKey === "id" && order === "desc" && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </li>

                  <li
                    className={`px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer dark:text-neutral-100 ${sortKey === "votes" && order === "asc" ? "font-semibold bg-neutral-50 dark:bg-neutral-800" : ""}`}
                    onClick={() => {
                      setSortKey("votes");
                      setOrder("asc");
                      setMenuOpen(false);
                    }}
                  >
                    <span>Votes ↑ (asc)</span>
                    {sortKey === "votes" && order === "asc" && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </li>

                  <li
                    className={`px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer dark:text-neutral-100 ${sortKey === "votes" && order === "desc" ? "font-semibold bg-neutral-50 dark:bg-neutral-800" : ""}`}
                    onClick={() => {
                      setSortKey("votes");
                      setOrder("desc");
                      setMenuOpen(false);
                    }}
                  >
                    <span>Votes ↓ (desc)</span>
                    {sortKey === "votes" && order === "desc" && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {votesWithPct.map((c) => (
          <div key={c.id} className="p-3 border rounded-md">
            <div className="flex items-center justify-between">
              <div className="truncate font-medium">{c.name}</div>
              <div className="text-sm font-medium">
                {c.votes} ({c.pct.toFixed(1)}%)
              </div>
            </div>
            <div className="mt-2 h-3 w-full rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded bg-gradient-to-r from-green-400 to-green-600`}
                style={{ width: `${Math.max(0, Math.min(100, c.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
