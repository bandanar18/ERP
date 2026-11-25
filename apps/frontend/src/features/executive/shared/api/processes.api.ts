import { apiFetch } from './api-client';
import { apiUrl } from './config';

export async function getMyProcessAssignments() {
  const res = await apiFetch(apiUrl('/processes/mine'));
  return res.json();
}

