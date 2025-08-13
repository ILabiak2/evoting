import { useQuery } from '@tanstack/react-query';

export const useElectionStatus = (txHash) => {
  return useQuery({
    queryKey: ['election-status', txHash],
    queryFn: async () => {
      if (!txHash) throw new Error('No transaction hash provided');
      const res = await fetch(`/api/server/election/create-status/${txHash}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    enabled: !!txHash,
    refetchInterval: (query) => {
    //   console.log('Polling result:', query.state.data);
      if (!query.state.data?.confirmed) return 7000;
      return false;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
