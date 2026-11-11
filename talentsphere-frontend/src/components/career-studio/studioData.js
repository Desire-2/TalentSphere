/**
 * Shared constants and pure helpers for the Career Studio.
 *
 * Template keys, stage keys and their labels mirror
 * backend/src/services/career_agent/templates.py and
 * backend/src/services/career_agent/orchestrator.py — the server rejects any
 * template key outside its registry, so these lists must stay in step with it.
 */

import { careerAgentService } from '../../services/careerAgentService';

export const TEMPLATE_OPTIONS = [
  { key: 'modern_professional', label: 'Modern', hint: 'Balanced, recruiter-friendly' },
  { key: 'ats_safe', label: 'ATS Professional', hint: 'Maximum parse safety, neutral ink' },
  { key: 'executive', label: 'Executive', hint: 'Leadership presence, serif polish' },
  { key: 'graduate', label: 'Graduate', hint: 'Education-forward, approachable' },
  { key: 'technical', label: 'Technical', hint: 'Skills and project emphasis' },
  { key: 'ngo_development', label: 'Development', hint: 'Program and field impact' },
  { key: 'academic_research', label: 'Academic', hint: 'Research and publications first' },
  { key: 'minimal', label: 'Minimal', hint: 'Quiet, typography-led' },
  { key: 'creative_professional', label: 'Creative', hint: 'Distinctive but print-safe' },
  { key: 'international_professional', label: 'International', hint: 'Clean, globally neutral' },
];

export const GRAYSCALE_TEMPLATES = new Set(['ats_safe', 'minimal']);

export const TEMPLATE_DEFAULT_ACCENTS = {
  modern_professional: '#0f766e',
  ats_safe: '#1a1a1a',
  executive: '#1e3a5f',
  graduate: '#2563a6',
  technical: '#2563a6',
  ngo_development: '#37624a',
  academic_research: '#8a3346',
  minimal: '#333333',
  creative_professional: '#0f766e',
  international_professional: '#1e3a5f',
};

export const templateDefaultAccent = (key) => TEMPLATE_DEFAULT_ACCENTS[key] || '#0f766e';

export const ACCENT_OPTIONS = [
  ['Ink', '#17212b'], ['Slate', '#425466'], ['Teal', '#0f766e'],
  ['Blue', '#2563a6'], ['Burgundy', '#8a3346'], ['Forest', '#37624a'],
];

// Ordered pipeline from orchestrator.STAGE_SEQUENCE with the server's
// display names; the fallback label is only used if a stage row is missing.
export const STAGE_SEQUENCE = [
  ['profile_intelligence', 'Reading your profile'],
  ['job_analysis', 'Analyzing the job'],
  ['candidate_matching', 'Selecting relevant experience'],
  ['cv_strategy', 'Planning your CV'],
  ['cv_content', 'Writing your CV'],
  ['cover_letter', 'Creating cover letter'],
  ['humanization', 'Refining the writing'],
  ['ats_validation', 'Checking ATS compatibility'],
  ['final_qa', 'Final quality review'],
  ['document_rendering', 'Preparing document'],
];

export const GENERATION_PHASES = [
  { label: 'Profile', keys: ['profile_intelligence'] },
  { label: 'Role match', keys: ['job_analysis', 'candidate_matching', 'cv_strategy'] },
  { label: 'Documents', keys: ['cv_content', 'cover_letter'] },
  { label: 'Final review', keys: ['humanization', 'ats_validation', 'final_qa', 'document_rendering'] },
];

export const AI_ACTIONS = [
  ['improve', 'Improve wording'], ['concise', 'Make concise'], ['natural', 'Make more natural'],
  ['achievement', 'Strengthen impact'], ['tailor', 'Tailor to this job'],
];

export const PROVENANCE_KINDS = [
  { key: 'profile', label: 'Profile', hint: 'From your profile sections' },
  { key: 'import', label: 'Imported', hint: 'From an imported document' },
  { key: 'user_confirmation', label: 'Confirmed', hint: 'Confirmed by you' },
];

export const TERMINAL_PACKAGE_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);
export const IN_FLIGHT_PACKAGE_STATUSES = new Set(['PENDING', 'PROCESSING']);

export const cn = (...values) => values.filter(Boolean).join(' ');

/** Backend timestamps are naive UTC ISO strings with no zone offset. Parsed
 *  as-is, browsers treat them as local time and every elapsed/relative time
 *  drifts by the UTC offset. Treat offset-less values as UTC. */
export const parseApiDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim().replace(' ', 'T');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
  const date = new Date(hasZone ? raw : `${raw}Z`);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const formatDate = (value) => {
  const date = parseApiDate(value);
  return date ? date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
};

