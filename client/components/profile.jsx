"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  ExternalLink,
  Clock,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Play,
  StopCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserActions } from "@/lib/hooks/useUserActions";

function shortAddr(addr = "", len = 6) {
  if (!addr) return "";
  if (addr.length <= len * 2) return addr;
  return `${addr.slice(0, len)}...${addr.slice(-len)}`;
}

function formatLocalTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function getIconForDescription(desc) {
  if (!desc || typeof desc !== "string") return { Icon: null, color: "" };
  const d = desc.toLowerCase();
  if (
    d.includes("casted vote") ||
    d.includes("votecast") ||
    d.includes("cast vote")
  )
    return { Icon: Check, color: "text-green-600 dark:text-green-400" };
  if (d.includes("added candidate"))
    return { Icon: Plus, color: "text-blue-600 dark:text-blue-400" };
  if (d.includes("removed candidate"))
    return { Icon: Trash2, color: "text-red-600 dark:text-red-400" };
  if (d.includes("renamed candidate") || d.includes("renamed"))
    return { Icon: Edit3, color: "text-yellow-600 dark:text-yellow-400" };
  if (d.includes("started"))
    return { Icon: Play, color: "text-indigo-600 dark:text-indigo-400" };
  if (d.includes("ended"))
    return { Icon: StopCircle, color: "text-pink-600 dark:text-pink-400" };
  if (d.includes("created"))
    return { Icon: Plus, color: "text-cyan-600 dark:text-cyan-400" };
  if (d.includes("end time"))
    return { Icon: Clock, color: "text-blue-600 dark:text-blue-400" };
  return { Icon: null, color: "" };
}

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  //   const data = [
  //     {
  //       id: 82,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xce6151b49e2c739dcdf49e4bcd976a9e5b74663fc3b43f16ba1434844e22ac86",
  //       description: "Election test1232 created",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 57,
  //       created_at: "2025-09-12T16:29:57.751Z",
  //       time: "2025-09-12T16:29:46.000Z",
  //       election_meta: {
  //         id: 57,
  //         contract_id: 3,
  //         election_address: "0x7BAb69CC9977919D7e44d4fAFF5080a4E6577e63",
  //         name: "test1232",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 77,
  //       user_id: "d8ba9dcb-cbea-4054-9ceb-ebfd83c5eff9",
  //       tx_hash:
  //         "0x1ae5fdc6029be2ba1d5cd097e7c8bcc1e02ea63dbb1e98b92122723b45b8e8da",
  //       description: "Casted vote to candidate Alice Johnson in election sdfsdf",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:29:11.754Z",
  //       time: "2025-09-07T12:29:03.000Z",
  //       election_meta: {
  //         id: 56,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //       },
  //     },
  //     {
  //       id: 73,
  //       user_id: "d8ba9dcb-cbea-4054-9ceb-ebfd83c5eff9",
  //       tx_hash:
  //         "0xfecc50909df9cc1cdfad1d601a195f7d1de312dca4faf2c6510261834bc06681",
  //       description: "Election sdfsd ended",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 55,
  //       created_at: "2025-09-07T12:28:15.241Z",
  //       time: "2025-09-07T12:28:06.000Z",
  //       election_meta: {
  //         id: 55,
  //         election_address: "0xe2aaE359C5CFc83EeB52fF764E8b916D0B7d1446",
  //         name: "sdfsd",
  //         election_type: "public_single_choice",
  //       },
  //     },
  //     {
  //       id: 81,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xce6151b49e2c739dcdf49e4bcd976a9e5b74663fc3b43f16ba1434844e22ac86",
  //       description: "Added candidate Bob Smith to election test1232",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 57,
  //       created_at: "2025-09-12T16:29:57.030Z",
  //       time: "2025-09-12T16:29:46.000Z",
  //       election_meta: {
  //         id: 57,
  //         contract_id: 3,
  //         election_address: "0x7BAb69CC9977919D7e44d4fAFF5080a4E6577e63",
  //         name: "test1232",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 80,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xce6151b49e2c739dcdf49e4bcd976a9e5b74663fc3b43f16ba1434844e22ac86",
  //       description: "Added candidate Alice Johnson to election test1232",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 57,
  //       created_at: "2025-09-12T16:29:56.587Z",
  //       time: "2025-09-12T16:29:46.000Z",
  //       election_meta: {
  //         id: 57,
  //         contract_id: 3,
  //         election_address: "0x7BAb69CC9977919D7e44d4fAFF5080a4E6577e63",
  //         name: "test1232",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 79,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x1839fabd86541a115fca6f1f024c9c041d5c0083d2c8bdfce258b6a81c0ecfbc",
  //       description:
  //         "Election sdfsdf end time was removed. Creator will be able to end it manually",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:51:13.629Z",
  //       time: "2025-09-07T12:51:05.000Z",
  //       election_meta: {
  //         id: 56,
  //         contract_id: 2,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 78,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x0df2389bba6539dbf892d806db5373966843cf0deaf9aa396bd53bf83180533b",
  //       description: "Election sdfsdf end time was set to  08/09/2025, 12:46:00",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:46:28.795Z",
  //       time: "2025-09-07T12:46:19.000Z",
  //       election_meta: {
  //         id: 56,
  //         contract_id: 2,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 74,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x2258077cb6e41cf7be633078baae1eb096587bce44f76cb3021930c24fa62945",
  //       description: "Added candidate Alice Johnson to election sdfsdf",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:28:54.642Z",
  //       time: "2025-09-07T12:28:45.000Z",
  //       election_meta: {
  //         id: 56,
  //         contract_id: 2,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 75,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x2258077cb6e41cf7be633078baae1eb096587bce44f76cb3021930c24fa62945",
  //       description: "Added candidate Bob Smith to election sdfsdf",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:28:55.073Z",
  //       time: "2025-09-07T12:28:45.000Z",
  //       election_meta: {
  //         id: 56,
  //         contract_id: 2,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 76,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x2258077cb6e41cf7be633078baae1eb096587bce44f76cb3021930c24fa62945",
  //       description: "Election sdfsdf created",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 56,
  //       created_at: "2025-09-07T12:28:55.742Z",
  //       time: "2025-09-07T12:28:45.000Z",
  //       election_meta: {
  //         id: 56,
  //         contract_id: 2,
  //         election_address: "0x2F78f1525C2356847713D7DF0E547263CD56f835",
  //         name: "sdfsdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 72,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x29a687d382c79af7173a2e273b021f043551a10070cfd3c267cbc4ee4c47c26c",
  //       description: "Election sdfsd end time was set to  07/09/2025, 12:28:00",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 55,
  //       created_at: "2025-09-07T12:27:54.089Z",
  //       time: "2025-09-07T12:27:45.000Z",
  //       election_meta: {
  //         id: 55,
  //         contract_id: 1,
  //         election_address: "0xe2aaE359C5CFc83EeB52fF764E8b916D0B7d1446",
  //         name: "sdfsd",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 69,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xb13f0771132f607dba154cb25efb96be41ec853033f2fa1697b730b5b3bb1e6f",
  //       description: "Added candidate Alice Johnson to election sdfsd",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 55,
  //       created_at: "2025-09-07T12:27:30.071Z",
  //       time: "2025-09-07T12:27:20.000Z",
  //       election_meta: {
  //         id: 55,
  //         contract_id: 1,
  //         election_address: "0xe2aaE359C5CFc83EeB52fF764E8b916D0B7d1446",
  //         name: "sdfsd",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 70,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xb13f0771132f607dba154cb25efb96be41ec853033f2fa1697b730b5b3bb1e6f",
  //       description: "Added candidate Bob Smith to election sdfsd",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 55,
  //       created_at: "2025-09-07T12:27:30.489Z",
  //       time: "2025-09-07T12:27:20.000Z",
  //       election_meta: {
  //         id: 55,
  //         contract_id: 1,
  //         election_address: "0xe2aaE359C5CFc83EeB52fF764E8b916D0B7d1446",
  //         name: "sdfsd",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 71,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xb13f0771132f607dba154cb25efb96be41ec853033f2fa1697b730b5b3bb1e6f",
  //       description: "Election sdfsd created",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 55,
  //       created_at: "2025-09-07T12:27:31.539Z",
  //       time: "2025-09-07T12:27:20.000Z",
  //       election_meta: {
  //         id: 55,
  //         contract_id: 1,
  //         election_address: "0xe2aaE359C5CFc83EeB52fF764E8b916D0B7d1446",
  //         name: "sdfsd",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 68,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0x2834a90bf7262bdc0a60d98c0b7961aa2ab6ae054fc07260f60eaa9a726765dc",
  //       description: "Election sdf end time was set to  07/09/2025, 12:19:00",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 54,
  //       created_at: "2025-09-07T12:18:57.615Z",
  //       time: "2025-09-07T12:18:48.000Z",
  //       election_meta: {
  //         id: 54,
  //         contract_id: 0,
  //         election_address: "0x1fBb5D8484C1D1618A1c1088F6586F032daF8838",
  //         name: "sdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 65,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xcbd69585e9f6e29ad7975fc477cb9a86c25ad90ac01b4f39cf639fd238c687ed",
  //       description: "Added candidate Alice Johnson to election sdf",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 54,
  //       created_at: "2025-09-07T12:18:36.725Z",
  //       time: "2025-09-07T12:18:27.000Z",
  //       election_meta: {
  //         id: 54,
  //         contract_id: 0,
  //         election_address: "0x1fBb5D8484C1D1618A1c1088F6586F032daF8838",
  //         name: "sdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 66,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xcbd69585e9f6e29ad7975fc477cb9a86c25ad90ac01b4f39cf639fd238c687ed",
  //       description: "Added candidate Bob Smith to election sdf",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 54,
  //       created_at: "2025-09-07T12:18:37.180Z",
  //       time: "2025-09-07T12:18:27.000Z",
  //       election_meta: {
  //         id: 54,
  //         contract_id: 0,
  //         election_address: "0x1fBb5D8484C1D1618A1c1088F6586F032daF8838",
  //         name: "sdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //     {
  //       id: 67,
  //       user_id: "71caf9f0-eed0-48ca-bf4b-d3bc2422a1c3",
  //       tx_hash:
  //         "0xcbd69585e9f6e29ad7975fc477cb9a86c25ad90ac01b4f39cf639fd238c687ed",
  //       description: "Election sdf created",
  //       factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       election_id: 54,
  //       created_at: "2025-09-07T12:18:37.808Z",
  //       time: "2025-09-07T12:18:27.000Z",
  //       election_meta: {
  //         id: 54,
  //         contract_id: 0,
  //         election_address: "0x1fBb5D8484C1D1618A1c1088F6586F032daF8838",
  //         name: "sdf",
  //         election_type: "public_single_choice",
  //         factory_address: "0x40dF405441F8663B16DE8B5A3f4252dEBa7dD474",
  //       },
  //     },
  //   ];
  // const isLoading = true;
  // const error = null;
  // const actions =[]

  const { data: actions, isLoading, error } = useUserActions();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex h-full w-full flex-1 flex-col gap-2 border-neutral-200 bg-white p-2 md:p-10 md:pt-0 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex items-center justify-between mb-4 md:mt-4">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Recent actions you performed
            </p>
          </div>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-[90vh] pb-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black dark:border-white" />
            </div>
          ) : error ? (
            <div className="text-red-600">
              {error?.message || "Failed to load actions"}
            </div>
          ) : !actions || actions.length === 0 ? (
            <div className="flex text-2xl text-center items-center justify-center h-[90vh] pb-12 text-neutral-600">
              No recent activity
            </div>
          ) : (
            <div className="">
              <ul className="space-y-4 max-h-[75vh] overflow-y-auto">
                {actions
                  .slice((page - 1) * 10, (page - 1) * 10 + 10)
                  .map((action) => {
                    const addr =
                      action?.election_meta?.election_address ||
                      action?.election_address ||
                      "";
                    const name = action?.election_meta?.name || addr;
                    return (
                      <li key={action.id} className="list-none">
                        <div className="relative rounded-2xl border p-4 bg-white dark:bg-neutral-900 dark:border-neutral-800">
                          <GlowingEffect
                            blur={0}
                            borderWidth={1}
                            spread={24}
                            glow={false}
                            disabled={true}
                            proximity={64}
                            inactiveZone={0.01}
                          />

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-semibold">
                                  {name}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <span>{shortAddr(action.tx_hash)}</span>
                                  <a
                                    href={`https://sepolia.arbiscan.io/tx/${action.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                              <div className="mt-2 space-y-1">
                                {(
                                  action.descriptions || [action.description]
                                ).map((desc, i) => {
                                  const { Icon, color } =
                                    getIconForDescription(desc);
                                  return (
                                    <div
                                      key={i}
                                      className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex items-start gap-2"
                                    >
                                      {Icon ? (
                                        <Icon
                                          className={`h-5 w-5 shrink-0 mt-0.5 ${color}`}
                                        />
                                      ) : null}
                                      <div className="whitespace-pre-wrap">
                                        {desc}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center text-sm text-muted-foreground gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatLocalTime(
                                    action.time || action.created_at
                                  )}
                                </span>
                              </div>

                              <div className="w-full md:w-auto flex justify-end md:justify-end">
                                <a
                                  href={`/election/${addr}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    router.push(`/election/${addr}`);
                                  }}
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span>Visit</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 cursor-pointer rounded-md border ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                >
                  Prev
                </button>

                <div className="text-sm text-muted-foreground">
                  Page {page} of {Math.max(1, Math.ceil(actions.length / 10))}
                </div>

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(actions.length / 10), p + 1)
                    )
                  }
                  disabled={page >= Math.ceil(actions.length / 10)}
                  className={`px-3 py-1 cursor-pointer rounded-md border ${page >= Math.ceil(actions.length / 10) ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
