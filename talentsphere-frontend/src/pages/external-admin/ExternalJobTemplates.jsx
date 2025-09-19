import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  FileText, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  MoreHorizontal,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Star,
  Settings
} from 'lucide-react';
import { externalAdminService } from '../../services/externalAdmin';
import { toast } from 'sonner';

const ExternalJobTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category_id: '',
    title: '',
    summary: '',
    job_description: '',
    requirements: '',
    preferred_skills: '',
    employment_type: 'full-time',
    experience_level: 'mid',
    location_type: 'remote',
    location_city: '',
    location_state: '',
    location_country: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    salary_period: 'yearly',
    application_type: 'external',
    application_url: '',
    application_email: '',
    application_instructions: '',
    is_active: true,
    tags: []
  });

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  // Refetch templates when search criteria change
  useEffect(() => {
    fetchTemplates();
  }, [searchTerm, selectedCategory]);

  // Create sample templates if none exist
  const createSampleTemplates = async () => {
    const sampleTemplates = [
      {
        name: 'Software Engineer Template',
        description: 'Standard template for software engineering positions',
        category_id: '1',
        title: 'Senior Software Engineer',
        summary: 'We are looking for an experienced software engineer to join our dynamic development team.',
        job_description: 'As a Senior Software Engineer, you will be responsible for designing, developing, and maintaining high-quality software applications. You will work closely with cross-functional teams to deliver innovative solutions that meet our business objectives.',
        requirements: '• Bachelor\'s degree in Computer Science or related field\n• 5+ years of experience in software development\n• Proficiency in modern programming languages\n• Experience with agile development methodologies',
        preferred_skills: '• Experience with cloud platforms (AWS, Azure)\n• Knowledge of containerization (Docker, Kubernetes)\n• Familiarity with CI/CD pipelines',
        employment_type: 'full-time',
        experience_level: 'senior',
        location_type: 'hybrid',
        salary_min: '90000',
        salary_max: '130000',
        salary_currency: 'USD',
        salary_period: 'yearly',
        application_type: 'external',
        application_url: 'https://company.com/careers/apply',
        is_active: true,
        tags: ['React', 'Node.js', 'JavaScript', 'MongoDB']
      },
      {
        name: 'Marketing Manager Template',
        description: 'Template for marketing management roles',
        category_id: '2',
        title: 'Digital Marketing Manager',
        summary: 'Join our marketing team as a Digital Marketing Manager to lead our online marketing efforts.',
        job_description: 'We are seeking a results-driven Digital Marketing Manager to develop and execute comprehensive digital marketing strategies. You will manage multiple channels and campaigns to drive brand awareness and customer acquisition.',
        requirements: '• Bachelor\'s degree in Marketing, Business, or related field\n• 3+ years of digital marketing experience\n• Proficiency in marketing analytics tools\n• Strong project management skills',
        preferred_skills: '• Experience with marketing automation platforms\n• Knowledge of SEO/SEM best practices\n• Familiarity with social media advertising',
        employment_type: 'full-time',
        experience_level: 'mid',
        location_type: 'remote',
        salary_min: '70000',
        salary_max: '95000',
        salary_currency: 'USD',
        salary_period: 'yearly',
        application_type: 'email',
        application_email: 'jobs@company.com',
        is_active: true,
        tags: ['Digital Marketing', 'SEO', 'SEM', 'Analytics']
      }
    ];

    try {
      for (const template of sampleTemplates) {
        await externalAdminService.createJobTemplate(template);
      }
      toast.success('Sample templates created successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error creating sample templates:', error);
    }
  };

  const fetchTemplates = async (params = {}) => {
    try {
      setLoading(true);
      // Add search and category filters to params
      const searchParams = {
        ...params,
        search: searchTerm,
        category_id: selectedCategory
      };
      const response = await externalAdminService.getJobTemplates(searchParams);
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await externalAdminService.getJobCategories();
      
      // Default categories to use as fallback
      const defaultCategories = [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Marketing' },
        { id: 3, name: 'Sales' },
        { id: 4, name: 'Customer Service' },
        { id: 5, name: 'Finance' },
        { id: 6, name: 'Human Resources' },
        { id: 7, name: 'Operations' },
        { id: 8, name: 'Design' }
      ];
      
      // Use API response if available and non-empty, otherwise use defaults
      let categories = defaultCategories;
      if (response && Array.isArray(response) && response.length > 0) {
        categories = response;
      } else if (response && response.categories && Array.isArray(response.categories) && response.categories.length > 0) {
        categories = response.categories;
      }
      
      setCategories(categories);
      
      // Store categories in localStorage for template creation
      localStorage.setItem('jobCategories', JSON.stringify(categories));
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories
      const defaultCategories = [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Marketing' },
        { id: 3, name: 'Sales' },
        { id: 4, name: 'Customer Service' },
        { id: 5, name: 'Finance' },
        { id: 6, name: 'Human Resources' },
        { id: 7, name: 'Operations' },
        { id: 8, name: 'Design' }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('jobCategories', JSON.stringify(defaultCategories));
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await externalAdminService.createJobTemplate(templateForm);
      toast.success('Template created successfully');
      setIsCreateDialogOpen(false);
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleEditTemplate = async () => {
    try {
      await externalAdminService.updateJobTemplate(selectedTemplate.id, templateForm);
      toast.success('Template updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await externalAdminService.deleteJobTemplate(templateId);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      await externalAdminService.duplicateJobTemplate(template.id);
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      category_id: template.category_id || '',
      title: template.title || '',
      summary: template.summary || '',
      job_description: template.job_description || '',
      requirements: template.requirements || '',
      preferred_skills: template.preferred_skills || '',
      employment_type: template.employment_type || 'full-time',
      experience_level: template.experience_level || 'mid',
      location_type: template.location_type || 'remote',
      location_city: template.location_city || '',
      location_state: template.location_state || '',
      location_country: template.location_country || '',
      salary_min: template.salary_min || '',
      salary_max: template.salary_max || '',
      salary_currency: template.salary_currency || 'USD',
      salary_period: template.salary_period || 'yearly',
      application_type: template.application_type || 'external',
      application_url: template.application_url || '',
      application_email: template.application_email || '',
      application_instructions: template.application_instructions || '',
      is_active: template.is_active !== undefined ? template.is_active : true,
      tags: template.tags || []
    });
    setIsEditDialogOpen(true);
  };

  const handleExportTemplates = async () => {
    try {
      const response = await externalAdminService.exportJobTemplates();
      
      // Create and download file with full export format
      const exportData = {
        templates: response.templates || [],
        total_count: response.total_count || response.templates?.length || 0,
        exported_at: response.exported_at || new Date().toISOString(),
        exported_by: response.exported_by || { name: 'Current User' }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job_templates_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Successfully exported ${exportData.total_count} templates`);
    } catch (error) {
      console.error('Error exporting templates:', error);
      toast.error('Failed to export templates');
    }
  };

  const handleImportTemplates = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const parsedData = JSON.parse(fileContent);
      
      // Handle different export formats
      let templatesArray;
      if (Array.isArray(parsedData)) {
        // Direct array of templates
        templatesArray = parsedData;
      } else if (parsedData.templates && Array.isArray(parsedData.templates)) {
        // Object with templates property (our export format)
        templatesArray = parsedData.templates;
      } else {
        throw new Error('Invalid file format. Expected array of templates or object with templates property.');
      }
      
      // Send to backend
      const response = await externalAdminService.importJobTemplates({ templates: templatesArray });
      
      if (response.total_imported > 0) {
        toast.success(`Successfully imported ${response.total_imported} templates`);
        if (response.total_failed > 0) {
          toast.warning(`${response.total_failed} templates failed to import`);
        }
      } else {
        toast.warning('No templates were imported');
      }
      
      fetchTemplates();
      setIsImportDialogOpen(false);
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      console.error('Error importing templates:', error);
      toast.error(`Failed to import templates: ${error.message}`);
      // Reset file input
      event.target.value = '';
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category_id: '',
      title: '',
      summary: '',
      job_description: '',
      requirements: '',
      preferred_skills: '',
      employment_type: 'full-time',
      experience_level: 'mid',
      location_type: 'remote',
      location_city: '',
      location_state: '',
      location_country: '',
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      salary_period: 'yearly',
      application_type: 'external',
      application_url: '',
      application_email: '',
      application_instructions: '',
      is_active: true,
      tags: []
    });
  };

  // Templates are already filtered in the service layer
  const filteredTemplates = templates;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Job Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage reusable job posting templates
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportTemplates}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Templates</DialogTitle>
                <DialogDescription>
                  Upload a JSON file containing job templates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplates}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Job Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for job postings
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="application">Application</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Senior Developer Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={templateForm.category_id}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Template Description</Label>
                    <Textarea
                      id="description"
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="summary">Job Summary</Label>
                    <Textarea
                      id="summary"
                      value={templateForm.summary}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief summary of the role"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_description">Job Description</Label>
                    <Textarea
                      id="job_description"
                      value={templateForm.job_description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, job_description: e.target.value }))}
                      placeholder="Detailed job description"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={templateForm.requirements}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder="Required skills and qualifications"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred_skills">Preferred Skills</Label>
                    <Textarea
                      id="preferred_skills"
                      value={templateForm.preferred_skills}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, preferred_skills: e.target.value }))}
                      placeholder="Nice-to-have skills"
                      rows={2}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={templateForm.employment_type}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, employment_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <Select
                        value={templateForm.experience_level}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, experience_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary_min">Min Salary</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={templateForm.salary_min}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, salary_min: e.target.value }))}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_max">Max Salary</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={templateForm.salary_max}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, salary_max: e.target.value }))}
                        placeholder="80000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_currency">Currency</Label>
                      <Select
                        value={templateForm.salary_currency}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, salary_currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="RWF">RWF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="application" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="application_type">Application Type</Label>
                    <Select
                      value={templateForm.application_type}
                      onValueChange={(value) => setTemplateForm(prev => ({ ...prev, application_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">External URL</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {templateForm.application_type === 'external' && (
                    <div className="space-y-2">
                      <Label htmlFor="application_url">Application URL</Label>
                      <Input
                        id="application_url"
                        value={templateForm.application_url}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, application_url: e.target.value }))}
                        placeholder="https://company.com/apply"
                      />
                    </div>
                  )}
                  {templateForm.application_type === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="application_email">Application Email</Label>
                      <Input
                        id="application_email"
                        type="email"
                        value={templateForm.application_email}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, application_email: e.target.value }))}
                        placeholder="jobs@company.com"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="application_instructions">Application Instructions</Label>
                    <Textarea
                      id="application_instructions"
                      value={templateForm.application_instructions}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, application_instructions: e.target.value }))}
                      placeholder="Instructions for applicants"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={templateForm.is_active}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Template is active</Label>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTemplate(template)}
                    className="p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(template)}
                    className="p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-1"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {template.title || 'No title set'}
                </div>
                
                {template.category_id && (
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(cat => cat.id == template.category_id)?.name || 'Unknown Category'}
                  </Badge>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first job template'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <div className="flex gap-3">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
                <Button variant="outline" onClick={createSampleTemplates}>
                  <FileText className="w-4 h-4 mr-2" />
                  Add Sample Templates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template preview and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span> {categories.find(cat => cat.id == selectedTemplate.category_id)?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge variant={selectedTemplate.is_active ? 'default' : 'secondary'} className="ml-2">
                    {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Job Title</h4>
                  <p className="text-gray-700">{selectedTemplate.title || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-gray-700">{selectedTemplate.summary || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedTemplate.job_description || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedTemplate.requirements || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the job template details
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={templateForm.category_id}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Template Description</Label>
                <Textarea
                  id="edit-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </TabsContent>
            
            {/* Other tabs content similar to create dialog */}
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalJobTemplates;
