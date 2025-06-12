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
import { Bolt, BookOpen, CircleUserRound, Layers2, LogOut, Pin, UserPen, UserRound } from "lucide-react";
import Link from 'next/link'
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";
import { useRouter } from 'next/navigation'


{/* <div>
    <Link href={'/login'}
        className="w-24 transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-32 dark:border-gray-600 dark:bg-black dark:text-white dark:hover:bg-gray-800">
        Login
    </Link>
    <Link href={'/signup'}
        className="w-24 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200">
        Sign Up
    </Link>
</div> */}

export function Navbar() {
    const [isDark, setIsDark] = useState(null)
    const [isMonted, setIsMounted] = useState(false)
    const [user, setUser] = useState(null)
    const router = useRouter()

    // Load theme on first render
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark)
        setIsDark(isDarkMode)
        document.documentElement.classList.toggle('dark', isDarkMode)

        fetch('/api/server/auth/me', {
            method: 'GET',
            credentials: 'include', // important: send cookies
        })
            .then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw new Error('Not authenticated')
                }
            })
            .then((user) => {
                console.log('Logged in user:', user)
                setUser(user)
                setIsMounted(true)
            })
            .catch(() => {
                // document.cookie = 'access_token=; Max-Age=0; path=/;';
                setIsMounted(true)
            })
    }, [])


    // Toggle theme
    const toggleTheme = () => {
        const newTheme = !isDark
        setIsDark(newTheme)
        localStorage.setItem('theme', newTheme ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', newTheme)
    }

    const handleLogout = () => {
        document.cookie = 'access_token=; Path=/; Max-Age=0';
        router.push('/')
    }

    if (isDark === null) return null

    return (
        <nav
            className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 min-md:pl-15 min-md:pr-15">
            <Link href={'/'} className="flex items-center gap-2">
                {/* <div
          className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" /> */}
                <h1 className="text-base font-bold md:text-2xl">ChainVote</h1>
            </Link>

            {
                isMonted && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
                        <Toggle
                            variant="outline"
                            className="max-md:mt-[3px] cursor-pointer transform border-1 data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted h-[37px] w-[37px] flex items-center justify-center max-md:h-[32px] max-md:w-[34px]"
                            pressed={!isDark}
                            onClick={toggleTheme}
                            aria-label={`Switch to ${!isDark ? "light" : "dark"} mode`}
                        >
                            {
                                isDark ? <Moon size={16} strokeWidth={2} className="transition-all max-md:size-3" />
                                    : <Sun size={16} strokeWidth={2} className="transition-all max-md:size-3" />
                            }
                        </Toggle>
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
                                            <img
                                                src="https://originui.com/avatar.jpg"
                                                alt="Avatar"
                                                width={32}
                                                height={32}
                                                className="shrink-0 rounded-full"
                                            />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-foreground">{user?.name}</span>
                                                <span className="truncate text-xs font-normal text-muted-foreground">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={()=> {router.push('/dashboard')}}>
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
                                    className="w-24 transform max-md:text-xs cursor-pointer mr-2 rounded-lg border-1 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 md:w-32 dark:border-gray-600 dark:bg-black dark:text-white dark:hover:bg-gray-800">
                                    Login
                                </Link>
                                <Link href={'/signup'}
                                    className="w-24 transform max-md:text-xs cursor-pointer rounded-lg border-1 bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200">
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
