import { useMutation } from '@tanstack/react-query';

export const useCreateElection = () => {
  return useMutation({
    mutationFn: async (electionData) => {
      const res = await fetch('/api/server/election', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(electionData),
      });
      if (!res.ok) {
        let err = 'Failed to create election:\n';
        const result = await res.json()
        console.log(result)
        if (result?.message[0]) {
          err += `${result?.message[0]}`;
        }
        throw new Error(err);
      }
      return res.json();
    },
  });
};
