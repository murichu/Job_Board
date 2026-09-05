import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSavedSearches() {
  return useQuery(['savedSearches'], async () => {
    const res = await axios.get('/api/saved-searches');
    return res.data;
  });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation((payload) => axios.post('/api/saved-searches', payload), {
    onSuccess: () => qc.invalidateQueries(['savedSearches'])
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation((id) => axios.delete(`/api/saved-searches/${id}`), {
    onSuccess: () => qc.invalidateQueries(['savedSearches'])
  });
}
