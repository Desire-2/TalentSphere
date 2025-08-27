import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Edit, 
  Share2, 
  ExternalLink, 
  Copy, 
  BarChart3, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star,
  TrendingUp,
  Download,
  Mail,
  Phone,
  Globe,
  Building,
  FileText,
  Tag,
  Award,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import apiService from '../../services/api';

const JobViewModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  onEdit, 
  onToggleStatus, 
  onDuplicate, 
  onPromote 
}) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
      fetchJobApplications();
      fetchJobAnalytics();
    }
  }, [isOpen, jobId]);

  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getJob(jobId);
      setJob(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async () => {
    try {
      const response = await apiService.getJobApplications(jobId, { per_page: 5 });
      setApplications(response.applications || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchJobAnalytics = async () => {
    try {
      const response = await apiService.getJobAnalytics(jobId);
      setAnalytics(response);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Job URL copied to clipboard!');
  };

  const handleViewOnSite = () => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const formatSalary = (job) => {
    if (!job) return 'Not specified';
    
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    
    if (job.salary_min) {
      return `From $${job.salary_min.toLocaleString()}`;
    }
    
    if (job.salary_max) {
      return `Up to $${job.salary_max.toLocaleString()}`;
    }
    
    return 'Salary not specified';
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {loading ? 'Loading...' : job?.title || 'Job Details'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {job?.company?.name || 'Company Name'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {job && (
                  <>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    
                    <button
                      onClick={handleShare}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Share Job"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={handleViewOnSite}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="View on Site"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => onEdit(jobId)}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Edit Job"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading job details</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'details', name: 'Job Details', icon: FileText },
                { id: 'applications', name: 'Applications', icon: Users },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : job ? (
              <>
                {/* Job Details Tab */}
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Eye className="h-6 w-6 text-blue-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-600">Views</p>
                            <p className="text-lg font-bold text-blue-900">{job.view_count || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-6 w-6 text-green-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-600">Applications</p>
                            <p className="text-lg font-bold text-green-900">{job.application_count || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-purple-600">Conversion</p>
                            <p className="text-lg font-bold text-purple-900">
                              {job.view_count > 0 ? ((job.application_count / job.view_count) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Star className="h-6 w-6 text-yellow-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-600">Featured</p>
                            <p className="text-lg font-bold text-yellow-900">
                              {job.is_featured ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Job Information</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Location</p>
                              <p className="text-sm text-gray-600">
                                {job.is_remote ? 'Remote' : `${job.city}, ${job.state}, ${job.country}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Employment Type</p>
                              <p className="text-sm text-gray-600">{job.employment_type || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Salary</p>
                              <p className="text-sm text-gray-600">{formatSalary(job)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Posted</p>
                              <p className="text-sm text-gray-600">
                                {new Date(job.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Company Information</h4>
                        
                        {job.company && (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Building className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Company</p>
                                <p className="text-sm text-gray-600">{job.company.name}</p>
                              </div>
                            </div>
                            
                            {job.company.website && (
                              <div className="flex items-center space-x-3">
                                <Globe className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Website</p>
                                  <a 
                                    href={job.company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    {job.company.website}
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {job.company.size && (
                              <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Company Size</p>
                                  <p className="text-sm text-gray-600">{job.company.size}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Job Description */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Job Description</h4>
                      <div 
                        className="prose max-w-none text-sm text-gray-600"
                        dangerouslySetInnerHTML={{ __html: job.description || 'No description available' }}
                      />
                    </div>

                    {/* Requirements */}
                    {job.requirements && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Requirements</h4>
                        <div 
                          className="prose max-w-none text-sm text-gray-600"
                          dangerouslySetInnerHTML={{ __html: job.requirements }}
                        />
                      </div>
                    )}

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-gray-900">Recent Applications</h4>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View All Applications
                      </button>
                    </div>
                    
                    {applications.length > 0 ? (
                      <div className="space-y-4">
                        {applications.map((application) => (
                          <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {application.user?.first_name} {application.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Applied {new Date(application.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {application.status}
                              </span>
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No applications yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-6">Job Performance Analytics</h4>
                    
                    {analytics ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Add analytics charts and data here */}
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Analytics coming soon</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No analytics data available</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer Actions */}
          {job && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => onToggleStatus(jobId)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                    job.status === 'published'
                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {job.status === 'published' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Job
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Publish Job
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => onDuplicate(jobId)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </button>
                
                <button
                  onClick={() => onPromote(jobId)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  disabled={job.is_featured}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {job.is_featured ? 'Featured' : 'Promote'}
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                
                <button
                  onClick={() => onEdit(jobId)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobViewModal;
