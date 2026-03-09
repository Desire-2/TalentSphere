import React from 'react';

/**
 * CV Template Components
 * All templates use Times New Roman at 11pt for optimal 2-page print density.
 * Compact spacing, all sections included, print-optimised CSS injected.
 */

// ─── Shared style constants ───────────────────────────────────────────────────
const ROOT_STYLE = {
  fontFamily: "'Times New Roman', Times, Georgia, serif",
  fontSize: '11pt',
  lineHeight: '1.4',
  color: '#111827',
  textAlign: 'justify',
};

const SECTION_GAP = { marginBottom: '9px' };

const makeSectionHeading = (color) => ({
  fontSize: '10pt',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color,
  marginBottom: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
});

const DIVIDER = (color) => ({
  height: '1px',
  background: `linear-gradient(90deg, ${color}, transparent)`,
  marginBottom: '5px',
});

const BODY = { fontSize: '11pt', color: '#374151' };
const SMALL = { fontSize: '9.5pt', color: '#6b7280' };

// ─── Professional Template ────────────────────────────────────────────────────
export const ProfessionalTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, awards, references } = cvData;

  return (
    <div className="cv-professional max-w-4xl mx-auto bg-white" style={ROOT_STYLE}>
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          .cv-professional { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .cv-professional .no-break { page-break-inside: avoid; }
        }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af, #312e81)', color: 'white', padding: '14px 20px 16px' }}>
        <h1 style={{ fontSize: '16pt', fontWeight: 700, marginBottom: '2px', letterSpacing: '-0.01em', fontFamily: "'Times New Roman', Times, serif" }}>
          {contact_information?.full_name}
        </h1>
        <p style={{ fontSize: '11pt', fontWeight: 400, marginBottom: '6px', opacity: 0.9 }}>
          {contact_information?.professional_title}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '9pt', opacity: 0.88 }}>
          {contact_information?.email && <span>✉ {contact_information.email}</span>}
          {contact_information?.phone && <span>☎ {contact_information.phone}</span>}
          {contact_information?.location && <span>📍 {contact_information.location}</span>}
          {contact_information?.linkedin && <span>in {contact_information.linkedin}</span>}
          {contact_information?.website && <span>🌐 {contact_information.website}</span>}
          {contact_information?.github && <span>⌥ {contact_information.github}</span>}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px 10px' }}>

        {/* Professional Summary */}
        {professional_summary && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Professional Summary
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <p style={{ ...BODY, borderLeft: '2px solid #3b82f6', paddingLeft: '7px', background: '#eff6ff', padding: '4px 7px', borderRadius: '0 3px 3px 0', lineHeight: '1.45' }}>
              {professional_summary}
            </p>
          </section>
        )}

        {/* Core Competencies */}
        {core_competencies && core_competencies.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Core Competencies
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 5px' }}>
              {core_competencies.map((comp, idx) => (
                <span key={idx} style={{ fontSize: '9.5pt', padding: '1px 8px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '9999px', color: '#1e40af', fontWeight: 600 }}>
                  {comp}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {professional_experience && professional_experience.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Professional Experience
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {professional_experience.map((exp, idx) => (
                <div key={idx} className="no-break" style={{ borderLeft: '2px solid #93c5fd', paddingLeft: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700, color: '#111827' }}>{exp.position}</h3>
                    <span style={{ fontSize: '8.5pt', color: 'white', background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', padding: '1px 7px', borderRadius: '9999px', whiteSpace: 'nowrap', marginLeft: '8px', flexShrink: 0 }}>
                      {[exp.start_date, exp.end_date].filter(Boolean).join(' – ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '10pt', color: '#1d4ed8', fontWeight: 600, marginBottom: '2px' }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  {exp.description && (() => {
                    const desc = exp.description.trim();
                    const isComplete = /[.!?'")\u201D]$/.test(desc);
                    return isComplete && <p style={{ fontSize: '10.5pt', color: '#4b5563', fontStyle: 'italic', marginBottom: '2px' }}>{desc}</p>;
                  })()}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
                      {exp.achievements.map((a, ai) => (
                        <li key={ai} style={{ fontSize: '10.5pt', color: '#374151', display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                          <span style={{ color: '#1d4ed8', marginRight: '5px', flexShrink: 0, fontWeight: 700, marginTop: '1px' }}>•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Education
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {education.map((edu, idx) => (
                <div key={idx} style={{ borderLeft: '2px solid #93c5fd', paddingLeft: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{edu.degree}</h3>
                    <span style={{ fontSize: '9.5pt', color: '#6b7280', marginLeft: '8px', flexShrink: 0 }}>{edu.graduation_date}</span>
                  </div>
                  <p style={{ fontSize: '10pt', color: '#1d4ed8', fontWeight: 600 }}>
                    {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
                  </p>
                  {edu.gpa && <p style={{ fontSize: '9.5pt', color: '#374151' }}>GPA: {edu.gpa}{edu.honors ? ` · ${edu.honors}` : ''}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Skills */}
        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Technical Skills
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {Object.entries(technical_skills).map(([category, skills], idx) => (
                skills && skills.length > 0 && (
                  <div key={idx} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '3px', padding: '3px 7px' }}>
                    <span style={{ fontSize: '9pt', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {category.replace(/_/g, ' ')}:{' '}
                    </span>
                    <span style={{ fontSize: '10pt', color: '#374151' }}>
                      {Array.isArray(skills) ? skills.join(' · ') : skills}
                    </span>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Certifications &amp; Licences
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', padding: '3px 6px', background: '#eff6ff', borderLeft: '2px solid #1d4ed8', borderRadius: '0 3px 3px 0' }}>
                  <span style={{ color: '#1d4ed8', flexShrink: 0, fontWeight: 700, fontSize: '10pt' }}>✓</span>
                  <div>
                    <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#111827', display: 'block' }}>{cert.name}</span>
                    <span style={{ ...SMALL }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</span>
                    {cert.credential_id && <span style={{ ...SMALL, display: 'block' }}>ID: {cert.credential_id}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#4338ca')}>
              <span style={{ width: '3px', height: '13px', background: '#4338ca', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Notable Projects
            </h2>
            <div style={DIVIDER('#4338ca')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {projects.map((proj, idx) => (
                <div key={idx} className="no-break" style={{ borderLeft: '2px solid #a5b4fc', paddingLeft: '7px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '5px' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{proj.title}</h3>
                  </div>
                  <p style={{ ...BODY, marginTop: '1px' }}>{proj.description}</p>
                  {proj.impact && <p style={{ fontSize: '10pt', color: '#374151' }}><strong>Impact:</strong> {proj.impact}</p>}
                  {proj.technologies && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
                      {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(', ')).map((t, ti) => (
                        <span key={ti} style={{ fontSize: '8.5pt', background: '#e0e7ff', color: '#3730a3', padding: '0 5px', borderRadius: '9999px', fontWeight: 500 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#b45309')}>
              <span style={{ width: '3px', height: '13px', background: '#b45309', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              Awards &amp; Recognition
            </h2>
            <div style={DIVIDER('#b45309')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {awards.map((award, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', padding: '3px 6px', background: '#fefce8', borderLeft: '2px solid #b45309', borderRadius: '0 3px 3px 0' }}>
                  <span style={{ color: '#b45309', flexShrink: 0, fontSize: '10pt' }}>★</span>
                  <div>
                    <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#111827', display: 'block' }}>{award.title}</span>
                    <span style={{ ...SMALL }}>{award.issuer}{award.date ? ` · ${award.date}` : ''}</span>
                    {award.description && <span style={{ fontSize: '9.5pt', color: '#374151', display: 'block' }}>{award.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {references && Array.isArray(references) && references.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={makeSectionHeading('#1d4ed8')}>
              <span style={{ width: '3px', height: '13px', background: '#1d4ed8', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              References
            </h2>
            <div style={DIVIDER('#1d4ed8')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
              {references.map((ref, idx) => (
                <div key={idx} style={{ padding: '5px 8px', background: '#eff6ff', borderLeft: '2px solid #1d4ed8', borderRadius: '0 3px 3px 0' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{ref.name}</h3>
                  {ref.position && <p style={{ fontSize: '10pt', color: '#1d4ed8', fontWeight: 600 }}>{ref.position}</p>}
                  {ref.company && <p style={{ fontSize: '10pt' }}>{ref.company}</p>}
                  {ref.email && <p style={{ ...SMALL }}>✉ {ref.email}</p>}
                  {ref.phone && <p style={{ ...SMALL }}>☎ {ref.phone}</p>}
                  {ref.relationship && <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>{ref.relationship}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ borderTop: '1px solid #e5e7eb', paddingTop: '4px', textAlign: 'center', marginTop: '6px' }}>
          <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>References available upon request</p>
        </footer>
      </div>
    </div>
  );
};

// ─── Creative Template ────────────────────────────────────────────────────────
export const CreativeTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, awards, references } = cvData;

  const accentColors = ['#7c3aed', '#db2777', '#ea580c', '#0369a1', '#059669', '#b45309'];
  const skillGrads = [
    'linear-gradient(135deg,#7c3aed,#db2777)',
    'linear-gradient(135deg,#2563eb,#06b6d4)',
    'linear-gradient(135deg,#059669,#14b8a6)',
    'linear-gradient(135deg,#ea580c,#ef4444)',
  ];

  const Accent = ({ idx = 0 }) => (
    <span style={{ width: '12px', height: '12px', background: `linear-gradient(135deg,${accentColors[idx % accentColors.length]},${accentColors[(idx + 1) % accentColors.length]})`, borderRadius: '3px', display: 'inline-block', flexShrink: 0 }} />
  );

  return (
    <div className="cv-creative max-w-4xl mx-auto bg-white" style={ROOT_STYLE}>
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          .cv-creative { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .cv-creative .no-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#7c3aed 0%,#db2777 55%,#ea580c 100%)', color: 'white', padding: '14px 20px 22px' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 900, marginBottom: '2px', letterSpacing: '-0.01em', fontFamily: "'Times New Roman', Times, serif" }}>
            {contact_information?.full_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ height: '2px', width: '20px', background: 'rgba(255,255,255,0.8)', borderRadius: '9999px' }} />
            <p style={{ fontSize: '11pt', fontWeight: 300, opacity: 0.95 }}>{contact_information?.professional_title}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px' }}>
            {contact_information?.email && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '9999px', fontSize: '9pt' }}>✉ {contact_information.email}</span>}
            {contact_information?.phone && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '9999px', fontSize: '9pt' }}>☎ {contact_information.phone}</span>}
            {contact_information?.location && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '9999px', fontSize: '9pt' }}>📍 {contact_information.location}</span>}
            {contact_information?.linkedin && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: '9999px', fontSize: '9pt' }}>in {contact_information.linkedin}</span>}
          </div>
        </div>
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }} viewBox="0 0 1200 22" preserveAspectRatio="none">
          <path d="M0,11 C300,22 900,0 1200,11 L1200,22 L0,22 Z" fill="white" />
        </svg>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px 10px' }}>

        {professional_summary && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#7c3aed'), marginBottom: '3px' }}><Accent idx={0} /> About Me</h2>
            <div style={DIVIDER('linear-gradient(90deg,#7c3aed,#db2777,transparent)')} />
            <p style={{ ...BODY, borderLeft: '2px solid #c084fc', paddingLeft: '7px', fontStyle: 'italic', lineHeight: '1.45' }}>
              "{professional_summary}"
            </p>
          </section>
        )}

        {core_competencies && core_competencies.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#db2777'), marginBottom: '3px' }}><Accent idx={1} /> Superpowers</h2>
            <div style={DIVIDER('linear-gradient(90deg,#db2777,#ea580c,transparent)')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 5px' }}>
              {core_competencies.map((comp, idx) => (
                <span key={idx} style={{ background: `linear-gradient(135deg,${accentColors[idx % accentColors.length]},${accentColors[(idx + 1) % accentColors.length]})`, color: 'white', padding: '1px 8px', borderRadius: '9999px', fontSize: '9.5pt', fontWeight: 700 }}>
                  {comp}
                </span>
              ))}
            </div>
          </section>
        )}

        {professional_experience && professional_experience.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#2563eb'), marginBottom: '3px' }}><Accent idx={2} /> Experience</h2>
            <div style={DIVIDER('linear-gradient(90deg,#2563eb,#7c3aed,transparent)')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '3px' }}>
              {professional_experience.map((exp, idx) => (
                <div key={idx} className="no-break" style={{ borderLeft: `2px solid ${accentColors[idx % accentColors.length]}`, paddingLeft: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700, color: '#111827' }}>{exp.position}</h3>
                    <span style={{ fontSize: '8.5pt', color: 'white', background: accentColors[idx % accentColors.length], padding: '1px 7px', borderRadius: '9999px', whiteSpace: 'nowrap', marginLeft: '8px', flexShrink: 0, fontWeight: 700 }}>
                      {[exp.start_date, exp.end_date].filter(Boolean).join(' – ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '10pt', color: accentColors[idx % accentColors.length], fontWeight: 700, marginBottom: '2px' }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  {exp.description && (() => {
                    const desc = exp.description.trim();
                    return /[.!?'")\u201D]$/.test(desc) && <p style={{ fontSize: '10.5pt', color: '#4b5563', fontStyle: 'italic', marginBottom: '2px' }}>{desc}</p>;
                  })()}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
                      {exp.achievements.map((a, ai) => (
                        <li key={ai} style={{ fontSize: '10.5pt', color: '#374151', display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                          <span style={{ marginRight: '5px', flexShrink: 0, fontSize: '10pt', marginTop: '1px' }}>▸</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education && education.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#059669'), marginBottom: '3px' }}><Accent idx={3} /> Education</h2>
            <div style={DIVIDER('linear-gradient(90deg,#059669,#0891b2,transparent)')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '3px' }}>
              {education.map((edu, idx) => (
                <div key={idx} style={{ background: 'linear-gradient(135deg,#ecfdf5,#eff6ff)', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '4px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{edu.degree}</h3>
                    <span style={{ fontSize: '8.5pt', color: 'white', background: 'linear-gradient(135deg,#059669,#0891b2)', padding: '1px 7px', borderRadius: '9999px', whiteSpace: 'nowrap', marginLeft: '8px', fontWeight: 700 }}>{edu.graduation_date}</span>
                  </div>
                  <p style={{ fontSize: '10pt', color: '#059669', fontWeight: 700 }}>{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</p>
                  {edu.gpa && <p style={{ fontSize: '9.5pt', color: '#374151' }}>GPA: {edu.gpa}{edu.honors ? ` · ${edu.honors}` : ''}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#ea580c'), marginBottom: '3px' }}><Accent idx={4} /> Skills</h2>
            <div style={DIVIDER('linear-gradient(90deg,#ea580c,#ca8a04,transparent)')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px', marginTop: '3px' }}>
              {Object.entries(technical_skills).map(([category, skills], idx) => (
                skills && skills.length > 0 && (
                  <div key={idx} style={{ background: skillGrads[idx % skillGrads.length], borderRadius: '4px', padding: '3px 8px' }}>
                    <span style={{ fontSize: '9pt', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '10pt', color: 'rgba(255,255,255,0.92)' }}>
                      {Array.isArray(skills) ? skills.join(' · ') : skills}
                    </span>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Certifications + Awards side by side */}
        {((certifications && certifications.length > 0) || (awards && awards.length > 0)) && (
          <div className="no-break" style={{ display: 'grid', gridTemplateColumns: certifications?.length && awards?.length ? '1fr 1fr' : '1fr', gap: '10px', ...SECTION_GAP }}>
            {certifications && certifications.length > 0 && (
              <section>
                <h2 style={{ ...makeSectionHeading('#dc2626'), marginBottom: '3px' }}><Accent idx={0} /> Certifications</h2>
                <div style={DIVIDER('linear-gradient(90deg,#dc2626,#db2777,transparent)')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '3px' }}>
                  {certifications.map((cert, idx) => (
                    <div key={idx} style={{ padding: '3px 6px', background: '#fff1f2', borderLeft: '2px solid #dc2626', borderRadius: '0 3px 3px 0' }}>
                      <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#111827', display: 'block' }}>{cert.name}</span>
                      <span style={{ ...SMALL }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {awards && awards.length > 0 && (
              <section>
                <h2 style={{ ...makeSectionHeading('#ca8a04'), marginBottom: '3px' }}><Accent idx={4} /> Awards</h2>
                <div style={DIVIDER('linear-gradient(90deg,#ca8a04,#ea580c,transparent)')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '3px' }}>
                  {awards.map((award, idx) => (
                    <div key={idx} style={{ padding: '3px 6px', background: '#fefce8', borderLeft: '2px solid #ca8a04', borderRadius: '0 3px 3px 0' }}>
                      <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#111827', display: 'block' }}>★ {award.title}</span>
                      <span style={{ ...SMALL }}>{award.issuer}{award.date ? ` · ${award.date}` : ''}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {projects && projects.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#4f46e5'), marginBottom: '3px' }}><Accent idx={2} /> Projects</h2>
            <div style={DIVIDER('linear-gradient(90deg,#4f46e5,#7c3aed,transparent)')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '3px' }}>
              {projects.map((proj, idx) => (
                <div key={idx} style={{ padding: '4px 7px', background: '#f5f3ff', borderLeft: '2px solid #4f46e5', borderRadius: '0 3px 3px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '5px' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{proj.title}</h3>
                  </div>
                  <p style={{ ...BODY, marginTop: '1px' }}>{proj.description}</p>
                  {proj.impact && <p style={{ fontSize: '10pt' }}><strong>Impact:</strong> {proj.impact}</p>}
                  {proj.technologies && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
                      {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(', ')).map((t, ti) => (
                        <span key={ti} style={{ fontSize: '8.5pt', background: '#e0e7ff', color: '#3730a3', padding: '0 5px', borderRadius: '9999px', fontWeight: 700 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {references && Array.isArray(references) && references.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading('#7c3aed'), marginBottom: '3px' }}><Accent idx={0} /> References</h2>
            <div style={DIVIDER('linear-gradient(90deg,#7c3aed,#db2777,transparent)')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', marginTop: '3px' }}>
              {references.map((ref, idx) => (
                <div key={idx} style={{ padding: '5px 8px', background: 'linear-gradient(135deg,#f5f3ff,#fdf2f8)', border: '1px solid #ddd6fe', borderRadius: '4px' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{ref.name}</h3>
                  {ref.position && <p style={{ fontSize: '10pt', color: '#7c3aed', fontWeight: 700 }}>{ref.position}</p>}
                  {ref.company && <p style={{ fontSize: '10pt' }}>{ref.company}</p>}
                  {ref.email && <p style={{ ...SMALL }}>✉ {ref.email}</p>}
                  {ref.phone && <p style={{ ...SMALL }}>☎ {ref.phone}</p>}
                  {ref.relationship && <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>{ref.relationship}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ borderTop: '1px solid #f3e8ff', paddingTop: '4px', textAlign: 'center', marginTop: '6px' }}>
          <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>✦ References available upon request ✦</p>
        </footer>
      </div>
    </div>
  );
};
// ─── Modern Template ─────────────────────────────────────────────────────────
export const ModernTemplate = ({ cvData }) => {
  const { contact_information, professional_summary, core_competencies, professional_experience, education, technical_skills, certifications, projects, awards, references } = cvData;

  const T = '#0d9488'; // teal-600
  const TB = '#0f766e'; // teal-700

  return (
    <div className="cv-modern max-w-4xl mx-auto bg-white" style={ROOT_STYLE}>
      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          .cv-modern { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .cv-modern .no-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: `linear-gradient(135deg, ${T}, #0891b2)`, color: 'white', padding: '14px 20px' }}>
        <h1 style={{ fontSize: '16pt', fontWeight: 700, marginBottom: '2px', letterSpacing: '-0.01em', fontFamily: "'Times New Roman', Times, serif" }}>
          {contact_information?.full_name}
        </h1>
        <p style={{ fontSize: '11pt', fontWeight: 300, marginBottom: '6px', opacity: 0.9 }}>{contact_information?.professional_title}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: '9pt', opacity: 0.88 }}>
          {contact_information?.email && <span>✉ {contact_information.email}</span>}
          {contact_information?.phone && <span>· ☎ {contact_information.phone}</span>}
          {contact_information?.location && <span>· 📍 {contact_information.location}</span>}
          {contact_information?.linkedin && <span>· in {contact_information.linkedin}</span>}
          {contact_information?.website && <span>· 🌐 {contact_information.website}</span>}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px 10px' }}>

        {professional_summary && (
          <section className="no-break" style={{ ...SECTION_GAP, background: '#f0fdfa', borderLeft: `3px solid ${T}`, padding: '5px 9px', borderRadius: '0 4px 4px 0' }}>
            <p style={{ ...BODY, lineHeight: '1.45' }}>{professional_summary}</p>
          </section>
        )}

        {core_competencies && core_competencies.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Core Competencies</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 5px', marginTop: '3px' }}>
              {core_competencies.map((comp, idx) => (
                <span key={idx} style={{ background: `linear-gradient(135deg, ${T}, #0891b2)`, color: 'white', padding: '1px 9px', borderRadius: '9999px', fontSize: '9.5pt', fontWeight: 600 }}>
                  {comp}
                </span>
              ))}
            </div>
          </section>
        )}

        {professional_experience && professional_experience.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Professional Experience</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {professional_experience.map((exp, idx) => (
                <div key={idx} className="no-break" style={{ borderLeft: `3px solid ${T}`, paddingLeft: '7px', background: '#f0fdfa', borderRadius: '0 3px 3px 0', padding: '4px 7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{exp.position}</h3>
                    <span style={{ fontSize: '8.5pt', background: '#ccfbf1', color: '#0f766e', padding: '1px 7px', borderRadius: '9999px', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', flexShrink: 0 }}>{[exp.start_date, exp.end_date].filter(Boolean).join(' – ')}</span>
                  </div>
                  <p style={{ fontSize: '10pt', color: T, fontWeight: 600, marginBottom: '2px' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                  {exp.description && (() => {
                    const desc = exp.description.trim();
                    return /[.!?'")\u201D]$/.test(desc) && <p style={{ fontSize: '10.5pt', color: '#4b5563', fontStyle: 'italic', marginBottom: '2px' }}>{desc}</p>;
                  })()}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
                      {exp.achievements.map((a, ai) => (
                        <li key={ai} style={{ fontSize: '10.5pt', color: '#374151', display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                          <span style={{ color: T, marginRight: '5px', flexShrink: 0, fontWeight: 700 }}>▸</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education && education.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Education</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {education.map((edu, idx) => (
                <div key={idx} style={{ borderLeft: `3px solid #0891b2`, paddingLeft: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{edu.degree}</h3>
                    <span style={{ fontSize: '9.5pt', color: '#6b7280', marginLeft: '8px', flexShrink: 0 }}>{edu.graduation_date}</span>
                  </div>
                  <p style={{ fontSize: '10pt', color: T, fontWeight: 600 }}>{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</p>
                  {edu.gpa && <p style={{ fontSize: '9.5pt', color: '#374151' }}>GPA: {edu.gpa}{edu.honors ? ` · ${edu.honors}` : ''}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {technical_skills && Object.keys(technical_skills).length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Technical Skills</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {Object.entries(technical_skills).map(([category, skills], idx) => (
                skills && skills.length > 0 && (
                  <div key={idx} style={{ background: '#f0fdfa', borderTop: `2px solid ${T}`, borderRadius: '0 0 3px 3px', padding: '3px 6px' }}>
                    <span style={{ fontSize: '9pt', fontWeight: 700, color: TB, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{category.replace(/_/g, ' ')}: </span>
                    <span style={{ fontSize: '10pt', color: '#374151' }}>{Array.isArray(skills) ? skills.join(', ') : skills}</span>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Certifications</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ color: T, flexShrink: 0, fontWeight: 700 }}>▸</span>
                  <span style={{ fontSize: '10.5pt' }}><strong>{cert.name}</strong> <span style={{ ...SMALL }}>— {cert.issuer}{cert.date ? ` (${cert.date})` : ''}</span></span>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects && projects.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid #0891b2`, marginBottom: '5px' }}>Projects</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {projects.map((proj, idx) => (
                <div key={idx} className="no-break" style={{ borderLeft: `3px solid #0891b2`, paddingLeft: '7px' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{proj.title}</h3>
                  <p style={{ ...BODY }}>{proj.description}</p>
                  {proj.impact && <p style={{ fontSize: '10pt' }}><strong>Impact:</strong> {proj.impact}</p>}
                  {proj.technologies && <p style={{ ...SMALL }}><strong>Tech:</strong> {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {awards && awards.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>Awards &amp; Recognition</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {awards.map((award, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '2px 6px', background: '#fefce8', borderLeft: '2px solid #b45309', borderRadius: '0 3px 3px 0' }}>
                  <span style={{ color: '#b45309', flexShrink: 0 }}>★</span>
                  <div>
                    <span style={{ fontSize: '10.5pt', fontWeight: 700, display: 'block' }}>{award.title}</span>
                    <span style={{ ...SMALL }}>{award.issuer}{award.date ? ` · ${award.date}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {references && Array.isArray(references) && references.length > 0 && (
          <section className="no-break" style={SECTION_GAP}>
            <h2 style={{ ...makeSectionHeading(TB), paddingBottom: '3px', borderBottom: `2px solid ${T}`, marginBottom: '5px' }}>References</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
              {references.map((ref, idx) => (
                <div key={idx} style={{ padding: '5px 8px', background: '#f0fdfa', borderLeft: `3px solid ${T}`, borderRadius: '0 3px 3px 0' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: 700 }}>{ref.name}</h3>
                  {ref.position && <p style={{ fontSize: '10pt', color: T, fontWeight: 600 }}>{ref.position}</p>}
                  {ref.company && <p style={{ fontSize: '10pt' }}>{ref.company}</p>}
                  {ref.email && <p style={{ ...SMALL }}>✉ {ref.email}</p>}
                  {ref.phone && <p style={{ ...SMALL }}>☎ {ref.phone}</p>}
                  {ref.relationship && <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>{ref.relationship}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ borderTop: '1px solid #d1fae5', paddingTop: '4px', textAlign: 'center', marginTop: '6px' }}>
          <p style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>References available upon request</p>
        </footer>
      </div>
    </div>
  );
};

// Export all templates
const CV_TEMPLATES = {
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  modern: ModernTemplate,
};

export default CV_TEMPLATES;
