import { careerAgentService } from '../../services/careerAgentService';

export default function ApplicationResumeLink({
  application,
  mode = 'view',
  children,
  className = '',
  fallbackLabel = 'View resume',
}) {
  const isCareerDocument = careerAgentService.isCareerAgentResume(application);
  const documentId = application?.career_documents?.cv_document_id
    || String(application?.resume_url || '').match(/\/documents\/(\d+)/)?.[1];
  const href = isCareerDocument
    ? `/api/career-agent/documents/${documentId}/download?format=pdf`
    : application.resume_url;

  const handleClick = async (event) => {
    if (!isCareerDocument) return;
    event.preventDefault();
    try {
      if (mode === 'download') {
        await careerAgentService.downloadApplicationResume(application);
      } else {
        await careerAgentService.viewApplicationResume(application);
      }
    } catch (error) {
      console.error('Resume download failed:', error);
      window.alert(error.message || 'The resume could not be opened.');
    }
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      target={isCareerDocument ? undefined : '_blank'}
      rel={isCareerDocument ? undefined : 'noopener noreferrer'}
      aria-label={fallbackLabel}
    >
      {children || fallbackLabel}
    </a>
  );
}
