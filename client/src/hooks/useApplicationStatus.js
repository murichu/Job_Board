import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation(
    ({ applicationId, newStatus, note }) => axios.patch(`/api/applications/${applicationId}/status`, { newStatus, note }),
    {
      onSuccess: (data) => {
        qc.invalidateQueries(['application', data.data._id]);
        qc.invalidateQueries(['employerApplications']);
        qc.invalidateQueries(['myApplications']);
      }
    }
  );
}
