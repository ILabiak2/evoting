"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useUserElections } from "@/lib/hooks/useUserElections";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const ElectionType = {
  public_single_choice: "Public (Single Choice)",
  private_single_choice: "Private (Single Choice",
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: elections, isLoading, error } = useUserElections();
  const router = useRouter();
  // const [elections, setElections] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex gap-2">
          <div className="h-15 md:h-20 w-full rounded-lg flex flex-row items-center gap-2">
            <p className="text-2xl md:text-3xl font-bold">Elections</p>
            <p className="flex items-center justify-center text-2xl ml-2 md:ml-5 md:text-3xl font-bold rounded-full min-w-[3rem] px-2 aspect-square bg-sidebar select-none">
              1
            </p>
          </div>
          <div className="h-15 md:h-20 flex justify-end items-center w-full rounded-lg">
            {user?.role == "user" && (
              <>
                <p className="hidden md:inline text-bg md:text-xl">
                  Your address:&nbsp;
                </p>
                <p
                  className="text-xl md:text-xl cursor-pointer"
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
              </>
            )}
            {user?.role === "creator" && (
              <button
                onClick={() => {
                  router.push("/election-create");
                }}
                className="w-60 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
              >
                Create election
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-1 overflow-y-auto items-start">
          {!isLoading ? (
            elections?.length > 0 ? (
              <ul className="w-full grid grid-cols-1 gap-4 xl:grid-cols-2">
                {elections.map((election) => (
                  <ElectionInfo
                    key={election.id}
                    title={election.name}
                    isActive={election.isActive}
                    votes={election.totalVotes}
                    userRole={user?.role}
                    electionType={ElectionType[election.electionType]}
                    address={election.contractAddress}
                    router={router}
                  />
                ))}
              </ul>
            ) : (
              <>
                {user?.role === "creator" && (
                  <div className="flex flex-col justify-center items-center h-full w-full">
                    <p className="text-2xl text-center font-bold mb-4">
                      No elections yet. <br /> Create your first election
                    </p>
                    <button
                      onClick={() => {
                        router.push("/election-create");
                      }}
                      className="w-60 transform mb-20 rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
                    >
                      Create election
                    </button>
                  </div>
                )}
                {user?.role === "user" && (
                  <div className="flex flex-col justify-center items-center h-full w-full">
                    <p className="text-2xl text-center font-bold mb-4">
                      You're not invited to any elections yet. <br /> Join an
                      election
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-20">
                      <Input
                        id="inviteCode"
                        name="inviteCode"
                        placeholder="Your code"
                        type="text"
                        className="w-85 md:w-full  md:mt-0 mt-4"
                      />
                      <button
                        onClick={() => {
                          console.log("join election");
                        }}
                        className="w-40 transform rounded-lg cursor-pointer border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
                      >
                        Join election
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col justify-center items-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mb-4"></div>
              <p className="text-2xl text-center font-bold mb-20">
                Loading elections...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ElectionInfo = ({
  area,
  isActive,
  title,
  votes,
  userRole,
  electionType,
  address,
  router,
}) => {
  return (
    <li className={`list-none min-h-[14rem] ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          blur={0}
          borderWidth={1}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 h-full relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="space-y-3 flex flex-col justify-between h-full">
              <div className="flex justify-between">
                <h3 className="-tracking-4 font-sans text-center text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                  {title}
                </h3>
                <div className="flex flex-row items-center">
                  <h3 className="-tracking-4 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                    {isActive ? "Active" : "Ended"}
                  </h3>
                  <span
                    className={`ml-3 inline-block h-3 w-3 rounded-full
                                            ${
                                              isActive
                                                ? "bg-green-500 animate-pulse shadow-[0_0_12px_4px_rgba(34,197,94,0.7)]"
                                                : "bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.7)]"
                                            }`}
                  ></span>
                </div>
              </div>

              <div className="flex justify-between">
                {userRole === "user" ? (
                  <h3 className="-tracking-4 font-sans text-left text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                    Election type: {electionType}
                  </h3>
                ) : (
                  <h3 className="-tracking-4 font-sans text-center text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                    Votes: {votes}
                  </h3>
                )}

                <button 
                onClick={() => {
                  router.push(`/election/${address}`);
                }}
                className="w-30 transform rounded-lg cursor-pointer bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  {userRole === "creator"
                    ? "Manage"
                    : isActive
                    ? "Vote"
                    : "Results"}
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
