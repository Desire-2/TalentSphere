import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BriefcaseBusiness, Check, CheckCircle2,
  ClipboardPaste, Download, FileText, FolderOpen, Loader2, PencilLine,
  Plus, Target, Trash2, Upload,
} from 'lucide-react';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { useCareerStudio } from './CareerStudioProvider';
import { GenerationPanel } from './GenerationPanel';
import { ImportDrawer, Paywall } from './panels';
import {
  PROVENANCE_KINDS, cn, downloadExport, normalizeJob, summarizeProvenance,
} from './studioData';
import { Banner, ScoreDial, SectionLabel } from './ui';

function ReadinessPanel({ readiness, onProfile, onImport, onDeleteEvidence, evidenceBusy }) {
  const checks = readiness?.checks || [];
  const percent = readiness?.readiness_percent
    ?? Math.round((checks.filter((check) => check.complete).length / (checks.length || 5)) * 100);
  const evidenceSources = readiness?.candidate?.evidence_sources || [];
  const importedEvidence = evidenceSources.filter((item) => String(item.source || '').startsWith('Confirmed import'));
  const missing = readiness?.missing_information || [];
  const { counts, total } = summarizeProvenance(evidenceSources);
  const present = PROVENANCE_KINDS.filter((kind) => counts[kind.key]);

  return (
    <section className="cs-card" aria-labelledby="readiness-title">
      <div className="cs-card-head">
        <div>
          <SectionLabel>Profile evidence</SectionLabel>
          <h2 id="readiness-title">What the studio can work with</h2>
        </div>
        <strong className="cs-big-stat">{percent}<i>%</i></strong>
      </div>
      <div className="cs-meter" aria-label={`${percent}% profile readiness`}>
        <span style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <ul className="cs-check-list">
        {checks.map((check) => (
          <li key={check.key} className={cn('cs-check', !check.complete && 'cs-check--attention')}>
            {check.complete ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{check.label}</span>
            {!check.complete && <small>Add</small>}
          </li>
        ))}
      </ul>

      {total > 0 && (
        <div className="cs-provenance">
          <SectionLabel>Where the facts come from</SectionLabel>
          <div className="cs-provenance-bar" aria-hidden="true">
            {present.map((kind) => (
              <span key={kind.key} className={cn('cs-provenance-seg', `cs-provenance-seg--${kind.key}`)}
                style={{ width: `${(counts[kind.key] / total) * 100}%` }} />
            ))}
          </div>
          <ul className="cs-provenance-legend">
            {present.map((kind) => (
              <li key={kind.key}>
                <span className={cn('cs-provenance-dot', `cs-provenance-seg--${kind.key}`)} />
                {kind.label} <strong>{counts[kind.key]}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <p className="cs-note cs-note--warn"><AlertTriangle size={15} /><span>Still needed: {missing.join(', ')}</span></p>
      )}
      {importedEvidence.length > 0 && (
        <div className="cs-imported">
          <SectionLabel>Imported evidence</SectionLabel>
          {importedEvidence.map((item) => (
            <div key={item.evidence_id}>
              <span>{String(item.category || 'evidence').replace(/_/g, ' ')}</span>
              <button
                type="button" className="cs-icon-btn" title="Remove imported evidence"
                aria-label="Remove imported evidence" disabled={evidenceBusy}
                onClick={() => onDeleteEvidence(item.evidence_id)}
              ><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {readiness?.recommendations?.[0] && (
        <p className="cs-note"><AlertTriangle size={15} /><span>{readiness.recommendations[0]}</span></p>
      )}
      <div className="cs-card-actions">
        <button type="button" className="cs-btn cs-btn--quiet" onClick={onProfile}>Review profile</button>
        <button type="button" className="cs-btn cs-btn--text" onClick={onImport}><Upload size={15} /> Import CV</button>
      </div>
    </section>
  );
}

function OpportunityCard({ job, hasPackage }) {
  return (
    <section className="cs-opportunity" aria-labelledby="opportunity-title">
      <div className="cs-opportunity-copy">
        <SectionLabel>Selected opportunity</SectionLabel>
        <h2 id="opportunity-title">{job?.title}</h2>
        <div className="cs-opportunity-meta">
          <span><BriefcaseBusiness size={14} /> {job?.employer}</span>
          <span><Target size={14} /> {job?.location}</span>
          <span className="cs-tag">From AfriTech Opportunities</span>
        </div>
        <p>Your documents, match insight and cover letter stay tied to this role.</p>
      </div>
      <div className="cs-opportunity-actions">
        <Link className="cs-btn cs-btn--primary" to={`/jobseeker/career-agent/new?source=platform${job?.platform_job_id ? `&job_id=${job.platform_job_id}` : ''}`}>
          {hasPackage ? 'Prepare documents for this role' : 'Start documents for this role'} <ArrowRight size={16} />
        </Link>
        <Link className="cs-btn cs-btn--quiet" to={`/jobs/${job?.platform_job_id || ''}`}>View job posting</Link>
      </div>
    </section>
  );
}

function EntryPoints() {
  const items = [
    {
      key: 'platform',
      icon: BriefcaseBusiness,
      title: 'Target an AfriTech opportunity',
      body: 'Pick a role from the job board and tailor every line to it.',
      to: '/jobseeker/career-agent/new?source=platform',
    },
    {
      key: 'pasted',
      icon: ClipboardPaste,
      title: 'Paste a job description',
      body: 'Use a role you found anywhere else — we only need the text.',
      to: '/jobseeker/career-agent/new?source=pasted',
    },
    {
      key: 'general',
      icon: FolderOpen,
      title: 'Create general documents',
      body: 'A solid CV and cover letter without a specific target role.',
      to: '/jobseeker/career-agent/new?source=general',
    },
  ];
  return (
    <section className="cs-entry" aria-label="Create documents">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.key} className="cs-entry-card" to={item.to}>
            <span className="cs-entry-icon"><Icon size={18} /></span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <span className="cs-entry-go">Start <ArrowRight size={14} /></span>
          </Link>
        );
      })}
    </section>
  );
}

function ContinuePanel({ activePackage, exporting, onExport, openingId, onOpen }) {
  const documents = activePackage?.documents || [];
  const score = Math.round(activePackage?.match_analysis?.scores?.overall || 0);
  const target = activePackage?.target_job;
  return (
    <section className="cs-card cs-continue" aria-labelledby="continue-title">
      <div className="cs-card-head">
        <div>
          <SectionLabel>Continue working</SectionLabel>
          <h2 id="continue-title">{target?.title || 'Your latest documents'}</h2>
          <p className="cs-sub">{target?.employer_name || target?.employer || 'General documents'} · ready to edit and export</p>
        </div>
        {activePackage?.match_analysis && (
          <div className="cs-continue-score">
            <span>Job fit</span>
            <ScoreDial value={score} size={64} />
          </div>
        )}
      </div>
      <div className="cs-doc-grid">
        {documents.map((doc) => {
          const isCv = doc.document_type === 'CV';
          return (
            <article key={doc.id} className="cs-doc-card">
              <div className="cs-doc-top">
                <span className={cn('cs-doc-icon', isCv ? 'cs-doc-icon--teal' : 'cs-doc-icon--orange')}>
                  <FileText size={18} />
                </span>
                <div>
                  <span>{isCv ? 'CV' : 'Cover letter'}</span>
                  <strong>{doc.title || (isCv ? 'Your CV' : 'Your cover letter')}</strong>
                </div>
                <span className="cs-status-chip"><CheckCircle2 size={13} /> Ready</span>
              </div>
              <div className="cs-doc-actions">
                <button type="button" className="cs-btn cs-btn--primary" disabled={Boolean(openingId) || Boolean(exporting)} onClick={() => onOpen(doc.id)}>
                  {openingId === doc.id ? <Loader2 className="cs-spin" size={14} /> : <PencilLine size={14} />}
                  {openingId === doc.id ? 'Opening…' : `Edit ${isCv ? 'CV' : 'letter'}`}
                </button>
                <button type="button" className="cs-btn cs-btn--quiet" disabled={Boolean(exporting)} onClick={() => onExport(doc.id, 'pdf', doc.title)}>
                  {exporting === doc.id ? <Loader2 className="cs-spin" size={14} /> : <Download size={14} />} PDF
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="cs-card-actions">
        <Link className="cs-btn cs-btn--text" to="/jobseeker/career-agent/documents">All documents <ArrowRight size={15} /></Link>
        <Link className="cs-btn cs-btn--quiet" to="/jobseeker/career-agent/new"><Plus size={15} /> New package</Link>
      </div>
    </section>
  );
}

function AllowancePanel({ usage }) {
  const free = usage?.free_package || {};
  const remaining = free.remaining;
  const canGenerate = usage?.can_generate_new_package;
  const subscription = usage?.active_subscription;
  return (
    <section className="cs-card" aria-labelledby="allowance-title">
      <div className="cs-card-head">
        <div>
          <SectionLabel>Plan &amp; usage</SectionLabel>
          <h2 id="allowance-title">Package allowance</h2>
        </div>
        <span className={cn('cs-tag', canGenerate === false && 'cs-tag--warn')}>
          {subscription ? 'Subscription' : 'Free plan'}
        </span>
      </div>
      <ul className="cs-allowance">
        <li><span>Included packages</span><strong>{free.included ?? '—'}</strong></li>
        <li><span>Used</span><strong>{free.used ?? '—'}</strong></li>
        <li><span>Reserved while running</span><strong>{free.reserved ?? '—'}</strong></li>
        <li className="cs-allowance-remaining"><span>Remaining</span><strong>{remaining ?? '—'}</strong></li>
      </ul>
      {subscription && (
        <p className="cs-note"><CheckCircle2 size={15} /><span>{subscription.plan?.name || subscription.plan_code} · {String(subscription.status || '').toLowerCase()}</span></p>
      )}
      {usage?.reason && <p className="cs-note cs-note--warn"><AlertTriangle size={15} /><span>{usage.reason}</span></p>}
      <div className="cs-card-actions">
        <Link className="cs-btn cs-btn--quiet" to="/jobseeker/career-agent/plan">View plans</Link>
        {canGenerate === false && <Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/plan">Upgrade</Link>}
      </div>
    </section>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    loading, error, dismissError, readiness, usage, activePackage, generating,
    refreshProfile, deleteEvidence, retryGeneration,
  } = useCareerStudio();

  const jobId = params.get('job_id');
  const jobTitle = params.get('job_title') || '';
  const numericJobId = Number(jobId);
  const hasValidJobId = Number.isInteger(numericJobId) && numericJobId > 0;

  const [selectedJob, setSelectedJob] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    if (!hasValidJobId) {
      setSelectedJob(null);
      return undefined;
    }
    let mounted = true;
    apiService.getJob(numericJobId)
      .then((job) => { if (mounted) setSelectedJob(normalizeJob(job, jobTitle)); })
      .catch(() => { if (mounted) setSelectedJob(normalizeJob(null, jobTitle)); });
    return () => { mounted = false; };
  }, [hasValidJobId, numericJobId, jobTitle]);

  const openDocument = useCallback((docId) => {
    setOpeningId(docId);
    navigate(`/jobseeker/career-agent/document/${docId}`);
  }, [navigate]);

  const exportDocument = async (docId, format, title) => {
    setExporting(docId);
    try {
      await downloadExport(docId, format, title);
    } catch (exportError) {
      toast.error(exportError.message || 'Could not export this document.');
    } finally {
      setExporting(null);
    }
  };

  const removeEvidence = async (evidenceId) => {
    if (evidenceBusy) return;
    setEvidenceBusy(true);
    try {
      await deleteEvidence(evidenceId);
    } catch (deleteError) {
      toast.error(deleteError.message || 'Imported evidence could not be removed.');
    } finally {
      setEvidenceBusy(false);
    }
  };

  const onRetry = async () => {
    if (retrying || !generating?.id) return;
    setRetrying(true);
    try {
      await retryGeneration(generating.id);
    } catch (retryError) {
      toast.error(retryError.message || 'Retry is unavailable right now.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return <div className="cs-page"><div className="cs-skeleton" role="status" aria-live="polite">Loading your studio…</div></div>;
  }

  const canGenerate = usage?.can_generate_new_package;
  const showPaywall = paywall || canGenerate === false;

  return (
    <div className="cs-page">
      <header className="cs-masthead">
        <div>
          <SectionLabel>Career Studio</SectionLabel>
          <h1>Make your next application <em>clearer</em>.</h1>
          <p>Keep your experience in one place, shape it for the role in front of you, and leave with documents you are comfortable sending.</p>
        </div>
        <div className="cs-masthead-actions">
          <Link className="cs-btn cs-btn--quiet" to="/jobs">Browse jobs</Link>
          <Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/new"><Plus size={16} /> New document</Link>
        </div>
      </header>

      {error && <Banner kind="error" onDismiss={dismissError}>{error}</Banner>}

      {hasValidJobId && <OpportunityCard job={selectedJob || normalizeJob(null, jobTitle)} hasPackage={Boolean(activePackage)} />}

      {generating && (
        <GenerationPanel package={generating} onRetry={onRetry} retrying={retrying} />
      )}

      {showPaywall && !generating && (
        <Paywall reason={usage?.reason} onCheckoutStart={() => setPaywall(false)} />
      )}

      {!generating && !showPaywall && (
        <EntryPoints />
      )}

      {!generating && activePackage && (
        <ContinuePanel
          activePackage={activePackage}
          exporting={exporting}
          onExport={exportDocument}
          openingId={openingId}
          onOpen={openDocument}
        />
      )}

      <div className="cs-columns">
        <ReadinessPanel
          readiness={readiness}
          onProfile={() => navigate('/jobseeker/profile')}
          onImport={() => setShowImport(true)}
          onDeleteEvidence={removeEvidence}
          evidenceBusy={evidenceBusy}
        />
        <AllowancePanel usage={usage} />
      </div>

      <footer className="cs-page-foot">
        <span>Private to your account · editable any time</span>
        <span>Need to update your evidence? <Link to="/jobseeker/profile">Review profile</Link></span>
      </footer>

      {showImport && (
        <ImportDrawer
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); refreshProfile(); }}
        />
      )}
    </div>
  );
}

export default Dashboard;
