import { useCallback, useEffect, useState } from 'react';
import { qcDashboardApi } from '../api/dashboard';
import { measurementApi } from '../api/measurement';
import { auditApi } from '../api/audit';
import { adminApi } from '../api/admin';
import { reportApi } from '../api/report';
import { userApi } from '../api/user';
import {
  MOCK_SUMMARY,
  MOCK_MATRIX,
  MOCK_PERIOD,
  MOCK_TREND,
  MOCK_PERFORMANCE,
  MOCK_MEASUREMENTS,
  MOCK_AUDIT,
  MOCK_PROCESSES,
  MOCK_USERS,
  MOCK_ROLES,
  MOCK_PERMISSIONS,
} from '../api/mock-data';
import type { QcMatrixEntry, QcPerformanceReport, QcReportingPeriod, QcSummary, QcTrendEntry } from '../types';
import type { QcMeasurement } from '../api/measurement';
import type { QcAuditEntry } from '../api/audit';
import type { QcAdminProcess } from '../api/admin';
import type { QcUserListItem, QcRoleWithPermissions, QcPermissionItem } from '../api/user';

/**
 * Carga datos desde la API y usa mock como fallback si falla.
 */
export function useQcSummary() {
  const [data, setData] = useState<QcSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    qcDashboardApi.summary()
      .then(setData)
      .catch(() => setData(MOCK_SUMMARY))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcMatrix() {
  const [data, setData] = useState<QcMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    qcDashboardApi.matrix()
      .then(setData)
      .catch(() => setData(MOCK_MATRIX))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcPeriod() {
  const [data, setData] = useState<QcReportingPeriod | null>(null);
  useEffect(() => {
    qcDashboardApi.activePeriod()
      .then(setData)
      .catch(() => setData(MOCK_PERIOD));
  }, []);
  return data;
}

export function useQcTrend() {
  const [data, setData] = useState<QcTrendEntry[]>([]);
  useEffect(() => {
    qcDashboardApi.complianceTrend()
      .then(setData)
      .catch(() => setData(MOCK_TREND));
  }, []);
  return data;
}

export function useQcPerformance() {
  const [data, setData] = useState<QcPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    reportApi.performance()
      .then(setData)
      .catch(() => setData(MOCK_PERFORMANCE))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcMeasurements() {
  const [data, setData] = useState<QcMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    measurementApi.list()
      .then(setData)
      .catch(() => setData(MOCK_MEASUREMENTS))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

export function useQcAudit() {
  const [data, setData] = useState<QcAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    auditApi.list()
      .then(setData)
      .catch(() => setData(MOCK_AUDIT))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcProcesses() {
  const [data, setData] = useState<QcAdminProcess[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi.listProcesses()
      .then(setData)
      .catch(() => setData(MOCK_PROCESSES))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcAdminIndicators() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi.listIndicators()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcUsers() {
  const [data, setData] = useState<QcUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    userApi.list()
      .then(setData)
      .catch(() => setData(MOCK_USERS))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useQcRoles() {
  const [data, setData] = useState<QcRoleWithPermissions[]>([]);
  useEffect(() => {
    userApi.roles()
      .then(setData)
      .catch(() => setData(MOCK_ROLES));
  }, []);
  return data;
}

export function useQcPermissions() {
  const [data, setData] = useState<QcPermissionItem[]>([]);
  useEffect(() => {
    userApi.permissions()
      .then(setData)
      .catch(() => setData(MOCK_PERMISSIONS));
  }, []);
  return data;
}
