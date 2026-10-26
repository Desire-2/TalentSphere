import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Clock3, Download,
  FileDown, FileText, History, Loader2, MoreHorizontal, PencilLine, Plus,
  RefreshCw, RotateCcw, Save, Search, Settings2, Target, Trash2, Upload,
  X, ZoomIn, ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiService from '../../services/api';
import { careerAgentService } from '../../services/careerAgentService';
import './CareerAgent.css';

const TEMPLATE_OPTIONS = [
  { key: 'modern_professional', label: 'Modern', hint: 'Balanced, recruiter-friendly' },
  { key: 'ats_safe', label: 'ATS Professional', hint: 'Clean parsing and predictable reading order' },
  { key: 'executive', label: 'Executive', hint: 'Leadership presence' },
  { key: 'graduate', label: 'Graduate', hint: 'Education-forward structure' },
  { key: 'technical', label: 'Technical', hint: 'Skills and project emphasis' },
  { key: 'ngo_development', label: 'Development', hint: 'Program and field impact' },
  { key: 'academic_research', label: 'Academic', hint: 'Research and publications first' },
  { key: 'minimal', label: 'Minimal', hint: 'Quiet, typography-led' },
];

const ACCENT_OPTIONS = [
  ['Ink', '#17212b'], ['Slate', '#425466'], ['Teal', '#0f766e'],
  ['Blue', '#2563a6'], ['Burgundy', '#8a3346'], ['Forest', '#37624a'],
];

const GENERATION_STAGES = [
  ['profile_intelligence', 'Reading your profile'], ['job_analysis', 'Reviewing the opportunity'],
  ['candidate_matching', 'Finding relevant evidence'], ['cv_strategy', 'Selecting a document strategy'],
  ['cv_content', 'Writing your CV'], ['cover_letter', 'Preparing the cover letter'],
  ['humanization', 'Refining the writing'], ['ats_validation', 'Checking recruiter readability'],
  ['final_qa', 'Running a final quality check'], ['document_rendering', 'Preparing your documents'],
];

const GENERATION_PHASES = [
  { label: 'Profile', keys: ['profile_intelligence'] },
  { label: 'Role match', keys: ['job_analysis', 'candidate_matching', 'cv_strategy'] },
  { label: 'Documents', keys: ['cv_content', 'cover_letter'] },
  { label: 'Final review', keys: ['humanization', 'ats_validation', 'final_qa', 'document_rendering'] },
];

const AI_ACTIONS = [
  ['improve', 'Improve wording'], ['concise', 'Make concise'], ['natural', 'Make more natural'],
  ['achievement', 'Strengthen impact'], ['tailor', 'Tailor to this job'],
];

function useIdempotencyKey() {
  const ref = useRef(null);
  return useCallback((reset = false) => { if (reset || !ref.current) ref.current = `pkg-${crypto.randomUUID()}`; return ref.current; }, []);
}

const cn = (...values) => values.filter(Boolean).join(' ');
const formatDate = (value) => value ? new Date(value).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const generationStatus = (value) => String(value || '').toUpperCase();

