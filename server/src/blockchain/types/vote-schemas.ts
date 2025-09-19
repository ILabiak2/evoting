import * as PublicSingleABI from '../_abi/PublicElection.json';
import * as PrivateSingleABI from '../_abi/PrivateElection.json';
import * as PublicMultiABI from '../_abi/PublicElectionMulti.json';
import * as PrivateMultiABI from '../_abi/PrivateElectionMulti.json';

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
  [ElectionType.PUBLIC_MULTI_CHOICE]: {
    abi: PublicMultiABI,
    method: 'voteWithSignature',
    structName: 'VotePublicMultiChoice',
    domainName: 'PublicElectionMulti',
    types: {
      Vote: [
        { name: 'electionId', type: 'uint256' },
        { name: 'candidateIds', type: 'uint256[]' },
        { name: 'voter', type: 'address' },
      ],
    },
    buildAgs: ({ voter, candidateIds, voteSignature }) => [
      candidateIds,
      voter,
      voteSignature,
    ],
  },
  [ElectionType.PRIVATE_MULTI_CHOICE]: {
    abi: PrivateMultiABI,
    method: 'voteWithSignature(uint256[],address,bytes,bytes)',
    structName: 'VotePrivateMultiChoice',
    domainName: 'PrivateElectionMulti',
    types: {
      Vote: [
        { name: 'electionId', type: 'uint256' },
        { name: 'candidateIds', type: 'uint256[]' },
        { name: 'voter', type: 'address' },
      ],
    },
    buildAgs: ({ voter, candidateIds, voteSignature, authSignature }) => [
      candidateIds,
      voter,
      voteSignature,
      authSignature,
    ],
  },
};
