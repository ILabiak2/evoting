"use client";
import React, { useState } from "react";
import { useAuth } from '@/app/context/AuthContext';


export default function Dashboard() {
    const { user } = useAuth();
    
    return (
        <div className="flex flex-1 flex-col">
            <div
                className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
                <div className="flex gap-2">
                    <div
                        className="h-15 md:h-20 w-full rounded-lg flex flex-row items-center gap-2">
                        <p className="text-2xl md:text-3xl font-bold">Elections</p>
                        <p className="flex items-center justify-center text-2xl ml-2 md:ml-5 md:text-3xl font-bold rounded-full min-w-[3rem] px-2 aspect-square bg-sidebar select-none">1</p>
                    </div>
                    <div
                        className="h-15 md:h-20 flex justify-end items-center w-full rounded-lg">
                        <p className="hidden md:inline text-bg md:text-xl">
                            Your address:&nbsp;
                        </p>
                        <p
                            className="text-xl md:text-xl cursor-pointer hover:underline"
                            title="Copy address"
                            onClick={() => {
                                if (user.public_address) {
                                    navigator.clipboard.writeText(user.public_address);
                                }
                            }}
                        >
                            {user.public_address
                                ? `${user.public_address.slice(0, 4)}...${user.public_address.slice(-4)}`
                                : ""}
                        </p>
                    </div>
                </div>
                {/* <div className="flex flex-1 gap-2">
                    {[...new Array(2)].map((i, idx) => (
                        <div
                            key={"second-array-demo-1" + idx}
                            className="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800"></div>
                    ))}
                </div> */}
            </div>
        </div>
    );
};
