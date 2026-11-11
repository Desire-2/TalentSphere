import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2,
  X, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  GRAYSCALE_TEMPLATES, cn, countDocumentWords, templateDefaultAccent,
} from './studioData';

export function SectionLabel({ children }) {
  return <span className="cs-label">{children}</span>;
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('cs-icon-btn', className)} {...props}>
      {children}
    </button>
  );
}

export function ScoreDial({ value, size = 80, label = '' }) {
  const score = Math.max(0, Math.min(100, Math.round(value || 0)));
  const stroke = size > 110 ? 7 : 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="cs-dial" style={{ '--dial-size': `${size}px` }} role="img" aria-label={`${score} percent ${label || 'score'}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="cs-dial-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="cs-dial-arc"
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="cs-dial-value">
        <strong>{score}<i>%</i></strong>
        {label ? <small>{label}</small> : null}
      </span>
    </div>
  );
}

export function Banner({ kind = 'error', children, onDismiss, action }) {
  return (
    <div className={cn('cs-banner', `cs-banner--${kind}`)} role={kind === 'error' ? 'alert' : 'status'}>
      {kind === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <span className="cs-banner-text">{children}</span>
      {action}
      {onDismiss && (
        <IconButton label="Dismiss" onClick={onDismiss}><X size={15} /></IconButton>
      )}
    </div>
  );
}

export function LoadingBlock({ title = 'Loading your studio', detail = 'Fetching your profile, documents and usage.' }) {
  return (
    <div className="cs-loading" role="status" aria-live="polite">
      <div className="cs-loading-card">
        <span className="cs-loading-mark"><Loader2 size={18} className="cs-spin" /></span>
        <div>
          <strong>{title}</strong>
          <p>{detail}</p>
        </div>
        <div className="cs-loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="cs-empty">
      {Icon && <span className="cs-empty-mark"><Icon size={20} /></span>}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

/** Small paper thumbnail echoing the real design (same data-template keys). */
export function TemplateMini({ templateKey, className = '' }) {
  return (
    <span className={cn('cs-template-mini', className)} data-template={templateKey} aria-hidden="true">
      <span className="cs-template-mini-name" />
      <span className="cs-template-mini-rule" />
      <span className="cs-template-mini-line" />
      <span className="cs-template-mini-line cs-template-mini-line--short" />
    </span>
  );
}

function PaperSection({ section, selected }) {
  return (
    <section className={cn('cs-paper-section', selected && 'cs-paper-section--selected')} data-doc-section={section.id}>
      <h2>{section.title}</h2>
      {(section.entries || []).map((entry, index) => (
        <div key={entry.id || index} className="cs-paper-entry">
          {(entry.heading || entry.subheading) && (
            <div className="cs-paper-entry-heading">
              <strong>{entry.heading}</strong>
              <span>{[entry.dates, entry.location].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {entry.subheading && <p className="cs-paper-subheading">{entry.subheading}</p>}
          {entry.text && <p>{entry.text}</p>}
          {entry.bullets?.length > 0 && (
            <ul>{entry.bullets.map((bullet, bulletIndex) => <li key={bullet.id || bulletIndex}>{bullet.text}</li>)}</ul>
          )}
        </div>
      ))}
    </section>
  );
}

function CoverLetterPaper({ content, name }) {
  return (
    <article className="cs-cover-letter-preview">
      {[content.recipient?.company, content.recipient?.role, content.recipient?.address].filter(Boolean).map((line) => (
        <div key={line}>{line}</div>
      ))}
      {content.subject && <p className="cs-letter-subject">Re: {content.subject}</p>}
      {content.recipient?.salutation && <p>{content.recipient.salutation}</p>}
      {(content.body?.paragraphs || []).map((paragraph, index) => (
        <p key={paragraph.id || index}>{paragraph.text}</p>
      ))}
      <p className="cs-letter-closing">
        {content.body?.closing || 'Sincerely,'}<br />
        <strong>{name || 'Your name'}</strong>
      </p>
    </article>
  );
}

/**
 * Live A4 canvas with zoom and pagination. Renders the structured document
 * content exactly as the exported file is laid out.
 */
export function DocumentCanvas({ documentType, content = {}, templateKey, accentColor, selectedSectionId }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(0);
  const isCover = documentType === 'COVER_LETTER';
  const header = content.header || {};
  const key = templateKey || 'modern_professional';
  const accent = GRAYSCALE_TEMPLATES.has(key)
    ? templateDefaultAccent(key)
    : (accentColor || templateDefaultAccent(key));

  const pages = useMemo(() => {
    const sourceSections = content.sections || [];
    return isCover
      ? [sourceSections]
      : Array.from({ length: Math.max(1, Math.ceil(sourceSections.length / 4)) }, (_, index) => sourceSections.slice(index * 4, index * 4 + 4));
  }, [content.sections, isCover]);

  const safePage = Math.min(page, pages.length - 1);
  const wordCount = useMemo(() => countDocumentWords(content), [content]);

  useEffect(() => {
    const index = pages.findIndex((items) => items.some((section) => section.id === selectedSectionId));
    if (index >= 0 && index !== page) setPage(index);
    // `page` intentionally omitted: re-syncing on every page turn would fight
    // the user's own pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSectionId, pages]);

  return (
    <div className="cs-canvas">
      <div className="cs-canvas-bar">
        <div className="cs-canvas-controls">
          <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(70, value - 10))}><ZoomOut size={15} /></IconButton>
          <button type="button" className="cs-zoom-value" onClick={() => setZoom(100)}>{zoom}%</button>
          <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(130, value + 10))}><ZoomIn size={15} /></IconButton>
        </div>
        <span className="cs-canvas-words">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <div className="cs-canvas-pages">
          <IconButton label="Previous page" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
            <ChevronLeft size={15} />
          </IconButton>
          <span>Page {safePage + 1} / {pages.length}</span>
          <IconButton label="Next page" disabled={safePage >= pages.length - 1} onClick={() => setPage((value) => Math.min(pages.length - 1, value + 1))}>
            <ChevronRight size={15} />
          </IconButton>
        </div>
      </div>
      <div className="cs-paper-stage">
        <article
          className="cs-paper"
          data-template={key}
          style={{ '--paper-accent': accent, transform: `scale(${zoom / 100})` }}
        >
          <div className="cs-paper-inner">
            <header className="cs-paper-header">
              <h1>{header.name || 'Your Name'}</h1>
              {header.professional_title && <p className="cs-paper-role">{header.professional_title}</p>}
              <p className="cs-paper-contact">
                {[header.email, header.phone, header.location].filter(Boolean).join(' · ')}
                {header.links?.length ? ` · ${header.links.join(' · ')}` : ''}
              </p>
            </header>
            {isCover ? (
              <CoverLetterPaper content={content} name={header.name} />
            ) : (
              <div className="cs-paper-sections">
                {content.summary && (
                  <section className="cs-paper-section" data-doc-section="summary">
                    <h2>Profile</h2>
                    <p>{content.summary}</p>
                  </section>
                )}
                {pages[safePage]?.map((section) => (
                  <PaperSection key={section.id || section.title} section={section} selected={section.id === selectedSectionId} />
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
