import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2,
  ClipboardPaste, FileText, FolderOpen, Loader2, Search, Sparkles, Upload,
} from 'lucide-react';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { useCareerStudio } from './CareerStudioProvider';
import { ImportDrawer, Paywall } from './panels';
import {
  TEMPLATE_OPTIONS, cn, normalizeJob, templateDefaultAccent,
} from './studioData';
import { Banner, SectionLabel, TemplateMini } from './ui';

const SOURCES = [
  { key: 'platform', icon: BriefcaseBusiness, title: 'An AfriTech opportunity', body: 'Search the job board and tailor to a real posting.' },
  { key: 'pasted', icon: ClipboardPaste, title: 'A pasted job description', body: 'Use a role you found anywhere else.' },
  { key: 'general', icon: FolderOpen, title: 'General documents', body: 'A CV and cover letter with no target role.' },
];

function JobPicker({ selected, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(() => {
      apiService.getJobs({ search: trimmed, page: 1, per_page: 6 })
        .then((data) => { if (!cancelled) setResults(data?.jobs || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setBusy(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  if (selected) {
    return (
      <div className="cs-picked-job">
        <span className="cs-entry-icon"><BriefcaseBusiness size={17} /></span>
        <div>
          <strong>{selected.title}</strong>
          <small>{selected.employer} · {selected.location}</small>
        </div>
        <button type="button" className="cs-btn cs-btn--quiet" onClick={() => onSelect(null)}>Change</button>
      </div>
    );
  }

  return (
    <div className="cs-job-picker">
      <label className="cs-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search AfriTech Opportunities by title or keyword…"
          aria-label="Search jobs"
        />
        {busy && <Loader2 size={14} className="cs-spin" />}
      </label>
      {query.trim().length >= 2 && !busy && !results.length && (
        <p className="cs-muted">No platform jobs matched that search. You can paste the job description instead.</p>
      )}
      {results.length > 0 && (
        <ul className="cs-job-results">
          {results.map((job) => (
            <li key={job.id}>
              <button type="button" onClick={() => onSelect(normalizeJob(job))}>
                <strong>{job.title}</strong>
                <small>
                  {job.company?.name || job.external_company_name || 'AfriTech'}
                  {' · '}{job.location?.display || job.location?.city || 'Location not specified'}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepNav({ step, onJump }) {
  const steps = ['Target', 'Evidence', 'Design', 'Confirm'];
  return (
    <ol className="cs-steps" aria-label="Preparation steps">
      {steps.map((label, index) => {
        const number = index + 1;
        return (
          <li key={label} className={cn('cs-step', number === step && 'cs-step--active', number < step && 'cs-step--done')}>
            <button type="button" onClick={() => onJump(number)} disabled={number > step}>
              <span>{number < step ? <CheckCircle2 size={13} /> : number}</span>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function CreateFlow() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    readiness, usage, templates, startGeneration, refreshProfile,
  } = useCareerStudio();

  const jobIdParam = params.get('job_id');
  const templateParam = params.get('template');
  const numericJobId = Number(jobIdParam);
  const hasValidJobId = Number.isInteger(numericJobId) && numericJobId > 0;
  const paramSource = params.get('source');

  const [step, setStep] = useState(1);
  const [sourceChoice, setSourceChoice] = useState(
    ['platform', 'pasted', 'general'].includes(paramSource) ? paramSource : (hasValidJobId ? 'platform' : 'general'),
  );
  const [job, setJob] = useState(null);
  const [pastedJob, setPastedJob] = useState({ title: '', employer: '', location: '', description: '', requirements: '' });
  const [templateKey, setTemplateKey] = useState(templateParam || 'modern_professional');
  const [documentMode, setDocumentMode] = useState('ats_safe');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const idempotencyKeyRef = useRef(null);
  if (!idempotencyKeyRef.current) idempotencyKeyRef.current = `pkg-${crypto.randomUUID()}`;

  const setSource = (key) => {
    setSourceChoice(key);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('source', key);
      return next;
    }, { replace: true });
    setStep(1);
  };

  // Deep link: land on the platform target with that job already selected.
  useEffect(() => {
    if (!hasValidJobId || job) return undefined;
    let mounted = true;
    apiService.getJob(numericJobId)
      .then((data) => { if (mounted) setJob(normalizeJob(data, params.get('job_title'))); })
      .catch(() => { if (mounted) setJob(normalizeJob(null, params.get('job_title'))); });
    return () => { mounted = false; };
    // `job` intentionally excluded so a loaded job is not refetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidJobId, numericJobId]);

  const checks = readiness?.checks || [];
  const readinessPercent = readiness?.readiness_percent
    ?? Math.round((checks.filter((check) => check.complete).length / (checks.length || 5)) * 100);
  const missing = readiness?.missing_information || [];
  const canGenerate = usage?.can_generate_new_package;
  const free = usage?.free_package || {};

  const templateList = templates?.length ? templates : TEMPLATE_OPTIONS;
  const selectedTemplate = templateList.find((item) => item.key === templateKey) || templateList[0];

  const targetValid = useMemo(() => {
    if (sourceChoice === 'platform') return Boolean(job?.platform_job_id);
    if (sourceChoice === 'pasted') return pastedJob.title.trim().length > 1 && pastedJob.description.trim().length > 1;
    return true;
  }, [sourceChoice, job, pastedJob]);

  const generate = async () => {
    if (submitting) return;
    if (!targetValid) {
      setError('Choose a target role before preparing this application.');
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const idempotencyKey = idempotencyKeyRef.current;
    const payload = sourceChoice === 'platform'
      ? { jobId: job.platform_job_id, idempotencyKey, templateKey, documentMode }
      : sourceChoice === 'pasted'
        ? { targetJob: { ...pastedJob }, idempotencyKey, templateKey, documentMode }
        : { targetJob: { general: true, title: 'General CV' }, idempotencyKey, templateKey, documentMode };
    try {
      await startGeneration(payload);
      idempotencyKeyRef.current = `pkg-${crypto.randomUUID()}`;
      toast.success('Generation started. Your documents are being prepared.');
      navigate('/jobseeker/career-agent');
    } catch (generateError) {
      if (generateError.status === 402) {
        setShowPaywall(true);
      } else {
        setError(generateError.message || 'Could not start generation.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const targetSummary = sourceChoice === 'platform'
    ? (job ? `${job.title} · ${job.employer}` : 'Choose a platform opportunity')
    : sourceChoice === 'pasted'
      ? (pastedJob.title || 'Paste a job description')
      : 'General CV + cover letter';

  return (
    <div className="cs-page">
      <div className="cs-flow-head">
        <Link className="cs-back" to="/jobseeker/career-agent"><ArrowLeft size={15} /> Studio</Link>
        <div>
          <SectionLabel>New document package</SectionLabel>
          <h1>Prepare a tailored package</h1>
          <p>Every package produces a CV and a cover letter, built only from evidence in your profile.</p>
        </div>
        <StepNav step={step} onJump={setStep} />
      </div>

      {error && <Banner kind="error" onDismiss={() => setError(null)}>{error}</Banner>}
      {showPaywall && <Paywall reason={usage?.reason} onCheckoutStart={() => setShowPaywall(false)} />}

      <div className="cs-flow">
        <div className="cs-flow-main">
          {step === 1 && (
            <section className="cs-card">
              <SectionLabel>Step 1 · Target</SectionLabel>
              <h2>What are you applying for?</h2>
              <div className="cs-source-grid">
                {SOURCES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key} type="button"
                      className={cn('cs-source-card', sourceChoice === item.key && 'cs-source-card--active')}
                      onClick={() => setSource(item.key)}
                    >
                      <span className="cs-entry-icon"><Icon size={17} /></span>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                      {sourceChoice === item.key && <span className="cs-source-check"><CheckCircle2 size={15} /></span>}
                    </button>
                  );
                })}
              </div>

              {sourceChoice === 'platform' && (
                <div className="cs-step-block">
                  <h3>Select an AfriTech opportunity</h3>
                  {job ? (
                    <div className="cs-picked-job">
                      <span className="cs-entry-icon"><BriefcaseBusiness size={17} /></span>
                      <div>
                        <strong>{job.title}</strong>
                        <small>{job.employer} · {job.location}</small>
                      </div>
                      <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setJob(null)}>Change</button>
                    </div>
                  ) : (
                    <JobPicker selected={null} onSelect={setJob} />
                  )}
                  {!job && (
                    <p className="cs-muted">Tip: open a job first and use “Generate CV”, or paste the description instead.</p>
                  )}
                </div>
              )}

              {sourceChoice === 'pasted' && (
                <div className="cs-step-block">
                  <h3>Paste the role</h3>
                  <div className="cs-field-row">
                    <label>Role title
                      <input value={pastedJob.title} onChange={(event) => setPastedJob((prev) => ({ ...prev, title: event.target.value }))} placeholder="e.g. Backend Engineer" />
                    </label>
                    <label>Employer <span className="cs-caption">Optional</span>
                      <input value={pastedJob.employer} onChange={(event) => setPastedJob((prev) => ({ ...prev, employer: event.target.value }))} placeholder="e.g. Kora Labs" />
                    </label>
                  </div>
                  <label className="cs-field">Location <span className="cs-caption">Optional</span>
                    <input value={pastedJob.location} onChange={(event) => setPastedJob((prev) => ({ ...prev, location: event.target.value }))} placeholder="Kigali, Rwanda" />
                  </label>
                  <label className="cs-field">Job description
                    <textarea rows={7} value={pastedJob.description} onChange={(event) => setPastedJob((prev) => ({ ...prev, description: event.target.value }))} placeholder="Paste the responsibilities and requirements…" />
                  </label>
                  <label className="cs-field">Requirements <span className="cs-caption">Optional, one per line</span>
                    <textarea rows={4} value={pastedJob.requirements} onChange={(event) => setPastedJob((prev) => ({ ...prev, requirements: event.target.value }))} placeholder="Python, 3 years experience, English…" />
                  </label>
                </div>
              )}

              {sourceChoice === 'general' && (
                <div className="cs-step-block cs-step-block--note">
                  <FolderOpen size={18} />
                  <p>A general package still produces a CV and a cover letter, written from your profile without a target role. You can tailor it later.</p>
                </div>
              )}

              <div className="cs-flow-actions">
                <button type="button" className="cs-btn cs-btn--primary" disabled={!targetValid} onClick={() => setStep(2)}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="cs-card">
              <SectionLabel>Step 2 · Evidence</SectionLabel>
              <h2>Review what the studio will use</h2>
              <div className="cs-evidence-summary">
                <div className="cs-evidence-stat">
                  <strong>{readinessPercent}<i>%</i></strong>
                  <span>profile readiness</span>
                </div>
                <ul className="cs-check-list">
                  {checks.map((check) => (
                    <li key={check.key} className={cn('cs-check', !check.complete && 'cs-check--attention')}>
                      {check.complete ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {missing.length > 0 && (
                <p className="cs-note cs-note--warn"><AlertTriangle size={15} /><span>Still missing: {missing.join(', ')}. The documents will work without them, but they are worth adding.</span></p>
              )}
              <div className="cs-card-actions">
                <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setShowImport(true)}><Upload size={15} /> Import a CV</button>
                <Link className="cs-btn cs-btn--text" to="/jobseeker/profile">Edit profile</Link>
              </div>
              <div className="cs-flow-actions">
                <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button>
                <button type="button" className="cs-btn cs-btn--primary" onClick={() => setStep(3)}>Choose a design <ArrowRight size={15} /></button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="cs-card">
              <SectionLabel>Step 3 · Design</SectionLabel>
              <h2>Choose a document design</h2>
              <div className="cs-template-grid" role="radiogroup" aria-label="Document design">
                {templateList.map((item) => (
                  <button
                    key={item.key} type="button" role="radio" aria-checked={templateKey === item.key}
                    className={cn('cs-template-card', templateKey === item.key && 'cs-template-card--active')}
                    onClick={() => setTemplateKey(item.key)}
                  >
                    <TemplateMini templateKey={item.key} />
                    <strong>{item.label}</strong>
                    <small>{item.hint || item.description}</small>
                    {item.grayscale && <span className="cs-tag">Grayscale</span>}
                  </button>
                ))}
              </div>
              <div className="cs-mode-row" role="radiogroup" aria-label="Document style">
                <label className={cn('cs-mode', documentMode === 'ats_safe' && 'cs-mode--active')}>
                  <input type="radio" name="document-mode" checked={documentMode === 'ats_safe'} onChange={() => setDocumentMode('ats_safe')} />
                  <span><strong>ATS Professional</strong><small>Predictable reading order for applicant tracking systems.</small></span>
                </label>
                <label className={cn('cs-mode', documentMode === 'visual_professional' && 'cs-mode--active')}>
                  <input type="radio" name="document-mode" checked={documentMode === 'visual_professional'} onChange={() => setDocumentMode('visual_professional')} />
                  <span><strong>Modern Professional</strong><small>More visual hierarchy while staying practical to print.</small></span>
                </label>
              </div>
              <div className="cs-flow-actions">
                <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setStep(2)}><ArrowLeft size={15} /> Back</button>
                <button type="button" className="cs-btn cs-btn--primary" onClick={() => setStep(4)}>Review and generate <ArrowRight size={15} /></button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="cs-card">
              <SectionLabel>Step 4 · Confirm</SectionLabel>
              <h2>Ready to prepare</h2>
              <dl className="cs-confirm">
                <div><dt>Target</dt><dd>{targetSummary}</dd></div>
                <div><dt>Design</dt><dd>{selectedTemplate?.label} · {documentMode === 'ats_safe' ? 'ATS Professional' : 'Modern Professional'}</dd></div>
                <div><dt>Includes</dt><dd>Tailored CV + cover letter</dd></div>
                <div><dt>Allowance</dt><dd>
                  {canGenerate === false
                    ? 'No packages remaining on your current plan'
                    : free.remaining != null
                      ? `${free.remaining} package${free.remaining === 1 ? '' : 's'} remaining`
                      : 'Checked when you start'}
                </dd></div>
              </dl>
              <p className="cs-muted">Your profile stays editable while the package runs in the background. You can close this page — progress is saved.</p>
              <div className="cs-flow-actions">
                <button type="button" className="cs-btn cs-btn--quiet" onClick={() => setStep(3)}><ArrowLeft size={15} /> Back</button>
                <button type="button" className="cs-btn cs-btn--primary cs-btn--lg" disabled={submitting || canGenerate === false} onClick={generate}>
                  {submitting ? <Loader2 className="cs-spin" size={16} /> : <Sparkles size={16} />}
                  {submitting ? 'Starting…' : 'Generate documents'}
                </button>
              </div>
              {canGenerate === false && (
                <div className="cs-note cs-note--warn">
                  <AlertTriangle size={15} />
                  <span>{usage?.reason || 'Your current plan cannot start a new package. Saved documents stay editable.'}</span>
                  <button type="button" className="cs-btn cs-btn--text" onClick={() => setShowPaywall(true)}>View plans</button>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="cs-flow-rail">
          <div className="cs-rail-card">
            <SectionLabel>Package summary</SectionLabel>
            <ul className="cs-summary">
              <li><span>Target</span><strong>{targetSummary}</strong></li>
              <li><span>Design</span><strong>{selectedTemplate?.label || '—'}</strong></li>
              <li><span>Style</span><strong>{documentMode === 'ats_safe' ? 'ATS Professional' : 'Modern Professional'}</strong></li>
              <li><span>Documents</span><strong>CV + cover letter</strong></li>
              <li><span>Allowance</span><strong>{free.remaining != null ? `${free.remaining} left` : '—'}</strong></li>
            </ul>
            <div className="cs-rail-preview" style={{ '--paper-accent': templateDefaultAccent(templateKey) }}>
              <TemplateMini templateKey={templateKey} className="cs-template-mini--rail" />
              <span>{selectedTemplate?.hint}</span>
            </div>
            {step < 4 ? (
              <button
                type="button" className="cs-btn cs-btn--primary cs-btn--block"
                disabled={step === 1 && !targetValid}
                onClick={() => setStep((value) => Math.min(4, value + 1))}
              >
                {step === 1 && !targetValid ? 'Choose a target first' : `Continue to ${['Target', 'Evidence', 'Design', 'Confirm'][step]}`}
              </button>
            ) : (
              <button type="button" className="cs-btn cs-btn--primary cs-btn--block" disabled={submitting || canGenerate === false} onClick={generate}>
                {submitting ? <Loader2 className="cs-spin" size={15} /> : <FileText size={15} />}
                {submitting ? 'Starting…' : 'Generate documents'}
              </button>
            )}
            <p className="cs-rail-note">Generation runs in the background. You will be notified in-app when it is ready.</p>
          </div>
        </aside>
      </div>

      {showImport && (
        <ImportDrawer onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); refreshProfile(); }} />
      )}
    </div>
  );
}

export default CreateFlow;
