"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IconBrandGoogle,
  IconEye, IconEyeOff
} from "@tabler/icons-react";
import { useId } from "react";
import { useRouter } from 'next/navigation'
import { LabelInputContainer, BottomGradient } from '@/components/signup-form'


export default function Login() {
  const id = useId();
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState([]);
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const fieldErrors = [];
    setErrors([])
    setGeneralError('')

    if (!email) fieldErrors.push('Email is required');
    if (!password) fieldErrors.push('Password is required');
    if (password && password.length < 8) fieldErrors.push('Password must be at least 6 characters');

    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      setLoading(false)
      return;
    }

    try {
      const res = await fetch('/api/server/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 201) {
        const data = await res.json();
        document.cookie = `access_token=${data.access_token}; Path=/; SameSite=Lax; Max-Age=1296000`;
        router.push('/dashboard')
      } else {
        let data = await res.json()
        console.log(typeof data.message === 'string')
        if (typeof data.message === 'string') {
          setGeneralError(data?.message)
        } else {
          setGeneralError(data?.message.join('.'))
        }
      }

    } catch (err) {
      console.error('Sign in error:', err);
      setGeneralError(err.message || 'Registration failed.');
    } finally {
      setLoading(false)
    }
  };
  return (
    <div
      className="shadow-input border-1 z-20 mt-5 mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to ChainVote
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Sign in to take part in innovative voting process
      </p>
      <form className="my-4" onSubmit={handleSubmit}>
        {generalError && (
          <div className="mb-4 text-sm text-red-600 font-medium">
            {generalError}
          </div>
        )}
        {errors[0] && <p className="text-sm mb-1 text-red-500">{errors[0]}</p>}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" placeholder="youremail@gmail.com" type="email" />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="•••••"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500"
              onClick={() => setShowPassword(prev => !prev)}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </span>
          </div>
        </LabelInputContainer>

        <button
          className={cn("group/btn relative block h-10 w-full cursor-pointer rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
            loading && "opacity-50 cursor-not-allowed"
          )}
          type="submit">
          Sign in &rarr;
          <BottomGradient />
        </button>
        <p className="mt-4 text-sm text-center text-neutral-600 dark:text-neutral-300">
          Don’t have an account?{' '}
          <a
            href="/signup"
            className="font-medium text-black dark:text-white hover:underline"
          >
            Sign up
          </a>
        </p>

        <div
          className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input cursor-pointer relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button" onClick={() => { window.location.href = '/api/server/auth/google' }}>
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Sign in with Google
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>
    </div>
  );
}
