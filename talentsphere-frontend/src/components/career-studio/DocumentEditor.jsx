import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Award, BookOpen, BriefcaseBusiness, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download,
  FileDown, FileText, FolderOpen, Globe, GraduationCap, History, Loader2,
  PencilLine, Plus, RotateCcw, Save, Settings2, Sparkles, Target, Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { careerAgentService } from '../../services/careerAgentService';
import {
  ACCENT_OPTIONS, AI_ACTIONS, GRAYSCALE_TEMPLATES, TEMPLATE_OPTIONS,
  applyReplacement, cn, downloadExport, formatDate, templateDefaultAccent,
} from './studioData';
import { Banner, DocumentCanvas, IconButton, ScoreDial, SectionLabel, TemplateMini } from './ui';

const SECTION_ICON_BY_TYPE = {
  summary: Target, profile: Target, objective: Target,
  experience: BriefcaseBusiness, employment: BriefcaseBusiness, work: BriefcaseBusiness,
  education: GraduationCap, publications: BookOpen, research: BookOpen,
  skills: Sparkles, competencies: Sparkles,
  projects: FolderOpen,
  certifications: Award, certificates: Award, awards: Award,
  languages: Globe,
};
const sectionIcon = (type) => SECTION_ICON_BY_TYPE[String(type || '').toLowerCase()] || FileText;

