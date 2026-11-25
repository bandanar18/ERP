import { useCallback, useEffect, useState } from 'react';
import { projectService } from '../api/projects';
import { MOCK_PROJECTS, MOCK_COMPANIES, MOCK_STATS } from '../api/mock-data';
import type { Company, Project, ProjectStats } from '../types';

export function usePmProjects() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    projectService.getAll()
      .then((res) => setData(res.projects ?? []))
      .catch(() => setData(MOCK_PROJECTS))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

export function usePmCompanies() {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (projectService as any).getCompanies?.()
      .then((res: any) => setData(res?.companies ?? res ?? []))
      .catch(() => setData(MOCK_COMPANIES))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function usePmStats() {
  const [data, setData] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    projectService.getStats()
      .then(setData)
      .catch(() => setData(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
