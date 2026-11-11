import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { useCareerStudio } from './CareerStudioProvider';
import { SectionLabel, TemplateMini } from './ui';

/** Live catalog from GET /api/career-agent/templates — the same registry the
 *  generation API validates against. */
export function TemplatesGallery() {
  const { templates } = useCareerStudio();

  return (
    <div className="cs-page">
      <header className="cs-page-head">
        <div>
          <SectionLabel>Templates</SectionLabel>
          <h1>Document designs</h1>
          <p>Pick a design when you prepare a package. Every design renders both your CV and your cover letter.</p>
        </div>
        <div className="cs-page-head-actions">
          <Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/new"><ArrowRight size={15} /> Start a package</Link>
        </div>
      </header>

      <div className="cs-notice-strip">
        <CheckCircle2 size={16} />
        <span>Each package includes a tailored CV and a cover letter, written from the same evidence.</span>
      </div>

      <div className="cs-template-gallery">
        {templates.map((item) => (
          <article key={item.key} className="cs-gallery-card">
            <TemplateMini templateKey={item.key} className="cs-template-mini--gallery" />
            <div className="cs-gallery-copy">
              <div className="cs-gallery-title">
                <h2>{item.label}</h2>
                {item.grayscale && <span className="cs-tag">Grayscale</span>}
              </div>
              <p>{item.description || item.hint}</p>
            </div>
            <div className="cs-gallery-actions">
              <Link className="cs-btn cs-btn--quiet" to={`/jobseeker/career-agent/new?source=general&template=${item.key}`}>
                <FileText size={14} /> Use for general
              </Link>
              <Link className="cs-btn cs-btn--primary" to={`/jobseeker/career-agent/new?source=platform&template=${item.key}`}>
                Use this design <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default TemplatesGallery;
