"use client";
import Link from "next/link";
import { Github, Mail, Globe, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-8 w-full border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3 text-sm">
          {/* Logo + Tagline */}
          <div>
            <h2 className="text-lg font-bold text-black dark:text-white">ChainVote</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Secure, transparent, and decentralized voting for the modern era.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Quick Links</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/dashboard" className="hover:underline text-gray-600 dark:text-gray-400">Dashboard</Link></li>
              <li><Link href="/about" className="hover:underline text-gray-600 dark:text-gray-400">About</Link></li>
              {/* <li><Link href="/contact" className="hover:underline text-gray-600 dark:text-gray-400">Contact</Link></li> */}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Contacts</h3>
            <ul className="mt-2 flex gap-4">
              <li>
                <a href="https://github.com/ILabiak" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
                  <Github size={18} />
                </a>
              </li>
              <li>
                <a href="mailto:support@chainvote.com" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
                  <Mail size={18} />
                </a>
              </li>
              {/* <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
                  <Twitter size={18} />
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-10 border-t pt-6 border-neutral-200 dark:border-neutral-800 text-xs text-center text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} ChainVote. All rights reserved.
        </div>
      </div>
    </footer>
  );
}