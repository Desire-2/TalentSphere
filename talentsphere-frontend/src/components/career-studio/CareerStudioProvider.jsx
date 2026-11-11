import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { careerAgentService } from '../../services/careerAgentService';
import {
  IN_FLIGHT_PACKAGE_STATUSES,
  TEMPLATE_OPTIONS,
  generationStatus,
} from './studioData';

const CareerStudioContext = createContext(null);

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

/**
 * Single source of truth for the Career Studio: profile readiness, usage and
 * entitlements, subscription plans, the generation list, the in-flight
 * generation poller, and the template catalog. Every section of the studio
 * reads from here so no component duplicates an API call.
 */
export function CareerStudioProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [templates, setTemplates] = useState(TEMPLATE_OPTIONS);
  const [activePackage, setActivePackage] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [pollNonce, setPollNonce] = useState(0);

  const mountedRef = useRef(true);
  const templatesLoadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadTemplates = useCallback(async () => {
    if (templatesLoadedRef.current) return;
    try {
      const data = await careerAgentService.getTemplates();
      const rows = Array.isArray(data?.templates) ? data.templates : [];
      if (mountedRef.current && rows.length) {
        setTemplates(rows.map((item) => ({
          key: item.key,
          label: item.label,
          hint: item.hint || item.description || '',
          description: item.description || '',
          grayscale: Boolean(item.grayscale),
          defaultAccent: item.default_accent,
        })));
      }
      templatesLoadedRef.current = true;
    } catch {
      // The mirrored registry in studioData stays as the fallback catalog.
    }
  }, []);

  // Background refreshes are silent by default so a manual refresh never
  // unmounts the section the user is interacting with; only the initial boot
  // flips the loading flag.
  const refresh = useCallback(async ({ silent = true } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [profile, usageData, rows] = await Promise.all([
        careerAgentService.getProfile(),
        careerAgentService.getUsage(),
        careerAgentService.listGenerations(),
      ]);
      const list = Array.isArray(rows) ? rows : [];
      if (mountedRef.current) {
        setReadiness(profile);
        setUsage(usageData);
        setGenerations(list);
      }

      const inFlight = list.find((row) => IN_FLIGHT_PACKAGE_STATUSES.has(generationStatus(row.status)));
      const completed = list.find((row) => generationStatus(row.status) === 'COMPLETED');

      const [inFlightDetail, completedDetail] = await Promise.allSettled([
        inFlight ? careerAgentService.getGeneration(inFlight.id) : Promise.resolve(null),
        completed ? careerAgentService.getGeneration(completed.id) : Promise.resolve(null),
      ]);

      if (mountedRef.current) {
        const inFlightValue = inFlightDetail.status === 'fulfilled' ? inFlightDetail.value : inFlight;
        setGenerating((current) => {
          if (inFlightValue) return inFlightValue;
          if (current && IN_FLIGHT_PACKAGE_STATUSES.has(generationStatus(current.status))) return current;
          return null;
        });
        const completedValue = completedDetail.status === 'fulfilled' ? completedDetail.value : null;
        if (completedValue) setActivePackage(completedValue);
        if (!silent) setError(null);
      }
      loadTemplates();
    } catch (loadError) {
      if (mountedRef.current && !silent) {
        setError(loadError.message || 'Could not load your career studio.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loadTemplates]);

  // Initial boot (not silent: shows the shell loading state and surfaces errors).
  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  // Poll the in-flight package until it reaches a terminal state. Cadence
  // mirrors the backend's worker: quick at first, slower when the tab is
  // hidden, and always cleaned up on unmount or completion.
  const generatingId = generating?.id;
  const generatingStatus = generating ? generationStatus(generating.status) : '';
  useEffect(() => {
    if (!generatingId || !IN_FLIGHT_PACKAGE_STATUSES.has(generatingStatus)) return undefined;

    let cancelled = false;
    let polling = false;
    let attempt = 0;
    let timer = null;

    const poll = async () => {
      if (cancelled || polling) return;
      polling = true;
      try {
        const next = await careerAgentService.getGeneration(generatingId);
        if (cancelled) return;
        const nextStatus = generationStatus(next?.status);
        attempt = 0;
        if (nextStatus === 'COMPLETED') {
          setGenerating(null);
          setActivePackage(next);
          setGenerations((previous) => previous.map((row) => (row.id === generatingId ? { ...row, status: 'COMPLETED' } : row)));
          careerAgentService.getUsage()
            .then((fresh) => { if (mountedRef.current) setUsage(fresh); })
            .catch(() => {});
          return;
        }
        if (TERMINAL.has(nextStatus)) {
          setGenerating(next);
          setGenerations((previous) => previous.map((row) => (row.id === generatingId ? { ...row, status: nextStatus } : row)));
          return;
        }
        setGenerating(next);
      } catch (pollError) {
        if (pollError?.status && pollError.status >= 400 && pollError.status < 500 && pollError.status !== 429) {
          // A client error (expired package, revoked access) will not heal by
          // polling; stop and surface the last known state instead.
          cancelled = true;
          return;
        }
        attempt += 1;
      } finally {
        polling = false;
        if (!cancelled) {
          const base = 8000 + Math.floor(Math.random() * 1500);
          const delay = document.visibilityState === 'hidden'
            ? 24000
            : Math.min(base * 2 ** attempt, 20000);
          timer = setTimeout(poll, delay);
        }
      }
    };

    timer = setTimeout(poll, 800);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [generatingId, generatingStatus, pollNonce]);

  const startGeneration = useCallback(async (payload) => {
    const result = await careerAgentService.generate(payload);
    if (mountedRef.current) {
      if (result?.package) setGenerating(result.package);
      if (result?.usage) setUsage(result.usage);
      setGenerations((previous) => {
        const next = result?.package;
        if (!next) return previous;
        const exists = previous.some((row) => row.id === next.id);
        return exists ? previous : [next, ...previous];
      });
    }
    return result;
  }, []);

  const retryGeneration = useCallback(async (packageId) => {
    const next = await careerAgentService.retryGeneration(packageId);
    if (mountedRef.current) {
      setGenerating(next);
      setPollNonce((value) => value + 1);
      setGenerations((previous) => previous.map((row) => (row.id === packageId ? { ...row, status: next?.status || 'PENDING' } : row)));
    }
    return next;
  }, []);

  // Used by deep links (?package_id=…) to bring one package into focus.
  const focusPackage = useCallback(async (packageId) => {
    const id = Number(packageId);
    if (!Number.isInteger(id) || id <= 0) return null;
    try {
      const detail = await careerAgentService.getGeneration(id);
      if (!mountedRef.current || !detail) return null;
      const status = generationStatus(detail.status);
      if (IN_FLIGHT_PACKAGE_STATUSES.has(status)) setGenerating(detail);
      else if (status === 'COMPLETED') setActivePackage(detail);
      return detail;
    } catch {
      return null;
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    try {
      const fresh = await careerAgentService.getUsage();
      if (mountedRef.current) setUsage(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const fresh = await careerAgentService.getSubscription();
      if (mountedRef.current) setSubscription(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const fresh = await careerAgentService.getProfile();
      if (mountedRef.current) setReadiness(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const deleteEvidence = useCallback(async (evidenceId) => {
    await careerAgentService.deleteEvidence(evidenceId);
    setReadiness((previous) => ({
      ...previous,
      candidate: {
        ...previous?.candidate,
        evidence_sources: (previous?.candidate?.evidence_sources || [])
          .filter((item) => item.evidence_id !== evidenceId),
      },
    }));
  }, []);

  const value = useMemo(() => ({
    loading,
    error,
    dismissError: () => setError(null),
    setError,
    readiness,
    usage,
    subscription,
    generations,
    templates,
    activePackage,
    generating,
    refresh,
    refreshUsage,
    refreshSubscription,
    refreshProfile,
    startGeneration,
    retryGeneration,
    focusPackage,
    deleteEvidence,
  }), [
    loading, error, readiness, usage, subscription, generations, templates,
    activePackage, generating, refresh, refreshUsage, refreshSubscription,
    refreshProfile, startGeneration, retryGeneration, focusPackage, deleteEvidence,
  ]);

  return <CareerStudioContext.Provider value={value}>{children}</CareerStudioContext.Provider>;
}

export function useCareerStudio() {
  const context = useContext(CareerStudioContext);
  if (!context) throw new Error('useCareerStudio must be used within a CareerStudioProvider');
  return context;
}

export default CareerStudioProvider;