function ExportMenu({ onExport, exporting, quality }) {
  const [open, setOpen] = useState(false);
  const warnings = quality?.warnings || [];
  const factuality = quality?.factual_consistency;
  const checks = [
    ['Source-backed facts', quality?.factual_status === 'VERIFIED' && factuality?.status === 'VERIFIED'],
    ['ATS structure checked', Number.isFinite(Number(quality?.ats_readiness)) && quality.ats_readiness >= 60],
    ['No layout overflow', Boolean(quality) && !warnings.some((warning) => /overflow|page width|layout/i.test(warning))],
    ['Contact details checked', Array.isArray(quality?.content_quality) && quality.content_quality.some((item) => /contact/i.test(item))],
  ];
  return (
    <div className="cs-export-wrap">
      <button type="button" className="cs-btn cs-btn--primary" disabled={Boolean(exporting)} onClick={() => setOpen((value) => !value)}>
        <Download size={15} /> Export <ChevronDown size={14} />
      </button>
      {open && (
        <div className="cs-export-menu">
          <div className="cs-export-head">
            <strong>Export document</strong>
            <span>Generation-time quality review</span>
          </div>
          <div className="cs-export-checks">
            {checks.map(([label, okay]) => (
              <span key={label}>{okay ? <Check size={13} /> : <AlertTriangle size={13} />} {label}</span>
            ))}
          </div>
          {['pdf', 'docx', 'txt'].map((format) => (
            <button
              type="button" key={format} disabled={Boolean(exporting)}
              onClick={() => { setOpen(false); onExport(format); }}
            >
              {exporting === format ? <Loader2 className="cs-spin" size={15} /> : <FileDown size={15} />}
              {format.toUpperCase()}
              <small>{format === 'pdf' ? 'Share-ready' : format === 'docx' ? 'Editable' : 'Plain text'}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OutlineRail({ content, documentType, selected, onSelect, onMove, onDelete, onAdd }) {
  const sections = content.sections || [];
  const paragraphs = content.body?.paragraphs || [];
  return (
    <aside className="cs-outline" aria-label="Document outline">
      <div className="cs-outline-head">
        <SectionLabel>{documentType === 'CV' ? 'Sections' : 'Letter'}</SectionLabel>
        <span>{documentType === 'CV' ? `${sections.length} ${sections.length === 1 ? 'section' : 'sections'}` : `${paragraphs.length} paragraphs`}</span>
      </div>

      {documentType === 'CV' ? (
        <nav className="cs-outline-list">
          {sections.map((section, index) => {
            const Icon = sectionIcon(section.type);
            const entries = (section.entries || []).length;
            return (
              <div key={section.id || index} className={cn('cs-outline-item', selected === section.id && 'cs-outline-item--active')}>
                <button type="button" className="cs-outline-select" onClick={() => onSelect(section.id)}>
                  <span className="cs-outline-icon"><Icon size={13} /></span>
                  <span className="cs-outline-copy">
                    <strong>{section.title || 'Untitled section'}</strong>
                    <small>{entries} {entries === 1 ? 'entry' : 'entries'}</small>
                  </span>
                </button>
                <div className="cs-outline-actions">
                  <IconButton label="Move section up" disabled={index === 0} onClick={() => onMove(index, -1)}><ChevronUp size={13} /></IconButton>
                  <IconButton label="Move section down" disabled={index === sections.length - 1} onClick={() => onMove(index, 1)}><ChevronDown size={13} /></IconButton>
                  <IconButton label="Delete section" onClick={() => onDelete(index)}><Trash2 size={13} /></IconButton>
                </div>
              </div>
            );
          })}
          <button type="button" className="cs-outline-add" onClick={onAdd}><Plus size={14} /> Add section</button>
        </nav>
      ) : (
        <nav className="cs-outline-list">
          {paragraphs.map((paragraph, index) => (
            <button
              key={paragraph.id || index} type="button"
              className={cn('cs-outline-item cs-outline-item--plain', selected === `p-${index}` && 'cs-outline-item--active')}
              onClick={() => onSelect(`p-${index}`)}
            >
              <span className="cs-outline-icon"><FileText size={13} /></span>
              <span className="cs-outline-copy">
                <strong>Paragraph {index + 1}</strong>
                <small>{(paragraph.text || '').split(/\s+/).filter(Boolean).length} words</small>
              </span>
            </button>
          ))}
        </nav>
      )}
      <p className="cs-outline-tip">Changes save automatically. Reorder with the arrow controls.</p>
    </aside>
  );
}

function SectionEditor({ section, onTitleChange, onEntryChange, onBulletChange, onAddBullet, onRemoveBullet, onAddEntry, onAssistText }) {
  if (!section) {
    return <div className="cs-empty"><FileText size={20} /><p>Select a section to edit its content.</p></div>;
  }
  return (
    <div className="cs-section-editor">
      <div className="cs-editor-field-head">
        <SectionLabel>Editing section</SectionLabel>
        <input aria-label="Section title" value={section.title || ''} onChange={(event) => onTitleChange(event.target.value)} />
      </div>
      {(section.entries || []).map((entry, entryIndex) => (
        <div key={entry.id || entryIndex} className="cs-entry-editor">
          <span className="cs-entry-index">Entry {String(entryIndex + 1).padStart(2, '0')}</span>
          <div className="cs-field-row">
            <label>Heading<input value={entry.heading || ''} onChange={(event) => onEntryChange(entryIndex, { heading: event.target.value })} placeholder="Role, degree or project" /></label>
            <label>Dates<input value={entry.dates || ''} onChange={(event) => onEntryChange(entryIndex, { dates: event.target.value })} placeholder="2024 – Present" /></label>
          </div>
          <div className="cs-field-row">
            <label>Organization<input value={entry.subheading || ''} onChange={(event) => onEntryChange(entryIndex, { subheading: event.target.value })} placeholder="Company, school or client" /></label>
            <label>Location<input value={entry.location || ''} onChange={(event) => onEntryChange(entryIndex, { location: event.target.value })} placeholder="Kigali, Rwanda" /></label>
          </div>
          {entry.text !== undefined && (
            <label className="cs-field">Summary
              <textarea rows={4} value={entry.text || ''} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => onEntryChange(entryIndex, { text: event.target.value })} placeholder="Describe the work or learning clearly." />
            </label>
          )}
          {entry.bullets?.length > 0 && (
            <div className="cs-bullet-editor">
              <span className="cs-caption">Evidence bullets</span>
              {entry.bullets.map((bullet, bulletIndex) => (
                <div className="cs-bullet-row" key={bullet.id || bulletIndex}>
                  <span>•</span>
                  <textarea rows={2} value={bullet.text || ''} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => onBulletChange(entryIndex, bulletIndex, event.target.value)} placeholder="Start with an action and the result." />
                  <IconButton label="Remove bullet" onClick={() => onRemoveBullet(entryIndex, bulletIndex)}><X size={13} /></IconButton>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="cs-inline-add" onClick={() => onAddBullet(entryIndex)}><Plus size={13} /> Add bullet</button>
        </div>
      ))}
      <button type="button" className="cs-inline-add" onClick={onAddEntry}><Plus size={14} /> Add entry</button>
    </div>
  );
}

function LetterEditor({ content, update, selectedParagraph, onAssistText }) {
  const patchHeader = (patch) => update((previous) => ({ ...previous, header: { ...previous.header, ...patch } }));
  const setParagraph = (index, text) => update((previous) => ({
    ...previous,
    body: {
      ...previous.body,
      paragraphs: (previous.body?.paragraphs || []).map((paragraph, paragraphIndex) => (paragraphIndex === index ? { ...paragraph, text } : paragraph)),
    },
  }));
  return (
    <div className="cs-section-editor">
      <div className="cs-editor-field-head">
        <SectionLabel>Editing letter</SectionLabel>
        <strong className="cs-letter-title">Cover letter</strong>
      </div>
      <div className="cs-field-row">
        <label>Professional title<input value={content.header?.professional_title || ''} onChange={(event) => patchHeader({ professional_title: event.target.value })} /></label>
        <label>Phone<input value={content.header?.phone || ''} onChange={(event) => patchHeader({ phone: event.target.value })} /></label>
      </div>
      <label className="cs-field">Subject
        <input value={content.subject || ''} onChange={(event) => update((previous) => ({ ...previous, subject: event.target.value }))} placeholder="Application for…" />
      </label>
      {(content.body?.paragraphs || []).map((paragraph, index) => (
        <label className={cn('cs-field', selectedParagraph === `p-${index}` && 'cs-field--selected')} key={paragraph.id || index}>
          Paragraph {index + 1}
          <textarea rows={5} value={paragraph.text || ''} onFocus={(event) => onAssistText(event.target.value)} onChange={(event) => setParagraph(index, event.target.value)} />
        </label>
      ))}
      <label className="cs-field">Closing
        <input value={content.body?.closing || ''} onChange={(event) => update((previous) => ({ ...previous, body: { ...previous.body, closing: event.target.value } }))} placeholder="Sincerely," />
      </label>
    </div>
  );
}

function TemplateSettings({ settings, doc, onChange }) {
  const template = settings.template_key || doc?.template_key || 'modern_professional';
  const mode = settings.document_mode || doc?.document_mode || 'ats_safe';
  const accent = settings.accent_color || doc?.accent_color || '#0f766e';
  const selected = TEMPLATE_OPTIONS.find((item) => item.key === template) || TEMPLATE_OPTIONS[0];
  return (
    <div className="cs-settings">
      <div className="cs-tool-head">
        <Settings2 size={16} />
        <div><strong>Document settings</strong><span>Professional on screen and in print.</span></div>
      </div>
      <div className="cs-setting-block">
        <span className="cs-caption">Design</span>
        <div className="cs-template-tiles" role="radiogroup" aria-label="Document design">
          {TEMPLATE_OPTIONS.map((item) => (
            <button
              key={item.key} type="button" role="radio" aria-checked={template === item.key} title={item.hint}
              className={cn('cs-template-tile', template === item.key && 'cs-template-tile--active')}
              onClick={() => onChange({ template_key: item.key })}
            >
              <TemplateMini templateKey={item.key} className="cs-template-mini--tile" />
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <p className="cs-muted">{selected.hint}</p>
      </div>
      <div className="cs-setting-block">
        <span className="cs-caption">Document style</span>
        <label className={cn('cs-mode', mode === 'ats_safe' && 'cs-mode--active')}>
          <input type="radio" name="document-mode" checked={mode === 'ats_safe'} onChange={() => onChange({ document_mode: 'ats_safe' })} />
          <span><strong>ATS Professional</strong><small>Predictable reading order for recruiters and trackers.</small></span>
        </label>
        <label className={cn('cs-mode', mode === 'visual_professional' && 'cs-mode--active')}>
          <input type="radio" name="document-mode" checked={mode === 'visual_professional'} onChange={() => onChange({ document_mode: 'visual_professional' })} />
          <span><strong>Modern Professional</strong><small>More visual hierarchy, still practical to print.</small></span>
        </label>
      </div>
      {!GRAYSCALE_TEMPLATES.has(template) && (
        <div className="cs-setting-block">
          <span className="cs-caption">Accent colour</span>
          <div className="cs-swatches">
            {ACCENT_OPTIONS.map(([name, value]) => (
              <button
                key={value} type="button" title={name} aria-label={name}
                className={cn('cs-swatch', accent.toLowerCase() === value.toLowerCase() && 'cs-swatch--active')}
                style={{ background: value }}
                onClick={() => onChange({ accent_color: value })}
              ><Check size={12} /></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WritingAssistant({ text, setText, busy, result, onRun, onUse }) {
  return (
    <div className="cs-assistant">
      <div className="cs-tool-head">
        <Sparkles size={16} />
        <div><strong>Writing assistance</strong><span>Suggestions grounded in your own evidence.</span></div>
      </div>
      <textarea
        value={text} onChange={(event) => setText(event.target.value)} rows={3}
        placeholder="Focus a line or paragraph to improve…" aria-label="Text for writing assistance"
      />
      <div className="cs-ai-actions">
        {AI_ACTIONS.map(([key, label]) => (
          <button type="button" key={key} disabled={busy || !text.trim()} onClick={() => onRun(key)}>
            {busy && <Loader2 className="cs-spin" size={12} />} {label}
          </button>
        ))}
      </div>
      {result?.error && <div className="cs-error cs-error--compact"><AlertTriangle size={14} /> {result.error}</div>}
      {result?.alternatives?.map((alternative, index) => (
        <div key={index} className="cs-assist-result">
          <p>{alternative.text}</p>
          {alternative.note && <small>{alternative.note}</small>}
          <button type="button" className="cs-btn cs-btn--quiet" onClick={() => onUse(alternative.text)}>Use this version</button>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ versions, busy, onClose, onRestore, restoring }) {
  return (
    <div className="cs-history">
      <div className="cs-history-head">
        <div><SectionLabel>Version history</SectionLabel><h3>Saved moments</h3></div>
        <IconButton label="Close version history" onClick={onClose}><X size={16} /></IconButton>
      </div>
      {!versions.length && <p className="cs-muted">No manual versions yet. Save a version at a useful milestone.</p>}
      {versions.map((version) => (
        <div key={version.id || version.version_number} className="cs-version-row">
          <div>
            <strong>Version {version.version_number}</strong>
            <span>{version.change_source?.toLowerCase() || 'saved'} · {formatDate(version.created_at)}</span>
          </div>
          <button
            type="button" className="cs-btn cs-btn--text" disabled={busy}
            onClick={() => onRestore(version.version_number)}
          >
            {restoring === version.version_number ? <Loader2 className="cs-spin" size={13} /> : <RotateCcw size={13} />}
            {restoring === version.version_number ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      ))}
    </div>
  );
}

function JobFitPanel({ pkg }) {
  const analysis = pkg?.match_analysis;
  const quality = pkg?.quality_report;
  const target = pkg?.target_job;
  if (!analysis && !quality && !target) {
    return <p className="cs-muted">Job fit details are available once the package finishes.</p>;
  }
  const scores = analysis?.scores || {};
  const matched = analysis?.matched?.skills || [];
  const missing = analysis?.missing?.skills || analysis?.missing?.requirements || [];
  return (
    <div className="cs-job-fit">
      <div className="cs-tool-head">
        <Target size={16} />
        <div><strong>{target?.title || 'Target role'}</strong><span>{target?.employer_name || 'General documents'}</span></div>
      </div>
      {analysis && (
        <>
          <div className="cs-fit-score">
            <ScoreDial value={scores.overall} size={92} label="overall fit" />
            <div className="cs-score-grid">
              {[['Skills', scores.skills], ['Experience', scores.experience], ['Education', scores.education], ['Keywords', scores.keyword_coverage]].map(([label, value]) => (
                <div key={label}><span>{label}</span><strong>{Math.round(value || 0)}%</strong></div>
              ))}
            </div>
          </div>
          <div className="cs-fit-block">
            <span className="cs-fit-label cs-fit-label--strong">Strongest evidence</span>
            <div className="cs-chip-list">
              {matched.length ? matched.slice(0, 6).map((item) => (
                <span key={item} className="cs-chip"><Check size={12} /> {item}</span>
              )) : <span className="cs-muted">No matched skills were returned for this package.</span>}
            </div>
          </div>
          {missing.length > 0 && (
            <div className="cs-fit-block">
              <span className="cs-fit-label cs-fit-label--gap">Needs attention</span>
              <ul className="cs-gap-list">{missing.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
        </>
      )}
      {quality && (
        <div className="cs-fit-block">
          <span className="cs-fit-label">Document review</span>
          <p className="cs-muted">ATS readiness {Math.round(quality.ats_readiness || 0)}/100 · {quality.factual_status?.replace(/_/g, ' ').toLowerCase() || 'reviewed'}</p>
          {quality.warnings?.length > 0 && (
            <ul className="cs-gap-list">{quality.warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

export function DocumentEditor() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [content, setContent] = useState({});
  const [settings, setSettings] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedParagraph, setSelectedParagraph] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [railTab, setRailTab] = useState('edit');
  const [assistText, setAssistText] = useState('');
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistResult, setAssistResult] = useState(null);
  const [exporting, setExporting] = useState(null);

  const saveTimer = useRef(null);
  const pendingSaveRef = useRef(null);
  const mountedRef = useRef(true);
  const settingsRef = useRef(settings);
  const contentRef = useRef(content);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    careerAgentService.getDocument(Number(documentId))
      .then((data) => {
        if (!active) return;
        setDoc(data);
        setContent(data.content || {});
        setSettings(data.settings || {});
        setVersions(data.versions || []);
        setSelectedSection(data.content?.sections?.[0]?.id || null);
        setSelectedParagraph('p-0');
        setDirty(false);
        setSaveFailed(false);
        if (data.package_id) {
          careerAgentService.getGeneration(data.package_id)
            .then((detail) => { if (active) setPkg(detail); })
            .catch(() => {});
        }
      })
      .catch((fetchError) => {
        if (active) setLoadError(fetchError.message || 'Could not open this document.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [documentId]);

  const flushSave = useCallback(async (nextContent = null, nextSettings = null) => {
    clearTimeout(saveTimer.current);
    const payload = nextContent
      ? { content: nextContent, settings: nextSettings || settingsRef.current }
      : pendingSaveRef.current;
    if (!payload) return;
    pendingSaveRef.current = null;
    setSaving(true);
    try {
      await careerAgentService.autosaveDocument(Number(documentId), payload);
      if (mountedRef.current) { setDirty(false); setSaveFailed(false); }
    } catch (saveError) {
      pendingSaveRef.current = payload;
      if (mountedRef.current) { setDirty(true); setSaveFailed(true); }
      throw saveError;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [documentId]);

  const queueSave = useCallback((nextContent, nextSettings = settingsRef.current) => {
    pendingSaveRef.current = { content: nextContent, settings: nextSettings };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { flushSave().catch(() => {}); }, 900);
  }, [flushSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(saveTimer.current);
      const pending = pendingSaveRef.current;
      if (pending) careerAgentService.autosaveDocument(Number(documentId), pending).catch(() => {});
    };
  }, [documentId]);

  const update = (updater) => setContent((previous) => {
    const next = typeof updater === 'function' ? updater(previous) : updater;
    setDirty(true);
    setSaveFailed(false);
    queueSave(next);
    return next;
  });

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    if (patch.template_key && patch.template_key !== (settings.template_key || doc?.template_key || 'modern_professional')) {
      const previousKey = settings.template_key || doc?.template_key || 'modern_professional';
      const currentAccent = (settings.accent_color || doc?.accent_color || '#0f766e').toLowerCase();
      const followedDefault = GRAYSCALE_TEMPLATES.has(previousKey) || currentAccent === templateDefaultAccent(previousKey);
      if (followedDefault) next.accent_color = templateDefaultAccent(patch.template_key);
    }
    setSettings(next);
    setDirty(true);
    setSaveFailed(false);
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
        id, type: 'custom', title: 'New section',
        entries: [{ id: `entry-${Date.now()}`, heading: '', subheading: '', dates: '', text: '', bullets: [] }],
      }],
    }));
    setSelectedSection(id);
  };

  const addEntry = () => update((previous) => ({
    ...previous,
    sections: previous.sections.map((section) => (section.id !== activeSection?.id ? section : {
      ...section,
      entries: [...(section.entries || []), { id: `entry-${Date.now()}`, heading: '', subheading: '', dates: '', text: '', bullets: [] }],
    })),
  }));

  const updateSection = (patch) => update((previous) => ({
    ...previous,
    sections: previous.sections.map((section) => (section.id === activeSection?.id ? { ...section, ...patch } : section)),
  }));

  const updateEntry = (entryIndex, patch) => update((previous) => ({
    ...previous,
    sections: previous.sections.map((section) => (section.id !== activeSection?.id ? section : {
      ...section,
      entries: section.entries.map((entry, index) => (index === entryIndex ? { ...entry, ...patch } : entry)),
    })),
  }));

  const addBullet = (entryIndex) => updateEntry(entryIndex, {
    bullets: [...(activeSection?.entries?.[entryIndex]?.bullets || []), { id: `bullet-${Date.now()}`, text: '' }],
  });

  const updateBullet = (entryIndex, bulletIndex, text) => updateEntry(entryIndex, {
    bullets: activeSection.entries[entryIndex].bullets.map((bullet, index) => (index === bulletIndex ? { ...bullet, text } : bullet)),
  });

  const removeBullet = (entryIndex, bulletIndex) => updateEntry(entryIndex, {
    bullets: activeSection.entries[entryIndex].bullets.filter((_, index) => index !== bulletIndex),
  });

  const saveVersion = async () => {
    if (savingVersion) return;
    setSavingVersion(true);
    try {
      await flushSave(content, settings);
      await careerAgentService.saveVersion(Number(documentId), 'Manual save');
      setVersions(await careerAgentService.listVersions(Number(documentId)));
      toast.success('Version saved.');
    } catch {
      setSaveFailed(true);
      setDirty(true);
    } finally {
      setSavingVersion(false);
    }
  };

  const restoreVersion = async (versionNumber) => {
    if (restoringVersion) return;
    setRestoringVersion(versionNumber);
    clearTimeout(saveTimer.current);
    pendingSaveRef.current = null;
    try {
      const payload = await careerAgentService.restoreVersion(Number(documentId), versionNumber);
      setContent(payload.content);
      setSettings(payload.settings);
      setVersions(payload.versions || []);
      setDirty(false);
      setSaveFailed(false);
      setRailTab('edit');
      toast.success(`Restored version ${versionNumber}.`);
    } catch (restoreError) {
      toast.error(restoreError.message || 'Could not restore that version.');
      setDirty(true);
    } finally {
      setRestoringVersion(null);
    }
  };

  const runAssist = async (action) => {
    if (!assistText.trim() || assistBusy) return;
    setAssistBusy(true);
    setAssistResult(null);
    try {
      setAssistResult(await careerAgentService.aiAssist(Number(documentId), { action, selectedText: assistText }));
    } catch (assistError) {
      setAssistResult({ error: assistError.message || 'Writing assistance is unavailable right now.' });
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
    setExporting(format);
    try {
      await flushSave(content, settings);
      await downloadExport(Number(documentId), format, doc?.title);
    } catch (exportError) {
      toast.error(exportError.message || 'Could not export this document.');
    } finally {
      setExporting(null);
    }
  };

  const wordCount = useMemo(() => {
    const chunks = [];
    const push = (value) => { if (typeof value === 'string') chunks.push(value); };
    const header = content.header || {};
    push(header.name); push(header.professional_title);
    (content.sections || []).forEach((section) => {
      push(section.title);
      (section.entries || []).forEach((entry) => {
        push(entry.heading); push(entry.subheading); push(entry.text);
        (entry.bullets || []).forEach((bullet) => push(bullet.text));
      });
    });
    push(content.subject);
    (content.body?.paragraphs || []).forEach((paragraph) => push(paragraph.text));
    return chunks.join(' ').split(/\s+/).filter(Boolean).length;
  }, [content]);

  if (loading) {
    return <div className="cs-page"><div className="cs-skeleton" role="status" aria-live="polite">Opening your document…</div></div>;
  }

  if (loadError || !doc) {
    return (
      <div className="cs-page">
        <Banner kind="error" onDismiss={() => navigate('/jobseeker/career-agent/documents')}>{loadError || 'Document not found.'}</Banner>
        <button type="button" className="cs-btn cs-btn--quiet" onClick={() => navigate('/jobseeker/career-agent/documents')}>
          <ArrowLeft size={15} /> Back to documents
        </button>
      </div>
    );
  }

  const isCv = doc.document_type === 'CV';
  const designLabel = (TEMPLATE_OPTIONS.find((item) => item.key === (settings.template_key || doc.template_key)) || TEMPLATE_OPTIONS[0]).label;

  return (
    <div className="cs-editor">
      <div className="cs-editor-bar">
        <div className="cs-editor-bar-inner">
          <div className="cs-editor-title">
            <button type="button" className="cs-back" onClick={() => navigate('/jobseeker/career-agent/documents')}>
              <ArrowLeft size={15} /> Documents
            </button>
            <div className="cs-editor-title-row">
              <span className="cs-tag cs-tag--teal">{designLabel}</span>
              <h1>{isCv ? 'CV' : 'Cover letter'}</h1>
              <span>{pkg?.target_job?.title || 'Application document'}</span>
            </div>
          </div>
          <div className="cs-editor-actions">
            <span className={cn('cs-save-pill', saving && 'cs-save-pill--saving', saveFailed && 'cs-save-pill--failed', dirty && !saving && 'cs-save-pill--dirty')}>
              {saving ? <Loader2 className="cs-spin" size={13} />
                : saveFailed ? <AlertTriangle size={13} />
                  : dirty ? <PencilLine size={13} />
                    : <CheckCircle2 size={13} />}
              {saving ? 'Saving…' : saveFailed ? 'Save failed' : dirty ? 'Unsaved changes' : 'Saved'}
            </span>
            {saveFailed && (
              <button type="button" className="cs-btn cs-btn--quiet" onClick={() => flushSave().catch(() => {})}>
                Retry save
              </button>
            )}
            <button type="button" className="cs-btn cs-btn--quiet" disabled={savingVersion || saving} onClick={saveVersion}>
              {savingVersion ? <Loader2 className="cs-spin" size={14} /> : <Save size={14} />}
              {savingVersion ? 'Saving version…' : 'Save version'}
            </button>
            <button
              type="button" className={cn('cs-btn cs-btn--quiet', railTab === 'history' && 'cs-btn--on')}
              disabled={savingVersion || Boolean(restoringVersion)}
              onClick={() => setRailTab((value) => (value === 'history' ? 'edit' : 'history'))}
            ><History size={14} /> History</button>
            <ExportMenu onExport={handleExport} exporting={exporting} quality={pkg?.quality_report} />
          </div>
        </div>
      </div>

      <div className="cs-editor-layout">
        <OutlineRail
          content={content}
          documentType={doc.document_type}
          selected={isCv ? selectedSection : selectedParagraph}
          onSelect={(value) => (isCv ? setSelectedSection(value) : setSelectedParagraph(value))}
          onMove={moveSection}
          onDelete={removeSection}
          onAdd={addSection}
        />

        <main className="cs-editor-canvas">
          <div className="cs-canvas-context">
            <div>
              <span className="cs-caption">Live document preview</span>
              <strong>{pkg?.target_job?.title || 'Your document'}</strong>
            </div>
            <span className="cs-meta-chip"><FileText size={12} /> {wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          </div>
          <DocumentCanvas
            documentType={doc.document_type}
            content={content}
            templateKey={settings.template_key || doc.template_key}
            accentColor={settings.accent_color || doc.accent_color}
            selectedSectionId={selectedSection}
          />
        </main>

        <aside className="cs-rail">
          <div className="cs-rail-tabs" role="tablist" aria-label="Editor panels">
            {[['edit', 'Edit'], ['job', 'Job fit'], ['history', 'History']].map(([key, label]) => (
              <button
                key={key} type="button" role="tab" aria-selected={railTab === key}
                className={cn(railTab === key && 'cs-rail-tab--active')}
                onClick={() => setRailTab(key)}
              >{label}</button>
            ))}
          </div>

          {railTab === 'history' ? (
            <HistoryPanel
              versions={versions}
              busy={saving || savingVersion || Boolean(restoringVersion)}
              restoring={restoringVersion}
              onClose={() => setRailTab('edit')}
              onRestore={restoreVersion}
            />
          ) : railTab === 'job' ? (
            <JobFitPanel pkg={pkg} />
          ) : (
            <>
              {isCv ? (
                <SectionEditor
                  section={activeSection}
                  onTitleChange={(title) => updateSection({ title })}
                  onEntryChange={updateEntry}
                  onBulletChange={updateBullet}
                  onAddBullet={addBullet}
                  onRemoveBullet={removeBullet}
                  onAddEntry={addEntry}
                  onAssistText={setAssistText}
                />
              ) : (
                <LetterEditor content={content} update={update} selectedParagraph={selectedParagraph} onAssistText={setAssistText} />
              )}
              <TemplateSettings settings={settings} doc={doc} onChange={updateSettings} />
              <WritingAssistant
                text={assistText} setText={setAssistText} busy={assistBusy}
                result={assistResult} onRun={runAssist} onUse={useSuggestion}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default DocumentEditor;
