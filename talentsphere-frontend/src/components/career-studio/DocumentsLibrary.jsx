import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Download, FileText, Loader2, PencilLine,
  RefreshCw, Sparkles,
} from 'lucide-react';
import { careerAgentService } from '../../services/careerAgentService';
import { useCareerStudio } from './CareerStudioProvider';
import {
  downloadExport, formatDateShort, generationStatus,
} from './studioData';
import { Banner, EmptyState, SectionLabel } from './ui';

// The list endpoint returns packages without their documents, so the library
// loads details for the most recent completed packages only. Older packages
// are still reachable through their job's apply flow.
const DETAIL_LIMIT = 12;

export function DocumentsLibrary() {
  const navigate = useNavigate();
  const { generations, refresh } = useCareerStudio();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [openingId, setOpeningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const completed = generations
        .filter((row) => generationStatus(row.status) === 'COMPLETED')
        .slice(0, DETAIL_LIMIT);
      const settled = await Promise.allSettled(
        completed.map((row) => careerAgentService.getGeneration(row.id)),
      );
      const details = settled
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => result.value);
      setRows(details);
      if (settled.some((result) => result.status === 'rejected') && !details.length) {
        setError('Some documents could not be loaded. Try again in a moment.');
      }
    } catch (loadError) {
      setError(loadError.message || 'Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, [generations]);

  useEffect(() => {
    load();
  }, [load]);

  const documents = rows.flatMap((pkg) => (pkg.documents || []).map((doc) => ({ doc, pkg })));
  const totalPackages = generations.filter((row) => generationStatus(row.status) === 'COMPLETED').length;

  const openDocument = (docId) => {
    setOpeningId(docId);
    navigate(`/jobseeker/career-agent/document/${docId}`);
  };

  const exportDocument = async (docId, format, title) => {
    setExporting(docId);
    try {
      await downloadExport(docId, format, title);
    } catch (exportError) {
      setError(exportError.message || 'Could not export this document.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="cs-page">
      <header className="cs-page-head">
        <div>
          <SectionLabel>My documents</SectionLabel>
          <h1>Documents you have prepared</h1>
          <p>Every package creates a CV and a cover letter. They stay editable and exportable for free.</p>
        </div>
        <div className="cs-page-head-actions">
          <button type="button" className="cs-btn cs-btn--quiet" onClick={() => refresh()} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'cs-spin' : ''} /> Refresh
          </button>
          <Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/new"><Sparkles size={15} /> New package</Link>
        </div>
      </header>

      {error && <Banner kind="error" onDismiss={() => setError(null)}>{error}</Banner>}

      {loading ? (
        <div className="cs-skeleton" role="status" aria-live="polite">Loading your documents…</div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          body="Prepare your first package and your CV and cover letter will appear here."
          action={<Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/new">Create documents <ArrowRight size={15} /></Link>}
        />
      ) : (
        <>
          <div className="cs-library">
            {documents.map(({ doc, pkg }) => {
              const isCv = doc.document_type === 'CV';
              return (
                <article key={doc.id} className="cs-library-row">
                  <span className={`cs-doc-icon ${isCv ? 'cs-doc-icon--teal' : 'cs-doc-icon--orange'}`}>
                    <FileText size={18} />
                  </span>
                  <div className="cs-library-copy">
                    <span className="cs-library-type">{isCv ? 'CV' : 'Cover letter'}</span>
                    <strong>{doc.title || (isCv ? 'Your CV' : 'Your cover letter')}</strong>
                    <small>
                      {pkg.target_job?.title || 'General documents'}
                      {pkg.target_job?.employer_name ? ` · ${pkg.target_job.employer_name}` : ''}
                      {doc.updated_at ? ` · updated ${formatDateShort(doc.updated_at)}` : ''}
                    </small>
                  </div>
                  <span className="cs-tag">{doc.template_key?.replace(/_/g, ' ') || 'design'}</span>
                  <div className="cs-library-actions">
                    <button type="button" className="cs-btn cs-btn--primary" disabled={openingId === doc.id} onClick={() => openDocument(doc.id)}>
                      {openingId === doc.id ? <Loader2 className="cs-spin" size={14} /> : <PencilLine size={14} />}
                      {openingId === doc.id ? 'Opening…' : 'Edit'}
                    </button>
                    <button type="button" className="cs-btn cs-btn--quiet" disabled={exporting === doc.id} onClick={() => exportDocument(doc.id, 'pdf', doc.title)}>
                      {exporting === doc.id ? <Loader2 className="cs-spin" size={14} /> : <Download size={14} />} PDF
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {totalPackages > DETAIL_LIMIT && (
            <p className="cs-muted cs-library-note">
              Showing documents from your {DETAIL_LIMIT} most recent packages ({totalPackages} completed in total).
            </p>
          )}
        </>
      )}

      {!loading && documents.length > 0 && (
        <div className="cs-note">
          <AlertTriangle size={15} />
          <span>Documents are grouped by the package that produced them. Deleting or renaming is not available yet — edit the content instead.</span>
        </div>
      )}
    </div>
  );
}

export default DocumentsLibrary;
