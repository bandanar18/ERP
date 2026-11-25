import { useQuery } from '@tanstack/react-query';
import { getMyProcessAssignments } from '../api/processes.api';

export function useMyProcesses() {
  return useQuery({
    queryKey: ['myProcesses'],
    queryFn: getMyProcessAssignments,
  });
}
