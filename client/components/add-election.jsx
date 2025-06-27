"use client";
import React, { useState } from "react";
import { LabelInputContainer, BottomGradient } from '@/components/signup-form'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2 } from 'lucide-react';




export default function AddElection() {
    const [errors, setErrors] = useState([]);
    const [generalError, setGeneralError] = useState('');
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState([
        { id: 1, name: 'Alice Johnson' },
        { id: 2, name: 'Bob Smith' },
        // { id: 3, name: 'Alice Johnson' },
        // { id: 4, name: 'Bob Smith' },
        // { id: 5, name: 'Alice Johnson' },
        // { id: 6, name: 'Bob Smith' },
        // { id: 7, name: 'Alice Johnson' },
        // { id: 8, name: 'Bob Smith' },
        // { id: 9, name: 'Alice Johnson' },
        // { id: 10, name: 'Bob Smith' },
    ]);

    return (
        <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2 overflow-y-auto h-full w-full p-2 md:p-10 bg-white dark:bg-neutral-950">
            <div
                className="w-full order-1 md:order-1 md:shadow-input md:dark:shadow-neutral-900 border-0 z-20 md:mt-5 md:mx-5 md:max-w-md rounded-2xl p-4 md:p-8">
                <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                    Create an election
                </h2>
                <p className="mt-2 max-w-sm md:pb-5 text-sm text-neutral-600 dark:text-neutral-300">
                    Your public address: 0x...23
                </p>
                <form className="mt-4 md:my-4" onSubmit={() => { console.log('123') }}>
                    {generalError && (
                        <div className="mb-4 text-sm text-red-600 font-medium">
                            {generalError}
                        </div>
                    )}
                    {errors[0] && <p className="text-sm mb-1 text-red-500">{errors[0]}</p>}
                    <LabelInputContainer className="mb-4 md:mb-10">
                        <Label htmlFor="name">Election name</Label>
                        <Input id="name" name="name" placeholder="Parlament Election" type="text" />
                    </LabelInputContainer>
                    <LabelInputContainer className="mb-4">
                        <Label htmlFor="voterLimit">Voter limit <span className="text-neutral-400">(optional)</span></Label>
                        <span className="text-neutral-400 text-sm">Leave blank or enter 0 for unlimited voters</span>
                        <Input
                            id="voterLimit"
                            name="voterLimit"
                            type="number"
                            placeholder="e.g. 100"
                            min="0"
                        />
                    </LabelInputContainer>
                    <div className="md:mb-10 flex items-center space-x-2">
                        <input
                            id="startImmediately"
                            name="startImmediately"
                            type="checkbox"
                            className="h-5 w-5 cursor-pointer rounded"
                        />
                        <label htmlFor="startImmediately" className="text-sm text-neutral-700 dark:text-white">
                            Start immediately
                        </label>
                    </div>
                </form>
            </div>


            <div
                className="w-full md:shadow-input md:dark:shadow-neutral-900 order-3 md:order-2 h-full border-0 z-20 md:mt-5 md:mx-5 md:max-w-md rounded-2xl p-4  md:p-8 ">
                <form className=" flex h-full flex-col justify-between" onSubmit={() => { console.log('123') }}>
                    <div className="">
                        <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                            Candidates
                        </h2>
                        {/* <LabelInputContainer className="mb-4 md:mb-10">
                                <Label htmlFor="name">Election name</Label>
                                <Input id="name" name="name" placeholder="Parlament Election" type="text" />
                            </LabelInputContainer> */}
                        <div className="space-y-3 mt-2 max-h-72 overflow-y-auto pr-1">
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2 dark:border-neutral-700"
                                >
                                    <span className="text-sm text-neutral-800 dark:text-neutral-200">
                                        {candidate.name}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCandidates(candidates.filter((c) => c.id !== candidate.id))
                                        }
                                        className="text-red-500 hover:text-red-700 cursor-pointer"
                                        type="button"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </form>
            </div>

            <div className="flex flex-col h-full order-4 md:order-3 justify-between  md:shadow-input md:dark:shadow-neutral-900 border-0 z-20 md:mt-5  md:mx-5 w-full md:max-w-md rounded-2xl p-4 md:p-8">
                <div
                    className="mt-2 h-[1px] mb-4 md:mb-10 w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                <div className="">
                    <button
                        className={cn("group/btn relative block h-10 w-full cursor-pointer rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                        type="submit">
                        Create election &rarr;
                        <BottomGradient />
                    </button>

                    <div
                        className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                </div>
            </div>

            <div className="flex flex-col h-full order-2 md:order-4 justify-between md:shadow-input md:dark:shadow-neutral-900 border-0 z-20 md:mt-5 md:mx-5 w-full md:max-w-md rounded-2xl px-4 md:p-8">
                <div
                    className="mt-2 h-[1px] mb-4 md:mb-10 w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                <div>
                    <LabelInputContainer className="mb-4">
                        <Label htmlFor="candidate-name">Candidate name</Label>
                        <Input id="candidate-name" name="candidate-name" placeholder="Joe Biden" type="text" />
                    </LabelInputContainer>
                    <div className="">
                        <button
                            className={cn("group/btn relative block h-10 w-full cursor-pointer rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
                                loading && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => { console.log(1) }}>
                            Add candidate &rarr;
                            <BottomGradient />
                        </button>

                        <div
                            className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                    </div>
                </div>
            </div>



        </div >
    );
};