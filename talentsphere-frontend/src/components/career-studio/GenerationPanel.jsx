import { AlertTriangle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import {
  GENERATION_PHASES, STAGE_SEQUENCE, cn, generationStatus, parseApiDate, stagePreview,
} from './studioData';
import { SectionLabel } from './ui';

/**
 * Real background-task progress. Stage rows come from the persisted
 * CareerGenerationStage rows; the only percentage shown is derived from those
 * real states (completed stages + the active stage's own progress_percent).
 */
export function GenerationPanel({ package: pkg, onRetry, retrying = false }) {
  if (!pkg) return null;
  const packageStatus = generationStatus(pkg.status);
  const stages = (pkg.stages || []).map((stage) => ({
    ...stage,
    stage_key: String(stage.stage_key || stage.key || '').toLowerCase(),
    status: generationStatus(stage.status || 'QUEUED'),
  }));

  const stageRows = STAGE_SEQUENCE.map(([key, label]) => {
    const source = stages.find((item) => item.stage_key === key);
    return {
      key,
      label: source?.display_name || label,
      status: source?.status || 'QUEUED',
      progress: Number(source?.progress_percent) || 0,
      metadata: source?.metadata || {},
    };
  });

  const explicitActive = stageRows.find((stage) => stage.status === 'PROCESSING');
  const firstQueued = stageRows.find((stage) => stage.status === 'QUEUED');
  const activeStage = explicitActive || (packageStatus === 'PROCESSING' ? firstQueued : null);
  const completedCount = stageRows.filter((stage) => stage.status === 'SUCCESS').length;
  const activeFraction = activeStage ? Math.min(Math.max(activeStage.progress, 5), 100) / 100 : 0;
  const progressPercent = Math.round(((completedCount + activeFraction) / stageRows.length) * 100);
  const activeLabel = activeStage?.label
    || (packageStatus === 'PENDING' ? 'Waiting for the background worker' : 'Starting generation');
  const activeDetail = activeStage
    ? stagePreview(activeStage)
    : (packageStatus === 'PENDING'
      ? 'Your request is queued; you can keep using AfriTech while the agent works.'
      : 'Starting the generation pipeline.');

  const phaseRows = GENERATION_PHASES.map((phase) => {
    const rows = phase.keys.map((key) => stageRows.find((stage) => stage.key === key)).filter(Boolean);
    const status = rows.some((stage) => stage.status === 'FAILED') ? 'FAILED'
      : rows.some((stage) => stage.status === 'PROCESSING') ? 'PROCESSING'
        : rows.length > 0 && rows.every((stage) => stage.status === 'SUCCESS') ? 'SUCCESS'
          : 'QUEUED';
    return { ...phase, status };
  });

  const requestedAt = parseApiDate(pkg.requested_at);
  const elapsedMinutes = requestedAt ? Math.max(0, Math.round((Date.now() - requestedAt.getTime()) / 60000)) : 0;

  return (
    <section className="cs-generation" aria-labelledby="generation-title">
      <div className="cs-generation-head">
        <span className="cs-generation-mark"><Loader2 size={18} className="cs-spin" /></span>
        <div>
          <SectionLabel>Background task</SectionLabel>
          <h2 id="generation-title">
            {packageStatus === 'FAILED' ? 'Generation stopped' : 'Preparing your documents'}
          </h2>
          <p className="cs-generation-active">
            {packageStatus === 'FAILED'
              ? (pkg.error_message || 'The pipeline stopped before your documents were ready.')
              : <>Working on: <strong>{activeLabel}</strong></>}
          </p>
          {packageStatus !== 'FAILED' && <p className="cs-generation-detail">{activeDetail}</p>}
          {packageStatus !== 'FAILED' && elapsedMinutes >= 2 && (
            <span className="cs-generation-elapsed">Running for {elapsedMinutes} min · you can leave this page, progress is saved</span>
          )}
        </div>
        <div className="cs-generation-count">
          <strong>{progressPercent}%</strong>
          <span>{completedCount} of {stageRows.length} steps complete</span>
        </div>
      </div>

      <div className="cs-generation-bar" aria-label={`${progressPercent}% generation progress`}>
        <span style={{ width: `${Math.max(progressPercent, completedCount ? progressPercent : 3)}%` }} />
      </div>

      <div className="cs-phase-list">
        {phaseRows.map((phase) => (
          <div key={phase.label} className={cn('cs-phase', `cs-phase--${phase.status.toLowerCase()}`)}>
            {phase.status === 'SUCCESS' ? <CheckCircle2 size={15} />
              : phase.status === 'PROCESSING' ? <Loader2 size={15} className="cs-spin" />
                : phase.status === 'FAILED' ? <AlertTriangle size={15} />
                  : <Circle size={11} />}
            <span>{phase.label}</span>
          </div>
        ))}
      </div>

      {packageStatus === 'FAILED' && (
        <div className="cs-error">
          <AlertTriangle size={16} />
          <span>{pkg.error_message || 'Could not prepare your CV. Your profile information is still safe.'}</span>
          {onRetry && (
            <button type="button" className="cs-btn cs-btn--quiet" disabled={retrying} onClick={onRetry}>
              {retrying ? <Loader2 className="cs-spin" size={14} /> : <CheckCircle2 size={14} />}
              {retrying ? 'Retrying…' : 'Retry generation'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default GenerationPanel;
