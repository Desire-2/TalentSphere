import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Briefcase, Plus, Edit2, Trash2, X, Calendar } from 'lucide-react';

const WorkExperienceSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    employment_type: 'Full-time',
    responsibilities: '',
    achievements: '',
    technologies_used: ''
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      job_title: '',
      company_name: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      employment_type: 'Full-time',
      responsibilities: '',
      achievements: '',
      technologies_used: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (exp) => {
    setFormData({
      job_title: exp.job_title || '',
      company_name: exp.company_name || '',
      location: exp.location || '',
      start_date: exp.start_date || '',
      end_date: exp.end_date || '',
      is_current: exp.is_current || false,
      employment_type: exp.employment_type || 'Full-time',
      responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : exp.responsibilities || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements.join('\n') : exp.achievements || '',
      technologies_used: Array.isArray(exp.technologies_used) ? exp.technologies_used.join(', ') : exp.technologies_used || ''
    });
    setEditingId(exp.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
        achievements: formData.achievements.split('\n').filter(a => a.trim()),
        technologies_used: formData.technologies_used.split(',').map(t => t.trim()).filter(t => t)
      };

      const url = editingId 
        ? `/api/profile/work-experience/${editingId}`
        : '/api/profile/work-experience';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetForm();
        onUpdate();
      } else {
        alert('Failed to save work experience');
      }
    } catch (error) {
      console.error('Error saving work experience:', error);
      alert('Error saving work experience');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return;

    try {
      const response = await fetch(`/api/profile/work-experience/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete work experience');
      }
    } catch (error) {
      console.error('Error deleting work experience:', error);
      alert('Error deleting work experience');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </CardTitle>
            <CardDescription>Your professional work history and achievements</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Experience
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  placeholder="e.g., Tech Corp Inc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <select
                  id="employment_type"
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  disabled={formData.is_current}
                />
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({...formData, is_current: e.target.checked, end_date: ''})}
                  />
                  I currently work here
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="responsibilities">Key Responsibilities (one per line)</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                rows={4}
                placeholder="• Managed team of 5 developers&#10;• Led architecture design&#10;• Implemented CI/CD pipeline"
              />
            </div>

            <div>
              <Label htmlFor="achievements">Key Achievements (one per line)</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                rows={3}
                placeholder="• Increased system performance by 40%&#10;• Reduced deployment time from 2 hours to 15 minutes"
              />
            </div>

            <div>
              <Label htmlFor="technologies_used">Technologies Used (comma-separated)</Label>
              <Input
                id="technologies_used"
                value={formData.technologies_used}
                onChange={(e) => setFormData({...formData, technologies_used: e.target.value})}
                placeholder="React, Node.js, Python, AWS, Docker"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Experience'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No work experience added yet</p>
            <p className="text-sm text-gray-400 mb-4">Add your professional experience to showcase your career journey</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Experience
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((exp) => (
              <div key={exp.id} className="border-l-4 border-blue-500 pl-4 pb-4 relative group hover:bg-gray-50 p-4 rounded-r transition-colors">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(exp)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(exp.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pr-20">
                  <h3 className="font-semibold text-lg">{exp.job_title}</h3>
                  <p className="text-gray-700 font-medium">{exp.company_name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                    </span>
                    {exp.location && <span>• {exp.location}</span>}
                    <Badge variant="outline" className="text-xs">{exp.employment_type}</Badge>
                  </div>

                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Key Responsibilities:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {exp.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Key Achievements:</p>
                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.technologies_used && exp.technologies_used.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {exp.technologies_used.map((tech, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkExperienceSection;