export const formatDateShort = (value) => {
  const date = parseApiDate(value);
  return date ? date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

export const generationStatus = (value) => String(value || '').toUpperCase();

export const relativeTime = (value) => {
  const then = parseApiDate(value)?.getTime();
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

export const summarizeProvenance = (evidenceSources) => {
  const counts = {};
  let total = 0;
  for (const item of evidenceSources || []) {
    const key = item?.provenance?.source || 'profile';
    counts[key] = (counts[key] || 0) + 1;
    total += 1;
  }
  return { counts, total };
};

export const countDocumentWords = (content = {}) => {
  const chunks = [];
  const push = (value) => { if (typeof value === 'string') chunks.push(value); };
  const header = content.header || {};
  push(header.name);
  push(header.professional_title);
  (content.sections || []).forEach((section) => {
    push(section.title);
    (section.entries || []).forEach((entry) => {
      push(entry.heading);
      push(entry.subheading);
      push(entry.text);
      (entry.bullets || []).forEach((bullet) => push(bullet.text));
    });
  });
  push(content.subject);
  (content.body?.paragraphs || []).forEach((paragraph) => push(paragraph.text));
  return chunks.join(' ').split(/\s+/).filter(Boolean).length;
};

export const getEmployer = (job) =>
  job?.company?.name || job?.company_name || job?.employer || job?.employer_name || '';

export const getLocation = (job) =>
  job?.location?.is_remote || job?.location?.type === 'remote'
    ? 'Remote'
    : job?.location?.display || [job?.location?.city, job?.location?.state].filter(Boolean).join(', ') || job?.location || '';

// Platform jobs from GET /api/jobs carry company/location objects; target-job
// snapshots carry plain strings. Both reach the generation API as
// platform_job_id when they belong to the platform.
export const normalizeJob = (job, fallbackTitle = '') => {
  if (!job && !fallbackTitle) return null;
  const hasPlatformReference = Object.prototype.hasOwnProperty.call(job || {}, 'platform_job_id');
  const platformJobId = job?.platform_job_id ?? job?.job_id ?? (
    !hasPlatformReference && (
      job?.source_type === 'platform' ||
      (!job?.source_type && (job?.company || job?.company_name || job?.location || job?.employment_type))
    ) ? job?.id : null
  );
  return {
    ...job,
    platform_job_id: platformJobId || null,
    title: job?.title || fallbackTitle || 'Selected opportunity',
    employer: getEmployer(job) || job?.employer_name || 'AfriTech Opportunities',
    location: getLocation(job) || job?.location || 'Location not specified',
  };
};

// Human-readable line for the active stage, built only from stage metadata
// the backend actually persisted — never from invented numbers.
export const stagePreview = (stage) => {
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
      return read + missing;
    }
    case 'job_analysis':
      return meta.requirements
        ? `Extracted ${meta.requirements} requirement${meta.requirements === 1 ? '' : 's'} from the role.`
        : 'Analyzing the job posting.';
    case 'candidate_matching':
      return meta.overall_match != null
        ? `Scored the match at ${Math.round(meta.overall_match)}% overall.`
        : 'Matching your experience to the role.';
    case 'cv_strategy':
      return meta.template
        ? `Selected the ${String(meta.template).replace(/_/g, ' ')} template with a ${meta.structure || 'balanced'} structure.`
        : 'Planning the document strategy.';
    case 'cv_content':
      return meta.sections
        ? `Drafted ${meta.sections} CV section${meta.sections === 1 ? '' : 's'} from your evidence.`
        : 'Writing your CV.';
    case 'cover_letter':
      return 'Writing a focused cover letter from your strongest evidence.';
    case 'humanization': {
      const changes = Number(meta.cv_changes || 0) + Number(meta.letter_changes || 0);
      return changes ? `Refined ${changes} passage${changes === 1 ? '' : 's'} for a natural tone.` : 'Reviewing and polishing the wording.';
    }
    case 'ats_validation':
      return meta.ats_readiness != null
        ? `ATS readiness is ${Math.round(meta.ats_readiness)}/100.`
        : 'Checking recruiter readability.';
    case 'final_qa':
      return meta.checks
        ? `Completed ${meta.checks} final quality check${meta.checks === 1 ? '' : 's'}.`
        : 'Running the final quality check.';
    case 'document_rendering':
      return meta.documents?.length
        ? `Preparing ${meta.documents.join(' and ')} for editing.`
        : 'Preparing your documents.';
    default:
      return 'Working on this step in the background.';
  }
};

export const applyReplacement = (content, selectedText, replacement) => {
  if (!selectedText.trim()) return null;
  return JSON.parse(JSON.stringify(content, (key, value) =>
    typeof value === 'string' && value.trim() === selectedText.trim() ? replacement : value));
};

// Exports are streamed files: fetch, save, revoke. Returns the saved filename
// or throws with the server's message.
export async function downloadExport(documentId, format, title) {
  const blob = await careerAgentService.exportDocument(documentId, format);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(title || 'career-document').replace(/[^\w.-]+/g, '-')}.${format}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return anchor.download;
}