// Relative time for the memory status line: readiness is loaded once, so a
// plain "2 minutes ago" reads better than an absolute timestamp here.
const relativeTime = (value) => {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'moments ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// Provenance keys come from the backend evidence `source_type` column.
const PROVENANCE_KINDS = [
  { key: 'profile', label: 'Profile', hint: 'From your profile sections' },
  { key: 'import', label: 'Imported', hint: 'From an imported document' },
  { key: 'user_confirmation', label: 'Confirmed', hint: 'Confirmed by you' },
];

const summarizeProvenance = (evidenceSources) => {
  const counts = {};
  let total = 0;
  for (const item of evidenceSources || []) {
    const key = item?.provenance?.source || 'profile';
    counts[key] = (counts[key] || 0) + 1;
    total += 1;
  }
  return { counts, total };
};
const WORKSPACE_CACHE_KEY = 'career-agent-workspace-v1';
const WORKSPACE_CACHE_TTL_MS = 90 * 1000;
const cachedWorkspace = (suffix) => {
  try {
    const raw = sessionStorage.getItem(`${WORKSPACE_CACHE_KEY}:${suffix}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return entry && Date.now() - entry.savedAt <= WORKSPACE_CACHE_TTL_MS ? entry.data : null;
  } catch {
    return null;
  }
};
const storeCachedWorkspace = (suffix, data) => {
  try {
    const entry = JSON.stringify({ savedAt: Date.now(), data });
    // Keep only small enough entries; document bodies are re-fetched on demand.
    if (entry.length <= 400 * 1024) sessionStorage.setItem(`${WORKSPACE_CACHE_KEY}:${suffix}`, entry);
  } catch {
    // Cache is best-effort; failures must never block the workspace.
  }
};
const stripBodies = (pkg) => pkg ? {
  ...pkg,
  documents: (pkg.documents || []).map((doc) => ({
    ...doc,
    working_content_json: undefined,
    working_settings_json: undefined,
  })),
  target_job: pkg.target_job ? { ...pkg.target_job, description: undefined, source_snapshot_json: undefined } : undefined,
} : pkg;
const stagePreview = (stage) => {
  const meta = stage?.metadata || {};
  const key = String(stage?.stage_key || '').toLowerCase();
  switch (key) {
    case 'profile_intelligence': {
      const count = meta.evidence_count;
      const read = count
        ? `Read ${count} evidence source${count === 1 ? '' : 's'} from your profile.`
        : 'Reading your profile and gathering evidence.';
      const missing = meta.missing_information?.length
        ? ` ${meta.missing_information.length} area${meta.missing_information.length === 1 ? '' : 's'} still worth adding.`
        : '';
      const version = meta.memory_profile_version;
      const memory = version == null ? '' : meta.memory_stale
        ? ` Profile memory v${version} was rebuilt for this run.`
        : ` Profile memory v${version} was already current.`;
      return read + memory + missing;
    }
    case 'job_analysis':
      return meta.requirements ? `Extracted ${meta.requirements} requirement${meta.requirements === 1 ? '' : 's'} from the role.` : 'Analyzing the job posting.';
    case 'candidate_matching':
      return meta.overall_match != null ? `Scored the match at ${Math.round(meta.overall_match)}% overall.` : 'Matching your experience to the role.';
    case 'cv_strategy':
      return meta.template ? `Selected the ${String(meta.template).replace(/_/g, ' ')} template with a ${meta.structure || 'balanced'} structure.` : 'Planning the document strategy.';
    case 'cv_content':
      return meta.sections ? `Drafted ${meta.sections} CV section${meta.sections === 1 ? '' : 's'} from your evidence.` : 'Writing your CV.';
    case 'cover_letter':
      return 'Writing a focused cover letter from your strongest evidence.';
    case 'humanization': {
      const changes = Number(meta.cv_changes || 0) + Number(meta.letter_changes || 0);
      return changes ? `Refined ${changes} passage${changes === 1 ? '' : 's'} for a natural tone.` : 'Reviewing and polishing the wording.';
    }
    case 'ats_validation':
      return meta.ats_readiness != null ? `ATS readiness is ${Math.round(meta.ats_readiness)}/100.` : 'Checking recruiter readability.';
    case 'final_qa':
      return meta.checks ? `Completed ${meta.checks} final quality check${meta.checks === 1 ? '' : 's'}.` : 'Running the final quality check.';
    case 'document_rendering':
      return meta.documents?.length ? `Preparing ${meta.documents.join(' and ')} for editing.` : 'Preparing your documents.';
    default:
      return 'Working on this step in the background.';
  }
};
const getLocation = (job) => job?.location?.is_remote || job?.location?.type === 'remote' ? 'Remote' : job?.location?.display || [job?.location?.city, job?.location?.state].filter(Boolean).join(', ') || job?.location || '';
const getEmployer = (job) => job?.company?.name || job?.company_name || job?.employer || job?.employer_name || '';
const normalizeJob = (job, fallbackTitle = '') => {
  if (!job && !fallbackTitle) return null;
  const hasPlatformReference = Object.prototype.hasOwnProperty.call(job || {}, 'platform_job_id');
  const platformJobId = job?.platform_job_id ?? job?.job_id ?? (
    !hasPlatformReference && (
      job?.source_type === 'platform' ||
      (!job?.source_type && (job?.company || job?.company_name || job?.location || job?.employment_type))
    ) ? job?.id : null
  );
  return { ...job, platform_job_id: platformJobId || null, title: job?.title || fallbackTitle || 'Selected opportunity', employer: getEmployer(job) || 'AfriTech Opportunities', location: getLocation(job) || 'Location not specified' };
};

function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" aria-label={label} title={label} className={cn('ca-icon-button', className)} {...props}>{children}</button>;
}

function SectionLabel({ children }) { return <span className="ca-section-label">{children}</span>; }

function ScoreDial({ value, size = 80, label = '' }) {
  const score = Math.max(0, Math.min(100, Math.round(value || 0)));
  const stroke = size > 110 ? 7 : 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="ca-score-dial" style={{ '--dial-size': `${size}px` }} role="img" aria-label={`${score} percent ${label || 'fit'}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ca-dial-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="ca-dial-arc"
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ca-dial-value">
        <strong>{score}<i>%</i></strong>
        {label ? <small>{label}</small> : null}
      </span>
    </div>
  );
}

function TargetOpportunity({ job, onChange, onBrowse, hasActivePackage }) {
  return (
    <section className={cn('ca-target-card', !job && 'ca-target-card--empty')} aria-labelledby="target-job-title">
      <div className="ca-target-copy">
        <SectionLabel>Target opportunity</SectionLabel>
        <h2 id="target-job-title">{job?.title || 'No target job selected'}</h2>
        {job ? (
          <>
            <div className="ca-target-meta">
              <span><BriefcaseBusiness size={15} /> {job.employer}</span>
              <span><Target size={15} /> {job.location}</span>
              {job.platform_job_id && <span className="ca-target-source">Selected from AfriTech Opportunities</span>}
            </div>
            <p>Your documents and match insight stay tied to this role.</p>
          </>
        ) : (
          <p>Choose an AfriTech opportunity and your documents will be tailored to the role.</p>
        )}
      </div>
      <div className="ca-target-actions">
        {job ? (
          <>
            <Button className="ca-button ca-button--quiet" variant="outline" onClick={onChange}>Change opportunity</Button>
            <Button className="ca-button ca-button--primary" onClick={onBrowse}>
              {hasActivePackage ? 'Create for another role' : 'Review opportunity'} <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button className="ca-button ca-button--primary" onClick={onBrowse}>Browse opportunities <ArrowRight size={16} /></Button>
            <Button className="ca-button ca-button--quiet" variant="outline" onClick={onChange}>Paste a job description</Button>
          </>
        )}
      </div>
    </section>
  );
}

function MemoryStatus({ memory }) {
  if (!memory) {
    return (
      <span className="ca-memory ca-memory--idle">
        <span className="ca-memory-dot" aria-hidden="true" />
        <span>Profile memory not built yet</span>
      </span>
    );
  }
  const failed = Boolean(memory.sync_error) || memory.persisted === false;
  const state = failed ? 'issue' : memory.stale ? 'stale' : 'synced';
  const label = state === 'issue'
    ? 'Profile memory not saved'
    : state === 'stale'
      ? 'Profile memory refreshing'
      : `Profile memory synced ${relativeTime(memory.last_synced_at) || 'just now'}`;
  return (
    <span
      className={cn('ca-memory', `ca-memory--${state}`)}
      title={memory.sync_error || (memory.profile_version != null ? `Memory version ${memory.profile_version}` : undefined)}
    >
      <span className="ca-memory-dot" aria-hidden="true" />
      <span>{label}</span>
      {memory.profile_version != null && <em>v{memory.profile_version}</em>}
    </span>
  );
}

function ProvenanceBreakdown({ evidenceSources }) {
  const { counts, total } = summarizeProvenance(evidenceSources);
  const present = PROVENANCE_KINDS.filter((kind) => counts[kind.key]);
  if (!total) return null;
  return (
    <div className="ca-provenance">
      <SectionLabel>Where the facts come from</SectionLabel>
      <div className="ca-provenance-bar" aria-hidden="true">
        {present.map((kind) => (
          <span
            key={kind.key}
            className={cn('ca-provenance-seg', `ca-provenance-seg--${kind.key}`)}
            style={{ width: `${(counts[kind.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="ca-provenance-legend">
        {present.map((kind) => (
          <li key={kind.key} className={cn('ca-provenance-item', `ca-provenance-seg--${kind.key}`)}>
            <span className="ca-provenance-dot" aria-hidden="true" />
            <span className="ca-provenance-name">{kind.label}</span>
            <strong>{counts[kind.key]}</strong>
            <small>{kind.hint}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusStrip({ readiness, usage }) {
  const memory = readiness?.memory;
  const evidence = summarizeProvenance(readiness?.candidate?.evidence_sources);
  const remaining = usage?.free_package?.remaining;
  const entitlement = remaining == null
    ? 'Checking your package allowance'
    : remaining > 0
      ? `${remaining} package${remaining === 1 ? '' : 's'} remaining`
      : 'Saved documents stay free';
  return (
    <div className="ca-status-strip">
      {readiness ? (
        <MemoryStatus memory={memory} />
      ) : (
        <span className="ca-memory ca-memory--idle">
          <span className="ca-memory-dot" aria-hidden="true" />
          <span>Waiting for your profile</span>
        </span>
      )}
      <span className="ca-strip-spacer" />
      {readiness && (
        <span className="ca-strip-fact">
          <strong>{evidence.total}</strong> evidence {evidence.total === 1 ? 'fact' : 'facts'}
        </span>
      )}
      {readiness && <span className="ca-strip-separator" aria-hidden="true" />}
      <span className="ca-entitlement">
        <span className="ca-entitlement-dot" aria-hidden="true" /> {entitlement}
      </span>
    </div>
  );
}

function ProfileReadiness({ readiness, onProfile, onImport, onDeleteEvidence, evidenceBusy }) {
  const checks = readiness?.checks || [];
  const percent = readiness?.readiness_percent ?? Math.round((checks.filter((check) => check.complete).length / (checks.length || 5)) * 100);
  const evidenceSources = readiness?.candidate?.evidence_sources || [];
  const importedEvidence = evidenceSources.filter((item) => String(item.source || '').startsWith('Confirmed import'));
  const missing = readiness?.missing_information || [];
  return (
    <section className="ca-panel" aria-labelledby="readiness-title">
      <div className="ca-panel-heading">
        <div>
          <SectionLabel>Profile evidence</SectionLabel>
          <h2 id="readiness-title">What the agent can work with</h2>
        </div>
        <strong className="ca-readiness-value">{percent}<i>%</i></strong>
      </div>
      <div className="ca-progress" aria-label={`${percent}% profile readiness`}>
        <span style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <ul className="ca-check-list">
        {checks.map((check) => (
          <li key={check.key} className={cn('ca-check-row', !check.complete && 'ca-check-row--attention')}>
            {check.complete ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
            <span>{check.label}</span>
            {!check.complete && <small>Add</small>}
          </li>
        ))}
      </ul>
      <ProvenanceBreakdown evidenceSources={evidenceSources} />
      {missing.length > 0 && (
        <p className="ca-inline-note ca-inline-note--missing">
          <AlertTriangle size={15} />
          <span>Still needed: {missing.join(', ')}</span>
        </p>
      )}
      {importedEvidence.length > 0 && (
        <div className="ca-imported-evidence">
          <SectionLabel>Imported evidence</SectionLabel>
          {importedEvidence.map((item) => (
            <div key={item.evidence_id}>
              <span>{String(item.category || 'evidence').replace(/_/g, ' ')}</span>
              <IconButton label="Remove imported evidence" disabled={evidenceBusy} onClick={() => onDeleteEvidence(item.evidence_id)}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      {readiness?.recommendations?.[0] && (
        <p className="ca-inline-note"><AlertTriangle size={15} /> <span>{readiness.recommendations[0]}</span></p>
      )}
      <div className="ca-panel-actions">
        <Button className="ca-button ca-button--quiet" variant="outline" onClick={onProfile}>Review profile</Button>
        <Button className="ca-button ca-button--text" variant="ghost" onClick={onImport}><Upload size={15} /> Import CV</Button>
      </div>
    </section>
  );
}

function JobFitCard({ analysis, quality, onEdit }) {
  const score = Math.round(analysis?.scores?.overall || 0);
  const matched = analysis?.matched?.skills || [];
  const missing = analysis?.missing?.skills || analysis?.missing?.requirements || [];
  return <section className="ca-panel" aria-labelledby="fit-title"><div className="ca-panel-heading"><div><SectionLabel>Recruiter view</SectionLabel><h2 id="fit-title">Job fit</h2></div><div className="ca-fit-score"><ScoreDial value={score} size={82} label="fit" /></div></div><p className="ca-fit-summary">{score >= 75 ? 'Strong evidence for this role.' : score >= 50 ? 'A workable match with a few areas to strengthen.' : 'Review the gaps before you submit.'}</p><div className="ca-fit-block"><span className="ca-fit-label ca-fit-label--strong">Strongest evidence</span><div className="ca-evidence-list">{(matched.length ? matched : ['Skills evidence', 'Relevant experience', 'Education']).slice(0, 4).map((item) => <span key={typeof item === 'string' ? item : item.name} className="ca-evidence-chip"><Check size={13} /> {typeof item === 'string' ? item : item.name || item.label}</span>)}</div></div>{missing.length > 0 && <div className="ca-fit-block"><span className="ca-fit-label ca-fit-label--gap">Needs attention</span><ul className="ca-gap-list">{missing.slice(0, 3).map((item) => <li key={typeof item === 'string' ? item : item.name}>{typeof item === 'string' ? item : item.name || item.label}</li>)}</ul></div>}{quality?.warnings?.[0] && <p className="ca-inline-note"><AlertTriangle size={15} /> {quality.warnings[0]}</p>}<Button className="ca-button ca-button--text" variant="ghost" onClick={onEdit}>View full match analysis <ArrowRight size={15} /></Button></section>;
}

function DocumentStatusCard({ type, document: doc, matchScore, onOpen, onExport, opening = false, busy = false, exporting = false }) {
  const isCv = type === 'CV';
  return <article className="ca-document-card"><div className="ca-document-card-top"><div className={cn('ca-document-icon', isCv ? 'ca-document-icon--teal' : 'ca-document-icon--rust')}><FileText size={19} /></div><div className="ca-document-type"><span>{isCv ? 'CV' : 'Cover letter'}</span><strong>{doc?.title || (isCv ? 'Your CV' : 'Your cover letter')}</strong></div><span className="ca-status-dot"><CheckCircle2 size={15} /> Ready</span></div><p>{isCv ? 'Your experience, skills and education for this opportunity.' : 'A focused letter that connects your evidence to the role.'}</p><div className="ca-document-card-actions"><Button className="ca-button ca-button--primary" disabled={busy || exporting} onClick={onOpen}>{opening ? <Loader2 className="ca-spin" size={15} /> : <PencilLine size={15} />} {opening ? 'Opening…' : `Edit ${isCv ? 'CV' : 'letter'}`}</Button><button type="button" className="ca-small-action" disabled={busy || exporting} onClick={() => onExport(doc?.id, 'pdf')}>{exporting ? <Loader2 className="ca-spin" size={14} /> : <Download size={14} />} {exporting ? 'PDF…' : 'PDF'}</button>{matchScore != null && isCv && <span className="ca-document-match">{matchScore}% fit</span>}</div></article>;
}

function ApplicationPackage({ package: pkg, cv, letter, openingDocId, exporting, onOpen, onExport, onStartNew, onMatch }) {
  const score = Math.round(pkg?.match_analysis?.scores?.overall || 0);
  return <section className="ca-panel ca-package-panel"><div className="ca-package-heading"><div><SectionLabel>Application package</SectionLabel><h2>Ready to review</h2><p>{pkg?.target_job?.title || 'Targeted application'}{pkg?.target_job?.employer ? ` · ${pkg.target_job.employer}` : ''}</p></div><div className="ca-package-score"><span>Job fit</span><ScoreDial value={score} size={62} /></div></div><div className="ca-documents-grid"><DocumentStatusCard type="CV" document={cv} matchScore={score} opening={openingDocId === cv?.id} busy={Boolean(openingDocId)} exporting={Boolean(exporting)} onOpen={() => onOpen(cv?.id)} onExport={onExport} /><DocumentStatusCard type="COVER_LETTER" document={letter} opening={openingDocId === letter?.id} busy={Boolean(openingDocId)} exporting={Boolean(exporting)} onOpen={() => onOpen(letter?.id)} onExport={onExport} /></div><div className="ca-package-footer"><Button className="ca-button ca-button--text" variant="ghost" onClick={onMatch}>View match insight <ArrowRight size={15} /></Button><Button className="ca-button ca-button--quiet" variant="outline" onClick={onStartNew}><Plus size={15} /> New application package</Button></div></section>;
}

function ImportPanel({ onImported, onClose }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(null); const [selected, setSelected] = useState({});
  const upload = async () => { if (!file) return; setBusy(true); setError(null); try { const data = await careerAgentService.importDocument(file); setResult(data); setSelected(Object.fromEntries(Object.keys(data.extracted_data || {}).map((key) => [key, true]))); } catch (e) { setError(e.message || 'We could not read this document.'); } finally { setBusy(false); } };
  const confirm = async () => { setBusy(true); setError(null); try { await careerAgentService.confirmImport(result.id, Object.keys(selected).filter((key) => selected[key])); onImported?.(); } catch (e) { setError(e.message || 'We could not save the imported information.'); } finally { setBusy(false); } };
  return <div className="ca-drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}><aside className="ca-drawer" role="dialog" aria-modal="true" aria-labelledby="import-title"><div className="ca-drawer-header"><div><SectionLabel>Profile evidence</SectionLabel><h2 id="import-title">Import an existing CV</h2></div><IconButton label="Close import panel" disabled={busy} onClick={onClose}><X size={18} /></IconButton></div><p className="ca-drawer-intro">Bring in a CV you already trust. Review extracted sections before anything is added to your career profile.</p><div className="ca-upload-zone"><Upload size={23} /><strong>{file ? file.name : 'Choose a document to import'}</strong><span>PDF, DOCX, TXT, RTF, ODT, Markdown or image · up to 10 MB</span><label className="ca-button ca-button--quiet ca-file-label">Choose file<input type="file" accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.md,.markdown,.png,.jpg,.jpeg,.webp" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></div>{!result && <Button className="ca-button ca-button--primary ca-full-button" disabled={!file || busy} onClick={upload}>{busy ? <Loader2 className="ca-spin" size={16} /> : <Upload size={16} />} {busy ? 'Reading document…' : 'Upload and extract'}</Button>}{error && <div className="ca-error"><AlertTriangle size={16} /> {error}</div>}{result && <div className="ca-import-review"><div className="ca-review-heading"><CheckCircle2 size={18} /><div><strong>Review extracted information</strong><span>Your profile is not overwritten.</span></div></div>{(result.conflicts || []).map((conflict, index) => <div key={index} className="ca-conflict"><AlertTriangle size={15} /><span>Potential inconsistency for <strong>{conflict.label}</strong>. Both will remain separate evidence.</span></div>)}<div className="ca-import-fields">{Object.entries(result.extracted_data || {}).filter(([, value]) => Array.isArray(value) ? value.length : value && Object.keys(value).length).map(([key, value]) => <label key={key} className="ca-import-field"><input type="checkbox" checked={!!selected[key]} onChange={(event) => setSelected((prev) => ({ ...prev, [key]: event.target.checked }))} /><span><strong>{key.replace(/_/g, ' ')}</strong><small>{Array.isArray(value) ? `${value.length} item(s)` : 'contact details'}</small></span></label>)}</div><div className="ca-drawer-actions"><Button className="ca-button ca-button--primary" disabled={busy} onClick={confirm}>{busy ? <Loader2 className="ca-spin" size={15} /> : <Check size={15} />} Confirm selected sections</Button><Button className="ca-button ca-button--quiet" variant="outline" disabled={busy} onClick={() => setResult(null)}>Review another file</Button></div></div>}<p className="ca-drawer-footnote">Imported information is stored as private career evidence and can be removed from your account later.</p></aside></div>;
}

function Paywall({ reason }) {
  const [plans, setPlans] = useState([]); const [busyPlan, setBusyPlan] = useState(null); const [error, setError] = useState(null);
  useEffect(() => { careerAgentService.getSubscription().then((data) => setPlans(data.plans || [])).catch(() => setError('Plans are unavailable right now.')); }, []);
  const subscribe = async (planCode) => { setBusyPlan(planCode); setError(null); try { const checkout = await careerAgentService.startCheckout(planCode); if (checkout.provider_reference) sessionStorage.setItem('career-agent-payment-reference', checkout.provider_reference); if (checkout.checkout_url) window.location.href = checkout.checkout_url; else if (checkout.transaction?.status !== 'COMPLETED') setError('Your checkout is already pending. Complete it with the payment provider.'); } catch (e) { setError(e.message || 'Could not start checkout.'); } finally { setBusyPlan(null); } };
  return <section className="ca-paywall"><div className="ca-paywall-copy"><SectionLabel>More applications</SectionLabel><h2>Ready for another tailored package?</h2><p>{reason || 'Your saved documents stay editable and exportable. Choose a plan when you want to prepare another role-specific package.'}</p></div><div className="ca-free-paid"><span><CheckCircle2 size={15} /> Edit saved documents <strong>Free</strong></span><span><Target size={15} /> New package <strong>Plan required</strong></span></div><div className="ca-plan-grid">{plans.filter((plan) => !plan.is_free).map((plan) => <article key={plan.code} className="ca-plan"><span>{plan.name}</span><strong>{Number(plan.price_rwf).toLocaleString()} <small>RWF</small></strong><p>{plan.description}</p><Button className="ca-button ca-button--primary" disabled={Boolean(busyPlan)} onClick={() => subscribe(plan.code)}>{busyPlan === plan.code ? <Loader2 className="ca-spin" size={15} /> : 'Choose plan'}</Button></article>)}</div>{error && <div className="ca-error"><AlertTriangle size={16} /> {error}</div>}<p className="ca-paywall-footnote">Payment is verified server-side before a new package is unlocked.</p></section>;
}

function GeneratorPanel({ jobId, jobTitle, targetJob, activePackage, targetChoice, setTargetChoice, pastedJob, setPastedJob, canGenerate, generationSubmitting, onGenerate, onClose }) {
  return <section className="ca-generator-panel"><div className="ca-generator-heading"><div><SectionLabel>New application</SectionLabel><h2>Choose your starting point</h2><p>Use a platform opportunity, paste a role, or create a general CV.</p></div>{activePackage && <IconButton label="Close new application" onClick={onClose}><X size={17} /></IconButton>}</div><div className="ca-generator-grid"><div className="ca-target-options"><button type="button" className={cn('ca-target-option', targetChoice === 'platform' && 'ca-target-option--active')} disabled={!jobId} onClick={() => setTargetChoice('platform')}><span className="ca-option-index">01</span><span><strong>{jobId ? 'Use this AfriTech opportunity' : 'Choose an AfriTech opportunity'}</strong><small>{jobId ? targetJob?.title || jobTitle : 'Open a job first to connect it to this application.'}</small></span><ChevronRight size={16} /></button><button type="button" className={cn('ca-target-option', targetChoice === 'pasted' && 'ca-target-option--active')} onClick={() => setTargetChoice('pasted')}><span className="ca-option-index">02</span><span><strong>Paste a job description</strong><small>Use a role you found elsewhere.</small></span><ChevronRight size={16} /></button><button type="button" className={cn('ca-target-option', targetChoice === 'general' && 'ca-target-option--active')} onClick={() => setTargetChoice('general')}><span className="ca-option-index">03</span><span><strong>Create a general CV</strong><small>A solid starting point without a target role.</small></span><ChevronRight size={16} /></button></div>{targetChoice === 'pasted' && <div className="ca-pasted-job"><label>Role title<input value={pastedJob.title} onChange={(event) => setPastedJob((previous) => ({ ...previous, title: event.target.value }))} placeholder="e.g. Backend Engineer" /></label><label>Employer <span className="ca-field-caption">Optional</span><input value={pastedJob.employer} onChange={(event) => setPastedJob((previous) => ({ ...previous, employer: event.target.value }))} placeholder="Company name" /></label><label>Job description <span className="ca-field-caption">Optional, but useful for a closer match</span><textarea value={pastedJob.description} onChange={(event) => setPastedJob((previous) => ({ ...previous, description: event.target.value }))} rows={5} placeholder="Paste the role details here…" /></label></div>}{targetChoice !== 'pasted' && <div className="ca-generator-note"><Target size={18} /><div><strong>Written only from evidence you can check.</strong><span>Your chosen role stays attached to the package, and every fact comes from your profile or a document you confirmed — never from a guess.</span></div></div>}</div><div className="ca-generator-footer"><span>{canGenerate === false ? 'Choose a plan above to create another package.' : 'Editing and exporting saved documents never uses another generation.'}</span><Button className="ca-button ca-button--primary" disabled={generationSubmitting || !targetChoice || (targetChoice === 'pasted' && !pastedJob.title.trim()) || canGenerate === false} onClick={onGenerate}>{generationSubmitting ? 'Preparing…' : 'Prepare my application'} <ArrowRight size={16} /></Button></div></section>;
}

function WorkspaceLoading() {
  return <main className="ca-loading-screen" role="status" aria-live="polite">
    <div className="ca-loading-card">
      <div className="ca-loading-mark" aria-hidden="true"><span className="ca-spinner" /></div>
      <div>
        <span className="ca-eyebrow">Career documents</span>
        <h1>Loading your workspace</h1>
        <p>Getting your profile, saved documents and usage details.</p>
      </div>
      <div className="ca-loading-lines" aria-hidden="true"><span /><span /><span /></div>
    </div>
  </main>;
}

function GenerationProgress({ package: pkg, onCompleted, onError }) {
  const [current, setCurrent] = useState(pkg);
  const [timedOut, setTimedOut] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const pollStartedAtRef = useRef(Date.now());
  const failedPackageIdRef = useRef(null);

  const checkCurrentStatus = async () => {
    if (!current?.id || checkingStatus) return;
    setCheckingStatus(true);
    try {
      const next = await careerAgentService.getGeneration(current.id);
      const nextStatus = generationStatus(next?.status);
      pollStartedAtRef.current = Date.now();
      if (nextStatus === 'COMPLETED') {
        onCompleted?.(next);
        return;
      }
      if (nextStatus === 'FAILED') {
        if (failedPackageIdRef.current !== next.id) {
          failedPackageIdRef.current = next.id;
          onError?.(next);
        }
        setTimedOut(true);
        return;
      }
      if (failedPackageIdRef.current === next?.id) failedPackageIdRef.current = null;
      setCurrent(next);
      setTimedOut(false);
    } catch {
      setTimedOut(true);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const initialStatus = generationStatus(pkg?.status);
    setCurrent((previous) => (previous?.id === pkg?.id ? previous : pkg));
    setTimedOut(false);
    pollStartedAtRef.current = Date.now();
    if (!pkg || initialStatus === 'COMPLETED') {
      onCompleted?.(pkg);
      return undefined;
    }
    if (initialStatus === 'FAILED') {
      if (failedPackageIdRef.current !== pkg.id) {
        failedPackageIdRef.current = pkg.id;
        onError?.(pkg);
      }
    }

    let cancelled = false;
    let finished = false;
    let polling = false;
    let attempt = 0;
    let timer;
    const poll = async () => {
      if (cancelled || polling || finished) return;
      polling = true;
      if (Date.now() - pollStartedAtRef.current > 3 * 60 * 1000) setTimedOut(true);
      try {
        const next = await careerAgentService.getGeneration(pkg.id);
        attempt = 0;
        if (cancelled) return;
        const nextStatus = generationStatus(next?.status);
        if (nextStatus === 'COMPLETED') {
          finished = true;
          onCompleted?.(next);
          return;
        }
        if (nextStatus === 'FAILED') {
          if (failedPackageIdRef.current !== next.id) {
            failedPackageIdRef.current = next.id;
            onError?.(next);
          }
          attempt = Math.max(attempt, 2);
          setTimedOut(true);
          return;
        }
        if (failedPackageIdRef.current === next.id) failedPackageIdRef.current = null;
        attempt = 0;
        setCurrent(next);
        setTimedOut(false);
      } catch (error) {
        if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          finished = true;
          setTimedOut(true);
        } else {
          attempt += 1;
        }
      } finally {
        polling = false;
        if (!cancelled && !finished) {
          // 8s base with jitter keeps the progress panel responsive without
          // hammering the (often remote) database on every status poll.
          const baseDelay = 8000 + Math.floor(Math.random() * 1500);
          const delay = document.visibilityState === 'hidden' ? 24000 : Math.min(baseDelay * 2 ** attempt, 20000);
          timer = setTimeout(poll, delay);
        }
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    timer = setTimeout(poll, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pkg, onCompleted, onError, retryNonce]);

  const stages = (current?.stages || []).map((stage) => ({
    ...stage,
    stage_key: String(stage.stage_key || stage.key || stage.stageKey || '').toLowerCase(),
    status: generationStatus(stage.status || 'QUEUED'),
  }));
  const packageStatus = generationStatus(current?.status || pkg?.status);
  const stageRows = GENERATION_STAGES.map(([key, label]) => {
    const source = stages.find((item) => item.stage_key === key);
    return { key, label: source?.display_name || label, status: source?.status || 'QUEUED', latency: source?.latency_ms, progress: Number(source?.progress_percent) || 0, metadata: source?.metadata || {} };
  });
  const explicitActive = stageRows.find((stage) => stage.status === 'PROCESSING');
  const firstQueued = stageRows.find((stage) => stage.status === 'QUEUED');
  const activeStage = explicitActive || (packageStatus === 'PROCESSING' ? firstQueued : null);
  const completedCount = stageRows.filter((stage) => stage.status === 'SUCCESS').length;
  // The active stage reports its own progress (it commits partial progress
  // mid-stage), so the bar moves while one slow step is running instead of
  // sitting on a flat slice until the whole stage lands.
  const activeFraction = activeStage ? Math.min(Math.max(activeStage.progress || 0, 5), 100) / 100 : 0;
  const progressPercent = Math.round(((completedCount + activeFraction) / stageRows.length) * 100);
  const activeLabel = activeStage?.label || (packageStatus === 'PENDING' ? 'Waiting for the background worker' : 'Starting generation');
  const activeDetail = activeStage ? stagePreview(activeStage) : (packageStatus === 'PENDING' ? 'Your request is queued; you can keep using TalentSphere while the agent works.' : 'Starting the generation pipeline.');

  const phaseRows = GENERATION_PHASES.map((phase) => {
    const phases = phase.keys.map((key) => stageRows.find((stage) => stage.key === key)).filter(Boolean);
    const status = phases.some((stage) => stage.status === 'FAILED') ? 'FAILED'
      : phases.some((stage) => stage.status === 'PROCESSING') ? 'PROCESSING'
        : phases.length > 0 && phases.every((stage) => stage.status === 'SUCCESS') ? 'SUCCESS' : 'QUEUED';
    return { ...phase, status };
  });

  return <section className="ca-generation"><div className="ca-generation-intro"><div className="ca-process-mark"><Loader2 size={20} className="ca-spin" /></div><div><SectionLabel>In progress</SectionLabel><h2>Preparing your application</h2><p>Working on: <strong>{activeLabel}</strong></p><p className="ca-stage-preview">{activeDetail}</p><span className="ca-background-note">You can keep using TalentSphere — we’ll notify you in-app and by email when it’s ready.</span></div></div><div className="ca-generation-summary"><span>{completedCount} of {stageRows.length} checks complete</span><strong>{progressPercent}%</strong></div><div className="ca-generation-progress" aria-label={`${progressPercent}% generation progress`}><span style={{ width: `${progressPercent}%` }} /></div><div className="ca-stage-list">{phaseRows.map((phase) => <div key={phase.label} className={cn('ca-stage-row', `ca-stage-row--${phase.status.toLowerCase()}`)}>{phase.status === 'SUCCESS' ? <CheckCircle2 size={16} /> : phase.status === 'PROCESSING' ? <Loader2 size={16} className="ca-spin" /> : phase.status === 'FAILED' ? <AlertTriangle size={16} /> : <Circle size={13} />}<span>{phase.label}</span></div>)}</div>{current?.error_message && packageStatus === 'PROCESSING' && <div className="ca-notice ca-notice--warning"><AlertTriangle size={16} /> {current.error_message}</div>}{packageStatus === 'FAILED' && <div className="ca-error"><AlertTriangle size={16} /><span>{current.error_message || 'Could not prepare your CV. Your profile information is still safe.'}</span><Button className="ca-button ca-button--quiet" variant="outline" disabled={retrying} onClick={async () => { if (retrying) return; setRetrying(true); try { const next = await careerAgentService.retryGeneration(current.id); failedPackageIdRef.current = null; setCurrent(next); setTimedOut(false); setRetrying(false); setRetryNonce((n) => n + 1); } catch { setRetrying(false); } }}>{retrying ? <Loader2 className="ca-spin" size={14} /> : <RefreshCw size={14} />} {retrying ? 'Retrying…' : 'Try again'}</Button></div>}{timedOut && <div className="ca-notice ca-notice--warning"><Clock3 size={16} /><span>This is taking longer than usual. Your documents are safe.</span><Button className="ca-button ca-button--quiet" variant="outline" disabled={checkingStatus} onClick={checkCurrentStatus}>{checkingStatus ? <Loader2 className="ca-spin" size={14} /> : <RefreshCw size={14} />} {checkingStatus ? 'Checking…' : 'Check current task'}</Button></div>}</section>;
}

function applyReplacement(content, selectedText, replacement) {
  if (!selectedText.trim()) return null;
  return JSON.parse(JSON.stringify(content, (key, value) => typeof value === 'string' && value.trim() === selectedText.trim() ? replacement : value));
}

function DocumentPreview({ document: doc, selectedSectionId }) {
  const [zoom, setZoom] = useState(100); const [page, setPage] = useState(0); const content = doc?.content || {}; const header = content.header || {}; const isCover = doc?.document_type === 'COVER_LETTER'; const pages = useMemo(() => { const sourceSections = content.sections || []; return isCover ? [sourceSections] : Array.from({ length: Math.max(1, Math.ceil(sourceSections.length / 4)) }, (_, index) => sourceSections.slice(index * 4, index * 4 + 4)); }, [content.sections, isCover]); const safePage = Math.min(page, pages.length - 1); const accent = doc?.settings?.accent_color || doc?.accent_color || '#0f766e';
  useEffect(() => { const index = pages.findIndex((items) => items.some((section) => section.id === selectedSectionId)); if (index >= 0) setPage(index); }, [selectedSectionId, pages]);
  return <div className="ca-preview"><div className="ca-preview-toolbar"><div className="ca-preview-controls"><IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(70, value - 10))}><ZoomOut size={16} /></IconButton><button type="button" className="ca-zoom-value" onClick={() => setZoom(100)}>{zoom}%</button><IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(130, value + 10))}><ZoomIn size={16} /></IconButton><button type="button" className="ca-fit-button" onClick={() => setZoom(100)}>Fit</button></div><div className="ca-page-controls"><IconButton label="Previous page" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /></IconButton><span>Page {safePage + 1} / {pages.length}</span><IconButton label="Next page" disabled={safePage >= pages.length - 1} onClick={() => setPage((value) => Math.min(pages.length - 1, value + 1))}><ChevronRight size={16} /></IconButton></div></div><div className="ca-paper-stage"><article className="ca-paper" style={{ '--paper-accent': accent, transform: `scale(${zoom / 100})` }}><div className="ca-paper-inner"><header className="ca-paper-header"><h1>{header.name || 'Your Name'}</h1>{header.professional_title && <p className="ca-paper-role">{header.professional_title}</p>}<p className="ca-paper-contact">{[header.email, header.phone, header.location].filter(Boolean).join(' · ')}{header.links?.length ? ` · ${header.links.join(' · ')}` : ''}</p></header>{isCover ? <CoverLetterPreview content={content} name={header.name} /> : <div className="ca-paper-sections">{content.summary && <section className="ca-paper-section" data-doc-section="summary"><h2 style={{ color: accent }}>Profile</h2><p>{content.summary}</p></section>}{pages[safePage]?.map((section) => <PaperSection key={section.id || section.title} section={section} accent={accent} selected={section.id === selectedSectionId} />)}</div>}</div></article></div></div>;
}

function PaperSection({ section, accent, selected }) {
  return <section className={cn('ca-paper-section', selected && 'ca-paper-section--selected')} data-doc-section={section.id}><h2 style={{ color: accent }}>{section.title}</h2>{(section.entries || []).map((entry, index) => <div key={entry.id || index} className="ca-paper-entry">{(entry.heading || entry.subheading) && <div className="ca-paper-entry-heading"><strong>{entry.heading}</strong><span>{[entry.dates, entry.location].filter(Boolean).join(' · ')}</span></div>}{entry.subheading && <p className="ca-paper-subheading">{entry.subheading}</p>}{entry.text && <p>{entry.text}</p>}{entry.bullets?.length > 0 && <ul>{entry.bullets.map((bullet, bulletIndex) => <li key={bullet.id || bulletIndex}>{bullet.text}</li>)}</ul>}</div>)}</section>;
}

function CoverLetterPreview({ content, name }) {
  return <article className="ca-cover-letter-preview">{[content.recipient?.company, content.recipient?.role, content.recipient?.address].filter(Boolean).map((line) => <div key={line}>{line}</div>)}{content.subject && <p className="ca-letter-subject">Re: {content.subject}</p>}{content.recipient?.salutation && <p>{content.recipient.salutation}</p>}{content.body?.paragraphs?.map((paragraph, index) => <p key={paragraph.id || index}>{paragraph.text}</p>)}<p className="ca-letter-closing">{content.body?.closing || 'Sincerely,'}<br /><strong>{name || 'Your name'}</strong></p></article>;
}

function EditorOutline({ sections, selectedSection, onSelect, onMove, onDelete, onAdd }) {
  return <aside className="ca-outline-rail"><div className="ca-rail-heading"><SectionLabel>Document</SectionLabel><IconButton label="Document options"><MoreHorizontal size={17} /></IconButton></div><nav className="ca-outline-list" aria-label="Document sections">{sections.map((section, index) => <div key={section.id || index} className={cn('ca-outline-item', selectedSection === section.id && 'ca-outline-item--active')}><button type="button" className="ca-outline-select" onClick={() => onSelect(section.id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{section.title || 'Untitled section'}</strong></button><div className="ca-outline-actions"><IconButton label="Move section up" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp size={13} /></IconButton><IconButton label="Move section down" disabled={index === sections.length - 1} onClick={() => onMove(index, 1)}><ChevronDown size={13} /></IconButton><IconButton label="Delete section" onClick={() => onDelete(index)}><Trash2 size={13} /></IconButton></div></div>)}</nav><button type="button" className="ca-add-section" onClick={onAdd}><Plus size={15} /> Add section</button><div className="ca-outline-tip"><span className="ca-drag-handle">⋮⋮</span><span>Reorder sections with the controls. Changes save automatically.</span></div></aside>;
}

function CoverLetterEditor({ content, update, onAssistText }) {
  const patchHeader = (patch) => update((previous) => ({ ...previous, header: { ...previous.header, ...patch } }));
  const setParagraph = (index, text) => update((previous) => ({ ...previous, body: { ...previous.body, paragraphs: (previous.body?.paragraphs || []).map((paragraph, paragraphIndex) => paragraphIndex === index ? { ...paragraph, text } : paragraph) } }));
  return <div className="ca-section-editor"><div className="ca-editor-section-heading"><SectionLabel>Editing letter</SectionLabel><strong className="ca-letter-editor-title">Cover letter</strong></div><div className="ca-field-row"><label>Professional title<input value={content.header?.professional_title || ''} onChange={(event) => patchHeader({ professional_title: event.target.value })} /></label><label>Phone<input value={content.header?.phone || ''} onChange={(event) => patchHeader({ phone: event.target.value })} /></label></div><label className="ca-field-label">Subject<input value={content.subject || ''} onChange={(event) => update((previous) => ({ ...previous, subject: event.target.value }))} placeholder="Application for…" /></label><div className="ca-letter-paragraph-editor">{(content.body?.paragraphs || []).map((paragraph, index) => <label className="ca-field-label" key={paragraph.id || index}>Paragraph {index + 1}<textarea value={paragraph.text || ''} rows={5} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => setParagraph(index, event.target.value)} /></label>)}</div><label className="ca-field-label">Closing<input value={content.body?.closing || ''} onChange={(event) => update((previous) => ({ ...previous, body: { ...previous.body, closing: event.target.value } }))} placeholder="Sincerely," /></label></div>;
}

function SectionEditor({ section, onTitleChange, onEntryChange, onBulletChange, onAddBullet, onRemoveBullet, onAssistText }) {
  if (!section) return <div className="ca-empty-editor"><FileText size={22} /><p>Select a section to edit its content.</p></div>;
  return <div className="ca-section-editor"><div className="ca-editor-section-heading"><SectionLabel>Editing section</SectionLabel><input aria-label="Section title" value={section.title || ''} onChange={(event) => onTitleChange(event.target.value)} /></div>{(section.entries || []).map((entry, entryIndex) => <div key={entry.id || entryIndex} className="ca-entry-editor"><div className="ca-field-row"><label>Heading<input value={entry.heading || ''} onChange={(event) => onEntryChange(entryIndex, { heading: event.target.value })} placeholder="Role, degree or project" /></label><label>Dates<input value={entry.dates || ''} onChange={(event) => onEntryChange(entryIndex, { dates: event.target.value })} placeholder="2024 – Present" /></label></div><div className="ca-field-row"><label>Organization<input value={entry.subheading || ''} onChange={(event) => onEntryChange(entryIndex, { subheading: event.target.value })} placeholder="Company, school or client" /></label><label>Location<input value={entry.location || ''} onChange={(event) => onEntryChange(entryIndex, { location: event.target.value })} placeholder="Kigali, Rwanda" /></label></div>{entry.text !== undefined && <label className="ca-field-label">Summary<textarea value={entry.text || ''} rows={4} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => onEntryChange(entryIndex, { text: event.target.value })} placeholder="Describe the work or learning clearly." /></label>}{entry.bullets?.length > 0 && <div className="ca-bullet-editor"><div className="ca-field-caption">Evidence bullets</div>{entry.bullets.map((bullet, bulletIndex) => <div className="ca-bullet-row" key={bullet.id || bulletIndex}><span>•</span><textarea value={bullet.text || ''} rows={2} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => onBulletChange(entryIndex, bulletIndex, event.target.value)} placeholder="Start with an action and show the result." /><IconButton label="Remove bullet" onClick={() => onRemoveBullet(entryIndex, bulletIndex)}><X size={14} /></IconButton></div>)}<button type="button" className="ca-inline-add" onClick={() => onAddBullet(entryIndex)}><Plus size={14} /> Add bullet</button></div>}</div>)}{!(section.entries || []).length && <div className="ca-empty-section"><p>This section is ready for content.</p><button type="button" className="ca-inline-add" onClick={() => onEntryChange(0, { heading: '', subheading: '', dates: '', text: '', bullets: [] })}><Plus size={14} /> Add an entry</button></div>}</div>;
}

function TemplateSettings({ settings, doc, onChange }) {
  const template = settings.template_key || doc?.template_key || 'modern_professional'; const mode = settings.document_mode || doc?.document_mode || 'ats_safe'; const accent = settings.accent_color || doc?.accent_color || '#0f766e';
  return <div className="ca-settings-panel"><div className="ca-tool-heading"><Settings2 size={17} /><div><strong>Document settings</strong><span>Keep the style professional on screen and in print.</span></div></div><label className="ca-setting-label">Template<select value={template} onChange={(event) => onChange({ template_key: event.target.value })}>{TEMPLATE_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><div className="ca-mode-setting"><span className="ca-field-caption">Document style</span><label className={cn('ca-mode-option', mode === 'ats_safe' && 'ca-mode-option--active')}><input type="radio" name="document-mode" checked={mode === 'ats_safe'} onChange={() => onChange({ document_mode: 'ats_safe' })} /><span><strong>ATS Professional</strong><small>Predictable reading order and recruiter-friendly formatting.</small></span></label><label className={cn('ca-mode-option', mode === 'visual_professional' && 'ca-mode-option--active')}><input type="radio" name="document-mode" checked={mode === 'visual_professional'} onChange={() => onChange({ document_mode: 'visual_professional' })} /><span><strong>Modern Professional</strong><small>More visual hierarchy while staying practical to print.</small></span></label></div><div className="ca-color-setting"><span className="ca-field-caption">Accent color</span><div className="ca-color-options">{ACCENT_OPTIONS.map(([label, value]) => <button type="button" key={value} className={cn('ca-color-swatch', accent === value && 'ca-color-swatch--active')} style={{ backgroundColor: value }} aria-label={label} title={label} onClick={() => onChange({ accent_color: value })}>{accent === value && <Check size={13} />}</button>)}</div></div></div>;
}

function WritingAssistant({ text, setText, busy, result, onRun, onUse }) {
  return <div className="ca-assistant"><div className="ca-tool-heading"><PencilLine size={17} /><div><strong>Writing assistance</strong><span>Practical suggestions, grounded in your evidence.</span></div></div><textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} placeholder="Focus a line or paragraph to improve…" aria-label="Text for writing assistance" /><div className="ca-ai-actions">{AI_ACTIONS.map(([key, label]) => <button type="button" key={key} disabled={busy || !text.trim()} onClick={() => onRun(key)}>{busy && <Loader2 className="ca-spin" size={13} />}{label}</button>)}</div>{result?.error && <div className="ca-error ca-error--compact"><AlertTriangle size={14} /> {result.error}</div>}{result?.alternatives?.map((alternative, index) => <div key={index} className="ca-assist-result"><p>{alternative.text}</p>{alternative.note && <small>{alternative.note}</small>}<Button className="ca-button ca-button--quiet" variant="outline" onClick={() => onUse(alternative.text)}>Use this version</Button></div>)}</div>;
}

function HistoryPanel({ versions, busy, onClose, onRestore }) {
  return <div className="ca-history-panel"><div className="ca-history-heading"><div><SectionLabel>Version history</SectionLabel><h3>Saved moments</h3></div><IconButton label="Close version history" onClick={onClose}><X size={17} /></IconButton></div>{!versions.length && <p className="ca-muted-copy">No manual versions yet. Save a version at a useful milestone.</p>}{versions.map((version) => <div key={version.id || version.version_number} className="ca-version-row"><div><strong>Version {version.version_number}</strong><span>{version.change_source?.toLowerCase() || 'saved'} · {formatDate(version.created_at)}</span></div><Button className="ca-button ca-button--text" variant="ghost" disabled={busy} onClick={() => onRestore(version.version_number)}><RotateCcw size={14} /> Restore</Button></div>)}</div>;
}

function ExportMenu({ onExport, exporting, quality }) {
  const [open, setOpen] = useState(false); const warnings = quality?.warnings || [];
  const factuality = quality?.factual_consistency;
  const checks = [
    ['Source-backed facts', quality?.factual_status === 'VERIFIED' && factuality?.status === 'VERIFIED'],
    ['ATS structure checked', Number.isFinite(Number(quality?.ats_readiness)) && quality?.ats_readiness >= 60],
    ['No layout overflow', Boolean(quality) && !warnings.some((warning) => /overflow|page width|layout/i.test(warning))],
    ['Contact details checked', Array.isArray(quality?.content_quality) && quality.content_quality.some((item) => /contact/i.test(item))],
  ];
  return <div className="ca-export-wrap"><Button className="ca-button ca-button--primary" disabled={Boolean(exporting)} onClick={() => setOpen((value) => !value)}><Download size={15} /> Export <ChevronDown size={14} /></Button>{open && <div className="ca-export-menu"><div className="ca-export-menu-heading"><strong>Export document</strong><span>Quick quality check</span></div><div className="ca-export-checks">{checks.map(([label, okay]) => <span key={label}>{okay ? <Check size={13} /> : <AlertTriangle size={13} />} {label}</span>)}</div>{['pdf', 'docx', 'txt'].map((format) => <button type="button" key={format} disabled={Boolean(exporting)} onClick={() => { setOpen(false); onExport(format); }}>{exporting === format ? <Loader2 className="ca-spin" size={15} /> : <FileDown size={15} />} {format.toUpperCase()}<small>{format === 'pdf' ? 'Share-ready' : format === 'docx' ? 'Editable' : 'Plain text'}</small></button>)}</div>}</div>;
}

function DocumentEditor({ document: doc, package: pkg, onExport, exporting, onBack }) {
  const [content, setContent] = useState(doc.content || {});
  const [settings, setSettings] = useState(doc.settings || {});
  const [selectedSection, setSelectedSection] = useState(doc.content?.sections?.[0]?.id || null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [versions, setVersions] = useState(doc.versions || []);
  const [showHistory, setShowHistory] = useState(false);
  const [assistText, setAssistText] = useState('');
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistResult, setAssistResult] = useState(null);
  const saveTimer = useRef(null);
  const saveVersionRequestRef = useRef(false);
  const restoreVersionRequestRef = useRef(false);
  const settingsRef = useRef(settings);
  const contentRef = useRef(content);
  const pendingSaveRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    setContent(doc.content || {});
    setSettings(doc.settings || {});
    setVersions(doc.versions || []);
    setSelectedSection(doc.content?.sections?.[0]?.id || null);
    setDirty(false);
  }, [doc.id, doc.content, doc.settings, doc.versions]);

  const flushSave = useCallback(async (nextContent = null, nextSettings = null) => {
    clearTimeout(saveTimer.current);
    const payload = nextContent
      ? { content: nextContent, settings: nextSettings || settingsRef.current }
      : pendingSaveRef.current;
    if (!payload) return;
    pendingSaveRef.current = null;
    setSaving(true);
    try {
      await careerAgentService.autosaveDocument(doc.id, payload);
      if (mountedRef.current) setDirty(false);
    } catch (saveError) {
      pendingSaveRef.current = payload;
      if (mountedRef.current) setDirty(true);
      throw saveError;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [doc.id]);

  const queueSave = useCallback((nextContent, nextSettings = settingsRef.current) => {
    pendingSaveRef.current = { content: nextContent, settings: nextSettings };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flushSave().catch(() => {});
    }, 900);
  }, [flushSave]);

  useEffect(() => () => {
    mountedRef.current = false;
    clearTimeout(saveTimer.current);
    const pending = pendingSaveRef.current;
    if (pending) careerAgentService.autosaveDocument(doc.id, pending).catch(() => {});
  }, [doc.id]);

  const update = (updater) => setContent((previous) => {
    const next = typeof updater === 'function' ? updater(previous) : updater;
    setDirty(true);
    queueSave(next);
    return next;
  });
  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setDirty(true);
    queueSave(contentRef.current, next);
  };

  const sectionIndex = (content.sections || []).findIndex((section) => section.id === selectedSection);
  const activeSection = sectionIndex >= 0 ? content.sections[sectionIndex] : content.sections?.[0];
  const moveSection = (index, direction) => update((previous) => {
    const sections = [...(previous.sections || [])];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return previous;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    return { ...previous, sections };
  });
  const removeSection = (index) => {
    const sections = (content.sections || []).filter((_, itemIndex) => itemIndex !== index);
    setSelectedSection(sections[0]?.id || null);
    update((previous) => ({ ...previous, sections }));
  };
  const addSection = () => {
    const id = `sec-${Date.now()}`;
    update((previous) => ({
      ...previous,
      sections: [...(previous.sections || []), {
        id,
        type: 'custom',
        title: 'New section',
        entries: [{ id: `entry-${Date.now()}`, heading: '', subheading: '', dates: '', text: '', bullets: [] }],
      }],
    }));
    setSelectedSection(id);
  };
  const updateSection = (patch) => update((previous) => ({
    ...previous,
    sections: previous.sections.map((section) => section.id === activeSection?.id ? { ...section, ...patch } : section),
  }));
  const updateEntry = (entryIndex, patch) => update((previous) => ({
    ...previous,
    sections: previous.sections.map((section) => section.id !== activeSection?.id ? section : {
      ...section,
      entries: section.entries.map((entry, index) => index === entryIndex ? { ...entry, ...patch } : entry),
    }),
  }));
  const addBullet = (entryIndex) => updateEntry(entryIndex, {
    bullets: [...(activeSection?.entries?.[entryIndex]?.bullets || []), { id: `bullet-${Date.now()}`, text: '' }],
  });
  const updateBullet = (entryIndex, bulletIndex, text) => updateEntry(entryIndex, {
    bullets: activeSection.entries[entryIndex].bullets.map((bullet, index) => index === bulletIndex ? { ...bullet, text } : bullet),
  });
  const removeBullet = (entryIndex, bulletIndex) => updateEntry(entryIndex, {
    bullets: activeSection.entries[entryIndex].bullets.filter((_, index) => index !== bulletIndex),
  });

  const saveVersion = async () => {
    if (saveVersionRequestRef.current) return;
    saveVersionRequestRef.current = true;
    setSavingVersion(true);
    try {
      await flushSave(content, settings);
      const response = await careerAgentService.saveVersion(doc.id, 'Manual save');
      setVersions(response?.versions || await careerAgentService.listVersions(doc.id));
    } catch {
      setDirty(true);
    } finally {
      saveVersionRequestRef.current = false;
      setSavingVersion(false);
    }
  };

  const restoreVersion = async (versionNumber) => {
    if (restoreVersionRequestRef.current) return;
    restoreVersionRequestRef.current = true;
    setRestoringVersion(versionNumber);
    clearTimeout(saveTimer.current);
    pendingSaveRef.current = null;
    try {
      const payload = await careerAgentService.restoreVersion(doc.id, versionNumber);
      setContent(payload.content);
      setSettings(payload.settings);
      setVersions(payload.versions || []);
      setDirty(false);
      setShowHistory(false);
    } catch {
      setDirty(true);
    } finally {
      restoreVersionRequestRef.current = false;
      setRestoringVersion(null);
    }
  };

  const runAssist = async (action) => {
    if (!assistText.trim()) return;
    setAssistBusy(true);
    setAssistResult(null);
    try {
      setAssistResult(await careerAgentService.aiAssist(doc.id, { action, selectedText: assistText }));
    } catch (error) {
      setAssistResult({ error: error.message || 'Writing assistance is unavailable right now.' });
    } finally {
      setAssistBusy(false);
    }
  };
  const useSuggestion = (replacement) => {
    const replaced = applyReplacement(content, assistText, replacement);
    if (replaced) update(replaced);
    setAssistResult(null);
    setAssistText(replacement);
  };
  const handleExport = async (format) => {
    await flushSave(content, settings);
    await onExport(format);
  };
  const previewDoc = { ...doc, content, settings };

  return (
    <div className="ca-editor-workspace">
      <div className="ca-editor-topbar">
        <div className="ca-editor-title">
          <button type="button" className="ca-back-link" onClick={onBack}><ArrowLeft size={15} /> Back to package</button>
          <div className="ca-editor-title-row"><FileText size={18} /><div><h1>{doc.document_type === 'CV' ? 'CV' : 'Cover letter'}</h1><span>{pkg?.target_job?.title || 'Application document'}</span></div></div>
        </div>
        <div className="ca-save-state">
          {saving ? <><Loader2 className="ca-spin" size={14} /> Saving…</> : dirty ? <><PencilLine size={14} /> Unsaved changes</> : <><CheckCircle2 size={14} /> Saved</>}
          <span className="ca-save-divider" />
          <Button className="ca-button ca-button--quiet" variant="outline" disabled={savingVersion || saving} onClick={saveVersion}>{savingVersion ? <Loader2 className="ca-spin" size={14} /> : <Save size={14} />} {savingVersion ? 'Saving version…' : 'Save version'}</Button>
          <Button className={cn('ca-button ca-button--quiet', showHistory && 'ca-button--selected')} variant="outline" disabled={savingVersion || Boolean(restoringVersion)} onClick={() => setShowHistory((value) => !value)}><History size={14} /> History</Button>
          <ExportMenu onExport={handleExport} exporting={exporting} quality={pkg?.quality_report} />
        </div>
      </div>
      <div className="ca-editor-layout">
        <EditorOutline sections={content.sections || []} selectedSection={selectedSection} onSelect={setSelectedSection} onMove={moveSection} onDelete={removeSection} onAdd={addSection} />
        <main className="ca-preview-column">
          <div className="ca-preview-context"><div><span className="ca-context-label">Live document preview</span><strong>{pkg?.target_job?.title || 'Your document'}</strong></div><span className="ca-status-dot ca-status-dot--plain"><CheckCircle2 size={14} /> Text stays editable</span></div>
          <DocumentPreview document={previewDoc} selectedSectionId={selectedSection} />
        </main>
        <aside className="ca-tool-rail">
          {showHistory ? <HistoryPanel versions={versions} busy={saving || savingVersion || Boolean(restoringVersion)} onClose={() => setShowHistory(false)} onRestore={restoreVersion} /> : <>
            {doc.document_type === 'COVER_LETTER' ? <CoverLetterEditor content={content} update={update} onAssistText={setAssistText} /> : <SectionEditor section={activeSection} onTitleChange={(title) => updateSection({ title })} onEntryChange={updateEntry} onBulletChange={updateBullet} onAddBullet={addBullet} onRemoveBullet={removeBullet} onAssistText={setAssistText} />}
            <TemplateSettings settings={settings} doc={doc} onChange={updateSettings} />
            <WritingAssistant text={assistText} setText={setAssistText} busy={assistBusy} result={assistResult} onRun={runAssist} onUse={useSuggestion} />
          </>}
        </aside>
      </div>
    </div>
  );
}

function MatchAnalysisPanel({ analysis, quality, onBack }) {
  const scores = analysis?.scores || {}; const matched = analysis?.matched?.skills || []; const missing = analysis?.missing?.skills || analysis?.missing?.requirements || []; const transferable = analysis?.transferable || [];
  return <section className="ca-match-detail"><button type="button" className="ca-back-link" onClick={onBack}><ArrowLeft size={15} /> Back to package</button><div className="ca-match-detail-header"><SectionLabel>Recruiter view</SectionLabel><h1>How this application <em>fits</em> the role</h1><p>{analysis?.note || 'A compact view of the evidence behind your match.'}</p></div><div className="ca-match-detail-grid"><article className="ca-match-score-card"><span>Overall job fit</span><ScoreDial value={scores.overall} size={138} label="overall fit" /><div className="ca-score-grid">{[['Skills', scores.skills], ['Experience', scores.experience], ['Education', scores.education], ['Keywords', scores.keyword_coverage]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{Math.round(value || 0)}%</strong></div>)}</div></article><article className="ca-match-evidence"><div><span className="ca-fit-label ca-fit-label--strong">Strongest evidence</span><div className="ca-evidence-list">{matched.length ? matched.map((item) => <span key={item} className="ca-evidence-chip"><Check size={13} /> {item}</span>) : <span className="ca-muted-copy">No matched skills were returned for this package.</span>}</div></div>{missing.length > 0 && <div><span className="ca-fit-label ca-fit-label--gap">Needs attention</span><ul className="ca-gap-list">{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}{transferable.length > 0 && <div><span className="ca-fit-label ca-fit-label--transfer">Transferable</span><p>{transferable.map((item) => item.reason || item.label || item).join('; ')}</p></div>}{quality && <div className="ca-quality-block"><span className="ca-fit-label">Document quality</span><p>ATS readiness {Math.round(quality.ats_readiness || 0)}/100 · {quality.factual_status?.replace(/_/g, ' ').toLowerCase() || 'reviewed'}</p>{quality.warnings?.length > 0 && <ul className="ca-gap-list">{quality.warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}</ul>}</div>}</article></div></section>;
}

export default function CareerAgent() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const jobId = params.get('job_id');
  const jobTitle = params.get('job_title');
  const numericJobId = Number(jobId);
  const hasValidJobId = Number.isInteger(numericJobId) && numericJobId > 0;
  const requestedPackageId = Number(params.get('package_id'));
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState(null);
  const [usage, setUsage] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [view, setView] = useState('overview');
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState(null);
  const [targetChoice, setTargetChoice] = useState(hasValidJobId ? 'platform' : 'general');
  const [pastedJob, setPastedJob] = useState({ title: '', description: '', employer: '' });
  const [showGenerator, setShowGenerator] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [openingDocId, setOpeningDocId] = useState(null);
  const [generationSubmitting, setGenerationSubmitting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const generationRequestRef = useRef(false);
  const documentRequestRef = useRef(false);
  const exportRequestRef = useRef(false);
  const getIdempotencyKey = useIdempotencyKey();

  useEffect(() => {
    const queryReference = params.get('provider_reference') || params.get('checkout_reference');
    const storedReference = sessionStorage.getItem('career-agent-payment-reference');
    const paymentReference = queryReference || storedReference;
    if (!paymentReference) return undefined;
    let active = true;
    careerAgentService.verifyPayment(paymentReference)
      .then(async () => {
        sessionStorage.removeItem('career-agent-payment-reference');
        if (!active) return;
        const nextParams = new URLSearchParams(params);
        nextParams.delete('provider_reference');
        nextParams.delete('checkout_reference');
        setParams(nextParams, { replace: true });
        setUsage(await careerAgentService.getUsage());
        setError(null);
      })
      .catch((paymentError) => {
        sessionStorage.removeItem('career-agent-payment-reference');
        if (active) setError(paymentError.message || 'Payment could not be verified yet.');
      });
    return () => { active = false; };
  }, [params, setParams]);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [profile, usageData, generations] = await Promise.all([
        careerAgentService.getProfile(),
        careerAgentService.getUsage(),
        careerAgentService.listGenerations(),
      ]);
      setReadiness(profile);
      setUsage(usageData);
      const rows = Array.isArray(generations) ? generations : [];
      const completed = rows.find((generation) => generation.id === requestedPackageId && generationStatus(generation.status) === 'COMPLETED')
        || rows.find((generation) => generationStatus(generation.status) === 'COMPLETED');
      const processing = rows.find((generation) => generation.id === requestedPackageId && ['PROCESSING', 'PENDING'].includes(generationStatus(generation.status)))
        || rows.find((generation) => ['PROCESSING', 'PENDING'].includes(generationStatus(generation.status)));
      const [completedResult, processingResult] = await Promise.allSettled([
        completed ? careerAgentService.getGeneration(completed.id) : Promise.resolve(null),
        processing ? careerAgentService.getGeneration(processing.id) : Promise.resolve(null),
      ]);
      if (completedResult.status === 'fulfilled' && completedResult.value) setActivePackage(completedResult.value);
      if (processing) setGenerating(processingResult.status === 'fulfilled' && processingResult.value ? processingResult.value : processing);
      if (!silent) setError(null);
      storeCachedWorkspace(requestedPackageId || 'none', {
        readiness: profile,
        usage: usageData,
        generating: stripBodies(processingResult.status === 'fulfilled' && processingResult.value ? processingResult.value : processing),
        activePackage: stripBodies(completedResult.status === 'fulfilled' && completedResult.value ? completedResult.value : completed),
      });
    } catch (e) {
      if (!silent) setError(e.message || 'Could not load your career workspace.');
    } finally {
      setLoading(false);
    }
  }, [requestedPackageId]);

  useEffect(() => {
    const cached = cachedWorkspace(requestedPackageId || 'none');
    if (cached) {
      // Paint the workspace instantly from the recent snapshot, then refresh
      // in the background so fresh usage/entitlements replace cache values.
      setReadiness(cached.readiness || null);
      setUsage(cached.usage || null);
      if (cached.activePackage) setActivePackage(cached.activePackage);
      if (cached.generating) setGenerating(cached.generating);
      setLoading(false);
      loadAll({ silent: true });
    } else {
      loadAll();
    }
  }, [loadAll, requestedPackageId]);
  useEffect(() => {
    setTargetChoice(hasValidJobId ? 'platform' : 'general');
    let mounted = true;
    if (!hasValidJobId) {
      setSelectedJob(null);
      return undefined;
    }
    apiService.getJob(numericJobId)
      .then((job) => mounted && setSelectedJob(normalizeJob(job, jobTitle)))
      .catch(() => mounted && setSelectedJob(normalizeJob(null, jobTitle)));
    return () => { mounted = false; };
  }, [hasValidJobId, numericJobId, jobTitle]);

  const deleteEvidence = async (evidenceId) => {
    if (evidenceBusy) return;
    setEvidenceBusy(true);
    try {
      await careerAgentService.deleteEvidence(evidenceId);
      setReadiness((previous) => ({
        ...previous,
        candidate: {
          ...previous?.candidate,
          evidence_sources: (previous?.candidate?.evidence_sources || []).filter((item) => item.evidence_id !== evidenceId),
        },
      }));
    } catch (deleteError) {
      setError(deleteError.message || 'Imported evidence could not be removed.');
    } finally {
      setEvidenceBusy(false);
    }
  };

  const openDocument = async (docId) => {
    if (!docId || documentRequestRef.current) return;
    documentRequestRef.current = true;
    setOpeningDocId(docId);
    try {
      setActiveDoc(await careerAgentService.getDocument(docId));
      setView('editor');
    } catch (e) {
      setError(e.message || 'Could not open this document.');
    } finally {
      documentRequestRef.current = false;
      setOpeningDocId(null);
    }
  };

  const exportDocument = async (docId, format) => {
    if (!docId || exportRequestRef.current) return;
    exportRequestRef.current = true;
    setExporting(format);
    setExportError(null);
    try {
      const blob = await careerAgentService.exportDocument(docId, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const documentTitle = activePackage?.documents?.find((doc) => doc.id === docId)?.title
        || activeDoc?.title
        || 'career-document';
      anchor.href = url;
      anchor.download = `${documentTitle.replace(/[^\w.-]+/g, '-')}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message || 'Could not export this document.');
    } finally {
      exportRequestRef.current = false;
      setExporting(null);
    }
  };

  const startGeneration = async () => {
    if (generationRequestRef.current) return;
    if (targetChoice === 'platform' && !hasValidJobId) {
      setError('Choose a valid opportunity before preparing this application.');
      return;
    }
    generationRequestRef.current = true;
    setGenerationSubmitting(true);
    setError(null);
    const idempotencyKey = getIdempotencyKey();
    const payload = targetChoice === 'platform'
      ? { jobId: numericJobId, idempotencyKey }
      : targetChoice === 'pasted'
        ? { targetJob: { ...pastedJob }, idempotencyKey }
        : { targetJob: { general: true, title: 'General CV' }, idempotencyKey };
    try {
      const result = await careerAgentService.generate(payload);
      setGenerating(result.package);
      setShowGenerator(false);
    } catch (e) {
      if (e.status === 402) {
        setUsage(e.usage || usage);
        setError('PAYWALL');
      } else {
        setError(e.message || 'Could not start generation.');
      }
    } finally {
      generationRequestRef.current = false;
      setGenerationSubmitting(false);
    }
  };

  const onGenerationCompleted = async (pkg) => {
    setGenerating(null);
    setActivePackage(pkg);
    setView('overview');
    try {
      setUsage(await careerAgentService.getUsage());
    } catch {
      // The package is complete even if the small usage refresh is unavailable.
    }
  };

  const targetJob = useMemo(() => normalizeJob(selectedJob || activePackage?.target_job, jobTitle), [activePackage?.target_job, selectedJob, jobTitle]);
  const activeCv = activePackage?.documents?.find((doc) => doc.document_type === 'CV');
  const activeLetter = activePackage?.documents?.find((doc) => doc.document_type === 'COVER_LETTER');
  const canGenerate = usage?.can_generate_new_package;
  const showPlanPrompt = error === 'PAYWALL' || (canGenerate === false && (!activePackage || showGenerator));

  if (loading) return <WorkspaceLoading />;
  if (view === 'editor' && activeDoc) return <div className="career-agent-page"><DocumentEditor document={activeDoc} package={activePackage} onExport={(format) => exportDocument(activeDoc.id, format)} exporting={exporting} onBack={() => setView('overview')} /></div>;
  if (view === 'match' && activePackage?.match_analysis) return <div className="career-agent-page"><MatchAnalysisPanel analysis={activePackage.match_analysis} quality={activePackage.quality_report} onBack={() => setView('overview')} /></div>;

  return (
    <div className="career-agent-page">
      <div className="ca-shell">
        <header className="ca-masthead">
          <div className="ca-masthead-copy">
            <span className="ca-eyebrow">Career Agent</span>
            <h1>Make your next application <em>clearer</em>.</h1>
            <p>Keep your experience in one place, shape it for the role in front of you, and leave with documents you’re comfortable sending.</p>
          </div>
          <div className="ca-masthead-actions">
            <Button className="ca-button ca-button--quiet" variant="outline" onClick={() => navigate('/jobs')}>
              <Search size={15} /> Browse jobs
            </Button>
          </div>
        </header>

        <StatusStrip readiness={readiness} usage={usage} />

        {showPlanPrompt && <Paywall reason={usage?.reason} />}
        {error && error !== 'PAYWALL' && (
          <div className="ca-error ca-page-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <IconButton label="Dismiss error" onClick={() => setError(null)}><X size={15} /></IconButton>
          </div>
        )}
        {exportError && (
          <div className="ca-error ca-page-error">
            <Download size={16} />
            <span>{exportError}</span>
            <IconButton label="Dismiss export error" onClick={() => setExportError(null)}><X size={15} /></IconButton>
          </div>
        )}

        <div className={cn('ca-workspace', !generating && 'ca-workspace--rail')}>
          <div className="ca-main-col">
            <TargetOpportunity
              job={targetJob}
              hasActivePackage={!!activePackage}
              onBrowse={() => navigate(hasValidJobId ? `/jobs/${numericJobId}` : '/jobs')}
              onChange={() => {
                if (targetJob) navigate('/jobs');
                else { setShowGenerator(true); setTargetChoice('pasted'); }
              }}
            />
            {generating && (
              <GenerationProgress
                package={generating}
                onCompleted={onGenerationCompleted}
                onError={(pkg) => setGenerating(pkg)}
              />
            )}
            {activePackage && !generating && (
              <ApplicationPackage
                package={activePackage}
                cv={activeCv}
                letter={activeLetter}
                openingDocId={openingDocId}
                exporting={exporting}
                onOpen={openDocument}
                onExport={exportDocument}
                onStartNew={() => { getIdempotencyKey(true); setShowGenerator(true); setTargetChoice(hasValidJobId ? 'platform' : 'general'); }}
                onMatch={() => setView('match')}
              />
            )}
            {(!activePackage || showGenerator) && !generating && !showPlanPrompt && (
              <GeneratorPanel
                jobId={hasValidJobId ? jobId : null}
                jobTitle={jobTitle}
                targetJob={targetJob}
                activePackage={activePackage}
                targetChoice={targetChoice}
                setTargetChoice={setTargetChoice}
                pastedJob={pastedJob}
                setPastedJob={setPastedJob}
                canGenerate={canGenerate}
                generationSubmitting={generationSubmitting}
                onGenerate={startGeneration}
                onClose={() => setShowGenerator(false)}
              />
            )}
          </div>

          {!generating && (
            <aside className="ca-rail">
              <ProfileReadiness
                readiness={readiness}
                onProfile={() => navigate('/jobseeker/profile')}
                onImport={() => setShowImport(true)}
                onDeleteEvidence={deleteEvidence}
                evidenceBusy={evidenceBusy}
              />
              {activePackage?.match_analysis ? (
                <JobFitCard
                  analysis={activePackage.match_analysis}
                  quality={activePackage.quality_report}
                  onEdit={() => setView('match')}
                />
              ) : (
                <section className="ca-panel ca-no-match">
                  <SectionLabel>Job fit</SectionLabel>
                  <h2>Your fit view will appear here.</h2>
                  <p>Prepare a package to see the evidence you can use, the requirements to address, and the areas worth checking before you apply.</p>
                  <Button className="ca-button ca-button--text" variant="ghost" onClick={() => setShowGenerator(true)}>
                    Choose a target role <ArrowRight size={15} />
                  </Button>
                </section>
              )}
            </aside>
          )}
        </div>

        <div className="ca-workspace-footer">
          <span>Private to your account · editable any time</span>
          <span>
            Need to update your evidence?{' '}
            <button type="button" onClick={() => navigate('/jobseeker/profile')}>Review profile</button>
          </span>
        </div>
      </div>
      {showImport && <ImportPanel onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); loadAll(); }} />}
    </div>
  );
}
