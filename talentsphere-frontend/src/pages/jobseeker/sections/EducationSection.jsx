import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { GraduationCap, Plus, Edit2, Trash2, Calendar, Award } from 'lucide-react';

const EducationSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    institution_name: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    max_gpa: '4.0',
    honors: '',
    relevant_coursework: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      institution_name: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      gpa: '',
      max_gpa: '4.0',
      honors: '',
      relevant_coursework: '',
      description: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (edu) => {
    setFormData({
      institution_name: edu.institution_name || '',
      degree: edu.degree || '',
      field_of_study: edu.field_of_study || '',
      start_date: edu.start_date || '',
      end_date: edu.end_date || '',
      is_current: edu.is_current || false,
      gpa: edu.gpa || '',
      max_gpa: edu.max_gpa || '4.0',
      honors: edu.honors || '',
      relevant_coursework: Array.isArray(edu.relevant_coursework) ? edu.relevant_coursework.join(', ') : edu.relevant_coursework || '',
      description: edu.description || ''
    });
    setEditingId(edu.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        max_gpa: formData.max_gpa ? parseFloat(formData.max_gpa) : 4.0,
        relevant_coursework: formData.relevant_coursework 
          ? formData.relevant_coursework.split(',').map(c => c.trim()).filter(c => c)
          : []
      };

      const url = editingId 
        ? `/api/profile/education/${editingId}`
        : '/api/profile/education';
      
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
        alert('Failed to save education');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      alert('Error saving education');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;

    try {
      const response = await fetch(`/api/profile/education/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete education');
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      alert('Error deleting education');
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
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
            <CardDescription>Your academic background and qualifications</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Education
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institution_name">Institution Name *</Label>
                <Input
                  id="institution_name"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({...formData, institution_name: e.target.value})}
                  placeholder="e.g., Stanford University"
                  required
                />
              </div>
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <select
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({...formData, degree: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Degree</option>
                  <option value="High School Diploma">High School Diploma</option>
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor of Science">Bachelor of Science</option>
                  <option value="Bachelor of Arts">Bachelor of Arts</option>
                  <option value="Master of Science">Master of Science</option>
                  <option value="Master of Arts">Master of Arts</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="field_of_study">Field of Study *</Label>
              <Input
                id="field_of_study"
                value={formData.field_of_study}
                onChange={(e) => setFormData({...formData, field_of_study: e.target.value})}
                placeholder="e.g., Computer Science"
                required
              />
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
                <Label htmlFor="end_date">End Date (or Expected)</Label>
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
                  Currently studying here
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gpa">GPA (optional)</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  value={formData.gpa}
                  onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                  placeholder="3.8"
                />
              </div>
              <div>
                <Label htmlFor="max_gpa">Max GPA</Label>
                <Input
                  id="max_gpa"
                  type="number"
                  step="0.1"
                  value={formData.max_gpa}
                  onChange={(e) => setFormData({...formData, max_gpa: e.target.value})}
                  placeholder="4.0"
                />
              </div>
              <div>
                <Label htmlFor="honors">Honors/Awards</Label>
                <Input
                  id="honors"
                  value={formData.honors}
                  onChange={(e) => setFormData({...formData, honors: e.target.value})}
                  placeholder="e.g., Cum Laude"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relevant_coursework">Relevant Coursework (comma-separated)</Label>
              <Input
                id="relevant_coursework"
                value={formData.relevant_coursework}
                onChange={(e) => setFormData({...formData, relevant_coursework: e.target.value})}
                placeholder="Data Structures, Algorithms, Machine Learning, Database Systems"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Additional details about your education, thesis, or special projects..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Education'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No education records added yet</p>
            <p className="text-sm text-gray-400 mb-4">Add your educational background to showcase your qualifications</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your Education
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((edu) => (
              <div key={edu.id} className="border-l-4 border-green-500 pl-4 pb-4 relative group hover:bg-gray-50 p-4 rounded-r transition-colors">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(edu)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(edu.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pr-20">
                  <h3 className="font-semibold text-lg">{edu.degree} in {edu.field_of_study}</h3>
                  <p className="text-gray-700 font-medium">{edu.institution_name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </span>
                    {edu.gpa && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        GPA: {edu.gpa}/{edu.max_gpa || 4.0}
                      </span>
                    )}
                  </div>

                  {edu.honors && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {edu.honors}
                      </Badge>
                    </div>
                  )}

                  {edu.description && (
                    <p className="text-sm text-gray-600 mt-3">{edu.description}</p>
                  )}

                  {edu.relevant_coursework && edu.relevant_coursework.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Relevant Coursework:</p>
                      <div className="flex flex-wrap gap-2">
                        {edu.relevant_coursework.map((course, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {course}
                          </Badge>
                        ))}
                      </div>
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

export default EducationSection;
