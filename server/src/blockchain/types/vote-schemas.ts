import * as PublicSingleABI from '../_abi/PublicElection.json';
import * as PrivateSingleABI from '../_abi/PrivateElection.json';
// import * as PublicMultiABI from '../_abi/PublicMultiElection.json'; // if you add later

import { ElectionType } from './election-type.enum';
import type { TypedDataField } from 'ethers';

type VoteConfig = {
  abi: any;
  method: string;
  structName: string;
  domainName: string;
  types: Record<string, TypedDataField[]>;
  buildAgs: (args: {
    voter: string;
    candidateId?: number;
    electionId?: number;
    candidateIds?: number[];
    voteSignature: string;
    authSignature?: string;
  }) => any[];
};

export const VOTE_REGISTRY: Record<ElectionType, VoteConfig> = {
  [ElectionType.PUBLIC_SINGLE_CHOICE]: {
    abi: PublicSingleABI,
    method: 'voteWithSignature',
    structName: 'VotePublicSingleChoice',
    domainName: 'PublicElection',
    types: {
      Vote: [
        { name: 'electionId', type: 'uint256' },
        { name: 'candidateId', type: 'uint256' },
        { name: 'voter', type: 'address' },
      ],
    },
    buildAgs: ({ voter, candidateId, voteSignature }) => [
      candidateId,
      voter,
      voteSignature,
    ],
  },

  [ElectionType.PRIVATE_SINGLE_CHOICE]: {
    abi: PrivateSingleABI,
    method: 'voteWithSignature(uint256,address,bytes,bytes)',
    structName: 'VotePrivateSingleChoice',
    domainName: 'PrivateElection',
    types: {
      Vote: [
        { name: 'electionId', type: 'uint256' },
        { name: 'candidateId', type: 'uint256' },
        { name: 'voter', type: 'address' },
      ],
    },
    buildAgs: ({ voter, candidateId, voteSignature, authSignature }) => [
      candidateId,
      voter,
      voteSignature,
      authSignature,
    ],
  },

  // Example multi-choice:
  // [ElectionType.PUBLIC_MULTI_CHOICE]: {
  //   abi: PublicMultiABI,
  //   method: 'voteWithSignature',
  //   structName: 'VoteMultiChoice',
  //   types: {
  //     VoteMultiChoice: [
  //       { name: 'voter',        type: 'address' },
  //       { name: 'candidateIds', type: 'uint256[]' },
  //       { name: 'nonce',        type: 'uint256' },
  //       { name: 'deadline',     type: 'uint256' },
  //     ],
  //   },
  //   buildValue: ({ voter, candidateIds, nonce, deadline }) => ({
  //     voter,
  //     candidateIds,
  //     nonce,
  //     deadline,
  //   }),
  // },
};
