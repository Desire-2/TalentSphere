import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { FolderGit2, Plus, Edit2, Trash2, ExternalLink, Star, Calendar } from 'lucide-react';
import apiService from '../../../services/api';

const ProjectsSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: '',
    start_date: '',
    end_date: '',
    is_ongoing: false,
    project_url: '',
    github_url: '',
    technologies_used: '',
    is_featured: false
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      role: '',
      start_date: '',
      end_date: '',
      is_ongoing: false,
      project_url: '',
      github_url: '',
      technologies_used: '',
      is_featured: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name || '',
      description: project.description || '',
      role: project.role || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      is_ongoing: project.is_ongoing || false,
      project_url: project.project_url || '',
      github_url: project.github_url || '',
      technologies_used: Array.isArray(project.technologies_used) 
        ? project.technologies_used.join(', ') 
        : project.technologies_used || '',
      is_featured: project.is_featured || false
    });
    setEditingId(project.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        technologies_used: formData.technologies_used
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
      };

      let response;
      if (editingId) {
        response = await apiService.updateProject(editingId, payload);
      } else {
        response = await apiService.addProject(payload);
      }

      if (response) {
        resetForm();
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert(error.message || 'Error saving project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await apiService.deleteProject(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.message || 'Error deleting project');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5" />
              Projects
            </CardTitle>
            <CardDescription>Showcase your portfolio and personal projects</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Project
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., E-commerce Platform"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Your Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="e.g., Lead Developer"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                placeholder="Describe what the project does, your contributions, and the impact..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  disabled={formData.is_ongoing}
                />
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_ongoing}
                    onChange={(e) => setFormData({...formData, is_ongoing: e.target.checked, end_date: ''})}
                  />
                  Ongoing project
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_url">Project URL</Label>
                <Input
                  id="project_url"
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({...formData, project_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="technologies_used">Technologies Used (comma-separated)</Label>
              <Input
                id="technologies_used"
                value={formData.technologies_used}
                onChange={(e) => setFormData({...formData, technologies_used: e.target.value})}
                placeholder="React, Node.js, MongoDB, AWS"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                />
                <Star className="w-4 h-4 text-yellow-500" />
                Feature this project (will be highlighted in your profile)
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Project'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FolderGit2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No projects added yet</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((project) => (
              <div key={project.id} className={`border rounded-lg p-4 relative group hover:shadow-md transition-shadow ${project.is_featured ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                {project.is_featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(project)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className={`${project.is_featured ? 'mt-6' : ''}`}>
                  <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                  {project.role && (
                    <p className="text-sm text-gray-600 mb-2">{project.role}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-3">{project.description}</p>

                  {(project.start_date || project.end_date) && (
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.start_date)} - {project.is_ongoing ? 'Present' : formatDate(project.end_date)}
                    </div>
                  )}

                  {project.technologies_used && project.technologies_used.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies_used.map((tech, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {project.project_url && (
                      <a 
                        href={project.project_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Live <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {project.github_url && (
                      <a 
                        href={project.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-700 hover:underline flex items-center gap-1"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsSection;
