import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Clock, 
  FileText, 
  Link2, 
  Github, 
  Linkedin, 
  Save, 
  Edit, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Award,
  Target,
  Settings,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react';

const JobSeekerProfile = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form states
  const [personalData, setPersonalData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    location: '',
    profile_picture: ''
  });
  
  const [professionalData, setProfessionalData] = useState({
    desired_position: '',
    years_of_experience: 0,
    education_level: '',
    skills: '',
    certifications: '',
    resume_url: '',
    portfolio_url: '',
    linkedin_url: '',
    github_url: ''
  });
  
  const [preferencesData, setPreferencesData] = useState({
    preferred_location: '',
    job_type_preference: '',
    desired_salary_min: '',
    desired_salary_max: '',
    availability: '',
    open_to_opportunities: true,
    profile_visibility: 'public'
  });

  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'job_seeker') {
      navigate('/dashboard');
      return;
    }
    
    loadProfile();
  }, [isAuthenticated, user, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setProfile(response);
      
      // Set personal data
      setPersonalData({
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        phone: response.phone || '',
        bio: response.bio || '',
        location: response.location || '',
        profile_picture: response.profile_picture || ''
      });
      
      // Set professional data
      const jobSeekerProfile = response.job_seeker_profile || {};
      setProfessionalData({
        desired_position: jobSeekerProfile.desired_position || '',
        years_of_experience: jobSeekerProfile.years_of_experience || 0,
        education_level: jobSeekerProfile.education_level || '',
        skills: jobSeekerProfile.skills || '',
        certifications: jobSeekerProfile.certifications || '',
        resume_url: jobSeekerProfile.resume_url || '',
        portfolio_url: jobSeekerProfile.portfolio_url || '',
        linkedin_url: jobSeekerProfile.linkedin_url || '',
        github_url: jobSeekerProfile.github_url || ''
      });
      
      // Set preferences data
      setPreferencesData({
        preferred_location: jobSeekerProfile.preferred_location || '',
        job_type_preference: jobSeekerProfile.job_type_preference || '',
        desired_salary_min: jobSeekerProfile.desired_salary_min || '',
        desired_salary_max: jobSeekerProfile.desired_salary_max || '',
        availability: jobSeekerProfile.availability || '',
        open_to_opportunities: jobSeekerProfile.open_to_opportunities !== false,
        profile_visibility: jobSeekerProfile.profile_visibility || 'public'
      });
      
      // Parse skills
      if (jobSeekerProfile.skills) {
        try {
          const parsed = typeof jobSeekerProfile.skills === 'string' 
            ? JSON.parse(jobSeekerProfile.skills) 
            : jobSeekerProfile.skills;
          setSkillsList(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setSkillsList(jobSeekerProfile.skills.split(',').map(s => s.trim()).filter(s => s));
        }
      }
      
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    const allFields = [
      personalData.first_name,
      personalData.last_name,
      personalData.phone,
      personalData.bio,
      personalData.location,
      professionalData.desired_position,
      professionalData.years_of_experience,
      professionalData.education_level,
      skillsList.length > 0 ? 'skills' : '',
      professionalData.resume_url,
      preferencesData.preferred_location,
      preferencesData.job_type_preference
    ];
    
    const completedFields = allFields.filter(field => field && field !== '').length;
    return Math.round((completedFields / allFields.length) * 100);
  };

  const handlePersonalDataChange = (field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfessionalDataChange = (field, value) => {
    setProfessionalData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferencesDataChange = (field, value) => {
    setPreferencesData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
      setSkillsList(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        ...personalData,
        skills: JSON.stringify(skillsList),
        ...professionalData,
        ...preferencesData
      };
      
      await apiService.updateProfile(updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      loadProfile();
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Job Seeker Profile</h1>
            <p className="text-muted-foreground">Manage your professional profile and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Profile Completion */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={personalData.profile_picture} alt="Profile" />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {getInitials(personalData.first_name, personalData.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {personalData.first_name} {personalData.last_name}
                </h3>
                <p className="text-gray-600">{professionalData.desired_position || 'Professional'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    className={`${getCompletionColor(profileCompletion)} font-semibold`}
                  >
                    {profileCompletion}% Complete
                  </Badge>
                  {preferencesData.open_to_opportunities && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Open to Work
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
              </div>
              <Progress value={profileCompletion} className="w-48 h-3" />
              <p className="text-xs text-gray-500 mt-1">
                {profileCompletion < 80 ? 'Complete your profile to get more opportunities' : 'Great! Your profile is well-optimized'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="preferences">Job Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Settings</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic profile information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={personalData.first_name}
                    onChange={(e) => handlePersonalDataChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={personalData.last_name}
                    onChange={(e) => handlePersonalDataChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalData.phone}
                    onChange={(e) => handlePersonalDataChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={personalData.location}
                    onChange={(e) => handlePersonalDataChange('location', e.target.value)}
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={personalData.bio}
                  onChange={(e) => handlePersonalDataChange('bio', e.target.value)}
                  placeholder="Write a brief professional summary about yourself..."
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {personalData.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional Information
              </CardTitle>
              <CardDescription>
                Your work experience, skills, and professional background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="desired_position">Desired Position *</Label>
                  <Input
                    id="desired_position"
                    value={professionalData.desired_position}
                    onChange={(e) => handleProfessionalDataChange('desired_position', e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    value={professionalData.years_of_experience}
                    onChange={(e) => handleProfessionalDataChange('years_of_experience', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level</Label>
                  <Select
                    value={professionalData.education_level}
                    onValueChange={(value) => handleProfessionalDataChange('education_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="associate">Associate Degree</SelectItem>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">Ph.D.</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    value={professionalData.certifications}
                    onChange={(e) => handleProfessionalDataChange('certifications', e.target.value)}
                    placeholder="e.g., AWS Certified, Google Analytics"
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-4">
                <Label>Skills *</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {skillsList.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Professional Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="resume_url" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Resume URL
                    </Label>
                    <Input
                      id="resume_url"
                      value={professionalData.resume_url}
                      onChange={(e) => handleProfessionalDataChange('resume_url', e.target.value)}
                      placeholder="Link to your resume"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url" className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Portfolio URL
                    </Label>
                    <Input
                      id="portfolio_url"
                      value={professionalData.portfolio_url}
                      onChange={(e) => handleProfessionalDataChange('portfolio_url', e.target.value)}
                      placeholder="Link to your portfolio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile
                    </Label>
                    <Input
                      id="linkedin_url"
                      value={professionalData.linkedin_url}
                      onChange={(e) => handleProfessionalDataChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_url" className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Profile
                    </Label>
                    <Input
                      id="github_url"
                      value={professionalData.github_url}
                      onChange={(e) => handleProfessionalDataChange('github_url', e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Job Preferences
              </CardTitle>
              <CardDescription>
                Set your job search preferences and salary expectations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="preferred_location">Preferred Location</Label>
                  <Input
                    id="preferred_location"
                    value={preferencesData.preferred_location}
                    onChange={(e) => handlePreferencesDataChange('preferred_location', e.target.value)}
                    placeholder="e.g., San Francisco, Remote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type_preference">Job Type</Label>
                  <Select
                    value={preferencesData.job_type_preference}
                    onValueChange={(value) => handlePreferencesDataChange('job_type_preference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desired_salary_min">Minimum Salary ($)</Label>
                  <Input
                    id="desired_salary_min"
                    type="number"
                    min="0"
                    value={preferencesData.desired_salary_min}
                    onChange={(e) => handlePreferencesDataChange('desired_salary_min', e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desired_salary_max">Maximum Salary ($)</Label>
                  <Input
                    id="desired_salary_max"
                    type="number"
                    min="0"
                    value={preferencesData.desired_salary_max}
                    onChange={(e) => handlePreferencesDataChange('desired_salary_max', e.target.value)}
                    placeholder="100000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={preferencesData.availability}
                    onValueChange={(value) => handlePreferencesDataChange('availability', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="When can you start?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediately</SelectItem>
                      <SelectItem value="2_weeks">2 weeks notice</SelectItem>
                      <SelectItem value="1_month">1 month</SelectItem>
                      <SelectItem value="2_months">2 months</SelectItem>
                      <SelectItem value="3_months">3+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Open to Opportunities</Label>
                    <p className="text-sm text-gray-500">
                      Let employers know you're actively looking for work
                    </p>
                  </div>
                  <Switch
                    checked={preferencesData.open_to_opportunities}
                    onCheckedChange={(checked) => handlePreferencesDataChange('open_to_opportunities', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Settings Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Privacy & Settings
              </CardTitle>
              <CardDescription>
                Control who can see your profile and how you're contacted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select
                    value={preferencesData.profile_visibility}
                    onValueChange={(value) => handlePreferencesDataChange('profile_visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Public - Everyone can see your profile
                        </div>
                      </SelectItem>
                      <SelectItem value="employers_only">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Employers Only - Only verified employers can see
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <EyeOff className="w-4 h-4" />
                          Private - Hidden from searches
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {preferencesData.profile_visibility === 'public' && 
                      'Your profile will be visible in search results and to all users'}
                    {preferencesData.profile_visibility === 'employers_only' && 
                      'Only verified employers and recruiters can see your profile'}
                    {preferencesData.profile_visibility === 'private' && 
                      'Your profile will be hidden from all searches and users'}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Actions</h3>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Download Profile Data</h4>
                      <p className="text-sm text-gray-500">
                        Get a copy of all your profile information
                      </p>
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Public Profile URL</h4>
                      <p className="text-sm text-gray-500">
                        Share your professional profile with others
                      </p>
                    </div>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Public Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobSeekerProfile;
