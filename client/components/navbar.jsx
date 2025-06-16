"use client";

import React, { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bolt, BookOpen, CircleUserRound, Layers2, LogOut, User } from "lucide-react";
import Link from 'next/link'
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext';
import { ThemeToggle } from '@/components/theme-toggle'

export function Navbar() {
    const { user, loading } = useAuth();
    const router = useRouter()

    const handleLogout = () => {
        document.cookie = 'access_token=; Path=/; Max-Age=0';
        window.location.reload();
    }

    return (
        <nav
            className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 min-md:pl-15 min-md:pr-15">
            <Link href={'/'} className="flex items-center gap-2">
                {/* <div
          className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" /> */}
                <h1 className="text-base font-bold md:text-2xl">ChainVote</h1>
            </Link>

            {
                !loading && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
                        <ThemeToggle />
                        {user ? (
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button size="icon" variant="outline" aria-label="Open account menu"
                                            className='max-md:mt-[3px] dark:border-neutral-800 rounded-md text-sm cursor-pointer transform border-1 transition-colors hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted h-[37px] w-[37px] flex items-center justify-center max-md:h-[32px] max-md:w-[34px]'>
                                            <CircleUserRound size={16} strokeWidth={2} aria-hidden="true" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="bottom" align="end" className="max-w-64">
                                        <DropdownMenuLabel className="flex items-start gap-3">
                                            {/* <img
                                                src={user?.avatar_url || ''}
                                                alt="Avatar"
                                                width={32}
                                                height={32}
                                                loading="lazy"
                                                decoding="async"
                                                className="shrink-0 rounded-full"
                                            /> */}
                                            <User size={32} className="shrink-0 text-black dark:text-white" />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-foreground">{user?.name}</span>
                                                <span className="truncate text-xs font-normal text-muted-foreground">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => { router.push('/dashboard') }}>
                                                <Bolt size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                                                <span>Vote</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Layers2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                                                <span>Settings</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}>
                                            <LogOut size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) :
                            <div>
                                <Link href={'/login'}
                                    className="w-24 transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-32 dark:bg-black dark:border-border dark:text-white dark:hover:bg-gray-800">
                                    Login
                                </Link>
                                <Link href={'/signup'}
                                    className="w-24 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white border-neutral-800 dark:border-neutral-200 dark:text-black dark:hover:bg-gray-200">
                                    Sign Up
                                </Link>
                            </div>
                        }

                    </div>
                )
            }

        </nav>
    );
};
