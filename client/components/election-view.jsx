"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useElectionData } from "@/lib/hooks/useElectionData";
import { useGenerateInvites } from "@/lib/hooks/useGenerateInvites";
import {
  useJoinPublicElection,
  useLeavePublicElection,
} from "@/lib/hooks/useJoinElection";
import { useVoteStatus } from "@/lib/hooks/useVoteStatus";
import { useVoteInElection } from "@/lib/hooks/useVoteInElection";
import {
  Bell,
  Copy,
  ArrowLeft,
  Check,
  X,
  Heart,
  CheckCircle2,
} from "lucide-react";

const ElectionType = {
  public_single_choice: "Public (Single Choice)",
  private_single_choice: "Private (Single Choice)",
};

export default function ElectionView({ address }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: election, isLoading, error } = useElectionData(address);
  // const election = {
  //   id: 0,
  //   name: "Election for Student Body President",
  //   startTime: 1754477820,
  //   endTime: 0,
  //   creator: "0x076bC5E783c557287A88a1Ee427b0fbf3E17c5bF",
  //   isActive: false,
  //   startedManually: false,
  //   endedManually: false,
  //   candidateCount: 3,
  //   voterLimit: 0,
  //   electionType: "public_single_choice",
  //   contractAddress: "0xAEe41ce7bd26596E31236ff34260B163fBb29D9D",
  //   candidates: [
  //     {
  //       id: 0,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 1,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 2,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //     {
  //       id: 3,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 4,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 5,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //     {
  //       id: 6,
  //       name: "Sarah Chen",
  //       votes: 120,
  //     },
  //     {
  //       id: 7,
  //       name: "David Lee",
  //       votes: 110,
  //     },
  //     {
  //       id: 8,
  //       name: "Maria RodriguezRodriguezRodriguez",
  //       votes: 95,
  //     },
  //   ],
  //   totalVotes: 325,
  //   isCreator: true,
  //   hasVoted: false,
  //   votedCandidateIds: [1, 4],
  // };
  // const isLoading = false;
  // const error = false;

  const handleCopyAddress = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 md:pt-0 dark:border-neutral-700 dark:bg-neutral-950">
        {/* <h1 className="text-2xl font-bold">{address}</h1> */}
        <div className="flex gap-2 border-b">
          <div className="h-15 md:h-20 w-full rounded-lg flex flex-row items-center gap-2">
            <p className=" md:inline text-bg md:text-3xl">
              Your address:&nbsp;
            </p>
            <p
              className="text-bg md:text-2xl cursor-pointer"
              title="Click to copy address"
              onClick={() => {
                if (user.public_address) {
                  navigator.clipboard.writeText(user.public_address);
                }
              }}
            >
              {user.public_address
                ? `${user.public_address.slice(
                    0,
                    4
                  )}...${user.public_address.slice(-4)}`
                : ""}
            </p>
          </div>
          <div className="h-15 md:h-20 flex justify-end items-center w-full rounded-lg">
            <button
              onClick={() => {
                router.push("/dashboard");
              }}
              className="w-60 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Back to dashboard
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-1 overflow-y-auto items-start">
          {isLoading && (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mb-4"></div>
              <p className="text-2xl text-center font-bold mb-20">
                Loading election data...
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <p className="text-2xl text-center font-bold">
                Error loading election data.
              </p>
              <p className="text-2xl text-center text-red-500 font-bold mb-2">
                {error?.message}
              </p>
              <div className="h-15 md:h-20 flex justify-center items-center w-full rounded-lg">
                <button
                  onClick={() => {
                    router.push("/dashboard");
                  }}
                  className="w-60 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
                >
                  Back to dashboard
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && election && (
            <div className="w-full">
              {/* Election Title */}
              <div className="mb-8">
                <div className="flex flex-row items-center justify-between md:pr-0">
                  <div className="flex flex-row items-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {election.name}
                    </h1>
                    <span
                      className={`ml-5 p-2 inline-block h-3 w-3 rounded-full
                      ${
                        election?.isActive
                          ? "bg-green-500 animate-pulse shadow-[0_0_12px_4px_rgba(34,197,94,0.7)]"
                          : "bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.7)]"
                      }`}
                    ></span>
                  </div>
                  <JoinElectionButton
                    electionAddress={election?.contractAddress}
                    electionType={election?.electionType}
                    isCreator={election?.isCreator}
                    isParticipant={election?.isParticipant}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Address:</p>
                  <p
                    className="cursor-pointer text-sm font-medium hover:text-primary break-words hyphens-auto"
                    title="Click to copy address"
                    onClick={() => handleCopyAddress(election.contractAddress)}
                  >
                    {election.contractAddress}
                  </p>
                  <button
                    onClick={() => handleCopyAddress(election.contractAddress)}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span
                    title={election.electionType}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    {ElectionType[election.electionType] ??
                      election.electionType}
                  </span>
                </div>
              </div>

              {/* Candidates Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Candidates</h2>
                <div className="border border-neutral-200 rounded-lg overflow-hidden dark:border-neutral-700">
                  <div className="bg-sidebar-primary px-6 py-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <span className="font-medium">Candidate</span>
                      <span className="font-medium">Votes</span>
                      {election?.hasVoted ? (
                        <span className="font-medium text-right md:mr-10">
                          Your vote
                        </span>
                      ) : (
                        <span className="font-medium text-right mr-8 md:mr-10">
                          Action
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-700 items-center max-h-[30vh] md:max-h-[40vh] overflow-y-auto">
                    {election.candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="px-6 py-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center w-full">
                            <span className="font-medium break-words hyphens-auto w-full">
                              {candidate.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">
                              {candidate.votes}
                            </span>
                          </div>
                          {election?.isCreator ? (
                            <EditButton
                              disabled={
                                election.isActive || election.startedManually
                              }
                              candidateId={candidate.id}
                              electionAddress={election.contractAddress}
                            />
                          ) : (
                            <>
                              {election?.hasVoted ? (
                                <div className="flex items-center justify-end text-right md:mr-10">
                                  {Array.isArray(election.votedCandidateIds) &&
                                  election.votedCandidateIds.includes(
                                    candidate.id
                                  ) ? (
                                    <span className="inline-flex items-center text-green-500 font-medium">
                                      <Check className="h-5 w-5 mr-1" />
                                      Voted
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <VoteButton
                                  candidateId={candidate.id}
                                  electionAddress={election.contractAddress}
                                  disabled={
                                    String(election?.electionType).includes(
                                      "private"
                                    ) && !election.isParticipant
                                  }
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {election?.isCreator && election.endTime <= 0 && (
                <div className="flex flex-col md:flex-row gap-4">
                  {election?.isActive ? <StopButton /> : <StartButton />}
                  {election.electionType.includes("private") && (
                    <InviteCodesGenerator
                      electionAddress={election.contractAddress}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const VoteButton = ({ candidateId, electionAddress, disabled }) => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  // const [success, setSuccess] = useState(false);
  const voteMutation = useVoteInElection();
  const {
    data: statusData,
    isLoading: polling,
    error: statusError,
  } = useVoteStatus(txHash, electionAddress);

  const confirmed = Boolean(statusData?.confirmed);

  const handleCastVote = async () => {
    if (disabled) return;
    setErrorMessage("");
    // setSuccess(false);
    setTxHash(null);
    try {
      const res = await voteMutation.mutateAsync({
        address: electionAddress,
        voteData: {
          candidateId,
        },
      });
      if (res?.txHash) {
        // setSuccess(true);
        setTxHash(res.txHash);
        setOpen(true);
      } else {
        setErrorMessage("Unexpected server response.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Failed to submit vote.");
    } finally {
      setOpen(true);
    }
  };

  return (
    <div className="flex items-center justify-end text-right">
      <button
        onClick={handleCastVote}
        disabled={disabled || voteMutation.isPending || (txHash && !confirmed)}
        className={`flex-1 w-24 max-h-20 transform max-md:text-xs rounded-lg border-1 px-6 py-2 font-medium transition-all duration-300 md:w-32 md:max-w-32 border-neutral-800 dark:border-neutral-200 ${
          disabled || voteMutation.isPending || (txHash && !confirmed)
            ? "cursor-not-allowed opacity-50 bg-black text-white dark:bg-white dark:text-black"
            : "cursor-pointer bg-black text-white hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        }`}
        title={
          disabled
            ? "You can't vote in this election"
            : txHash && !confirmed
              ? "Waiting for confirmation…"
              : "Vote for this candidate"
        }
      >
        {voteMutation.isPending ? "Voting..." : (txHash && !confirmed) ? "Pending…" : "Vote"}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-300 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
              {errorMessage
                  ? "Could not vote"
                  : statusError
                  ? "Could not verify"
                  : confirmed
                  ? "Vote confirmed"
                  : "Submitting your vote…"}
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
                  Vote confirmed on-chain.
                </div>
                {typeof statusData?.candidateId === "number" && (
                  <div>Candidate ID: {statusData.candidateId}</div>
                )}
                {Array.isArray(statusData?.candidateIds) && (
                  <div>Candidate IDs: {statusData.candidateIds.join(", ")}</div>
                )}
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
    </div>
  );
};

const EditButton = ({ candidateId, electionAddress, disabled }) => {
  const handleEditCandidate = () => {
    console.log(`Edit candidate ${candidateId}: ${electionAddress}`);
  };

  return (
    <div className="flex items-center justify-end text-right">
      {disabled ? (
        <button
          disabled
          title="Election already started"
          className="flex-1 w-24 max-h-20 transform max-md:text-xs cursor-not-allowed opacity-50 rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 md:max-w-32 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
        >
          Edit
        </button>
      ) : (
        <button
          onClick={() => console.log(`Edit candidate ${candidate.id}`)}
          className="flex-1 w-24 max-h-20 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 md:max-w-32 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200"
        >
          Edit
        </button>
      )}
    </div>
  );
};

const StartButton = ({ electionAddress }) => {
  const handleStartElection = () => {
    console.log(`Start election ${electionAddress}`);
  };

  return (
    <button
      onClick={handleStartElection}
      className="flex-1 md:inline transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-3 md:py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-52 md:max-w-80 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800"
    >
      Start Election
    </button>
  );
};

const StopButton = ({ electionAddress }) => {
  const handleStopElection = () => {
    console.log(`Start election ${electionAddress}`);
  };

  return (
    <button
      onClick={handleStopElection}
      className="flex-1 md:inline transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-3 md:py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-52 md:max-w-80 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800"
    >
      Stop Election
    </button>
  );
};

const InviteCodesGenerator = ({ electionAddress }) => {
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
        .join("\r\n"); // use CRLF for widest compatibility
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
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
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

const JoinElectionButton = ({
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
