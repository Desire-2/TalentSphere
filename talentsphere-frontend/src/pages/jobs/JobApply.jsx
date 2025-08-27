import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';

const JobApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    resume_url: '',
    portfolio_url: '',
    additional_documents: ''
  });

  // Fetch job details and check if already applied
  useEffect(() => {
    const fetchJobAndCheckApplication = async () => {
      try {
        setLoading(true);
        
        // Fetch job details
        const jobData = await apiService.getJob(id);
        setJob(jobData);
        console.log('📋 Job loaded for application:', jobData);
        
        // Check if user has already applied
        const applicationStatus = await apiService.checkApplicationStatus(id);
        if (applicationStatus) {
          setExistingApplication(applicationStatus);
          console.log('📝 Existing application found:', applicationStatus);
        }
        
      } catch (err) {
        console.error('❌ Error loading job or checking application:', err);
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobAndCheckApplication();
    }
  }, [id]);

  const handleInputChange = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      // Double-check if user has already applied (in case status changed after page load)
      try {
        const currentApplicationStatus = await apiService.checkApplicationStatus(id);
        if (currentApplicationStatus) {
          setError('You have already applied to this job! Redirecting to your applications...');
          setTimeout(() => {
            navigate('/my-applications');
          }, 2000);
          return;
        }
      } catch (err) {
        console.warn('Could not double-check application status:', err);
      }
      
      // Basic validation
      if (!applicationData.cover_letter.trim()) {
        setError('Cover letter is required.');
        return;
      }
      
      if (!applicationData.resume_url.trim()) {
        setError('Resume URL is required.');
        return;
      }
      
      // Validate URLs
      try {
        new URL(applicationData.resume_url);
        if (applicationData.portfolio_url) {
          new URL(applicationData.portfolio_url);
        }
      } catch {
        setError('Please provide valid URLs for resume and portfolio.');
        return;
      }
      
      console.log('📤 Submitting application:', {
        job_id: id,
        ...applicationData,
        user_id: user?.id
      });
      
      // Submit application via API
      const response = await apiService.applyForJob(id, applicationData);
      
      console.log('✅ Application submitted successfully:', response);
      
      // Show success message and redirect
      alert('🎉 Application submitted successfully! You can track your application in "My Applications".');
      navigate('/my-applications');
      
    } catch (err) {
      console.error('❌ Error submitting application:', err);
      
      // Handle specific error cases based on error message since API service throws Error objects
      const errorMessage = err.message || err.toString();
      console.log('🔍 Extracted error message:', errorMessage);
      
      let displayError = '';
      if (errorMessage.includes('already applied') || errorMessage.includes('409')) {
        displayError = '❌ You have already applied to this job! Check your application status in "My Applications".';
      } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
        displayError = 'Please check your application details and try again.';
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        displayError = 'Job not found or no longer available.';
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        displayError = 'Please log in to submit an application.';
      } else if (errorMessage.includes('Cannot connect to server')) {
        displayError = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        displayError = `Failed to submit application: ${errorMessage}`;
      }
      
      console.log('📢 Setting error message:', displayError);
      setError(displayError);
      
      // Also show an alert as backup
      alert(displayError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Job</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  // If user has already applied, show application status
  if (existingApplication) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(`/jobs/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="mr-2">←</span>
            Back to Job Details
          </button>
        </div>

        {/* Application Status Card */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 font-bold text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-amber-900 mb-2">
                ❌ You Have Already Applied to This Job
              </h1>
              <p className="text-amber-800 mb-4">
                You submitted an application for this position on {new Date(existingApplication.created_at).toLocaleDateString()}. 
                You cannot submit another application for the same job.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <strong className="text-amber-900">Application Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    existingApplication.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    existingApplication.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                    existingApplication.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                    existingApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {existingApplication.status_display || existingApplication.status}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <strong className="text-amber-900">Application ID:</strong> #{existingApplication.id}
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => navigate('/my-applications')}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 font-medium"
                >
                  📋 View My Applications
                </button>
                <button 
                  onClick={() => navigate('/jobs')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
                >
                  🔍 Browse More Jobs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Job Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-bold">💼</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{job?.title || 'Job Title'}</h2>
              <p className="text-gray-600 mb-4">{job?.company?.name || 'Company Name'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                <div>📍 {job?.location?.is_remote ? 'Remote' : (job?.location?.display || job?.location?.city || 'Location not specified')}</div>
                <div>💼 {job?.employment_type || 'Full-time'}</div>
                <div>💰 {job?.salary_range || 'Salary not disclosed'}</div>
                <div>⏰ Posted recently</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/jobs/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span>
          Back to Job Details
        </button>
      </div>

      {/* Job Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold">📋</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job?.title || 'Job Title'}</h1>
            <p className="text-gray-600 mb-4">{job?.company?.name || 'Company Name'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
              <div>📍 {job?.location?.is_remote ? 'Remote' : (job?.location?.display || job?.location?.city || 'Location not specified')}</div>
              <div>💼 {job?.employment_type || 'Full-time'}</div>
              <div>💰 {job?.salary_range || 'Salary not disclosed'}</div>
              <div>⏰ Posted recently</div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Apply for this Position</h2>
        <p className="text-gray-600 mb-6">
          Fill out the form below to submit your application. Fields marked with * are required.
        </p>
        
        {/* Debug: Show current error state */}
        {console.log('🐛 Current error state:', error)}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-red-800 font-bold text-lg mb-2">Application Error</h3>
                <p className="text-red-700">{error}</p>
                {error.includes('already applied') && (
                  <div className="mt-3 flex space-x-2">
                    <button 
                      onClick={() => navigate('/my-applications')}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      View My Applications
                    </button>
                    <button 
                      onClick={() => navigate('/jobs')}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                    >
                      Browse More Jobs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div>
            <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              id="cover_letter"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us why you're interested in this role and what makes you a great fit..."
              value={applicationData.cover_letter}
              onChange={(e) => handleInputChange('cover_letter', e.target.value)}
              required
            />
          </div>

          {/* Resume URL */}
          <div>
            <label htmlFor="resume_url" className="block text-sm font-medium text-gray-700 mb-2">
              Resume/CV Link *
            </label>
            <input
              id="resume_url"
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/your-resume.pdf"
              value={applicationData.resume_url}
              onChange={(e) => handleInputChange('resume_url', e.target.value)}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Please provide a link to your resume (Google Drive, Dropbox, personal website, etc.)
            </p>
          </div>

          {/* Portfolio URL */}
          <div>
            <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Link (Optional)
            </label>
            <input
              id="portfolio_url"
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://yourportfolio.com"
              value={applicationData.portfolio_url}
              onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Link to your portfolio, GitHub, or relevant work samples
            </p>
          </div>

          {/* Additional Documents */}
          <div>
            <label htmlFor="additional_documents" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Documents (Optional)
            </label>
            <textarea
              id="additional_documents"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Links to any additional documents, certifications, or references..."
              value={applicationData.additional_documents}
              onChange={(e) => handleInputChange('additional_documents', e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <button 
              type="button"
              onClick={() => navigate(`/jobs/${id}`)}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApply;
