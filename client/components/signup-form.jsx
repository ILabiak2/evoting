"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IconBrandGoogle,
  IconEye, IconEyeOff
} from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useId } from "react";
import { useRouter } from 'next/navigation'


export default function SignupForm() {
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
    const firstName = formData.get('firstname');
    const lastName = formData.get('lastname');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmpassword');
    const name = `${firstName} ${lastName}`.trim();

    const fieldErrors = [];
    setErrors([])
    setGeneralError('')

    if (!firstName) fieldErrors.push('First name is required');
    if (!lastName) fieldErrors.push('Last name is required');
    if (!email) fieldErrors.push('Email is required');
    if (!password) fieldErrors.push('Password is required');
    if (password && password.length < 8) fieldErrors.push('Password must be at least 6 characters');
    if (password !== confirmPassword) fieldErrors.push('Passwords do not match');

    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      setLoading(false)
      return;
    }

    try {
      const res = await fetch('/api/server/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (res.status === 201) {
        const data = await res.json();
        const isProduction =
          process.env.NEXT_PUBLIC_NODE_ENV === "production" ||
          process.env.NODE_ENV === "production";
        document.cookie = `access_token=${data.access_token}; Path=/; SameSite=Lax; Max-Age=1296000${isProduction ? "; Secure" : ""}`;
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
      console.error('Signup error:', err);
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
        Sign up to take part in innovative voting process
      </p>
      <form className="my-4" onSubmit={handleSubmit}>
        {generalError && (
          <div className="mb-4 text-sm text-red-600 font-medium">
            {generalError}
          </div>
        )}
        {errors[0] && <p className="text-sm mb-1 text-red-500">{errors[0]}</p>}
        <div
          className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <LabelInputContainer error={errors.firstname}>
            <Label htmlFor="firstname" >First name</Label>
            <Input id="firstname" name="firstname" placeholder="Tyler" type="text" />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input id="lastname" name="lastname" placeholder="Durden" type="text" />
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="role">Role</Label>
          {/* <Input id="role" placeholder="projectmayhem@fc.com" type="email" /> */}
          <Select defaultValue="user" onValueChange={(val) => setRole(val)}>
            <SelectTrigger id={id}>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Voter</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
            </SelectContent>
          </Select>
        </LabelInputContainer>
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
        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirmpassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmpassword"
              name="confirmpassword"
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
          Sign up &rarr;
          <BottomGradient />
        </button>
        <p className="mt-4 text-sm text-center text-neutral-600 dark:text-neutral-300">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-black dark:text-white hover:underline"
          >
            Sign in
          </a>
        </p>

        <div
          className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input cursor-pointer relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button" onClick={() => { window.location.href = '/api/server/auth/google'}}>
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Sign up with Google
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>
    </div>
  );
}

export const BottomGradient = () => {
  return (
    <>
      <span
        className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span
        className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

export const LabelInputContainer = ({
  children,
  className,
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
