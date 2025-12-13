import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { FileText } from 'lucide-react';
import api from '../../../services/api';

const ProfessionalSummarySection = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    professional_title: data?.professional_title || '',
    professional_summary: data?.professional_summary || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.updateCompleteProfile(formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating summary:', error);
      alert(error.message || 'Error updating summary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Professional Summary
        </CardTitle>
        <CardDescription>Your headline and elevator pitch</CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Professional Title</p>
              <p className="text-lg font-semibold">{data?.professional_title || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Summary</p>
              <p className="text-base text-gray-700">{data?.professional_summary || 'Not provided'}</p>
            </div>
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="professional_title">Professional Title</Label>
              <Input
                id="professional_title"
                value={formData.professional_title}
                onChange={(e) => setFormData({...formData, professional_title: e.target.value})}
                placeholder="e.g., Senior Software Engineer"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="professional_summary">Professional Summary</Label>
              <Textarea
                id="professional_summary"
                value={formData.professional_summary}
                onChange={(e) => setFormData({...formData, professional_summary: e.target.value})}
                rows={6}
                maxLength={1000}
                placeholder="Describe your professional background, expertise, and career goals..."
              />
              <p className="text-xs text-gray-500 mt-1">{formData.professional_summary.length}/1000 characters</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalSummarySection;
