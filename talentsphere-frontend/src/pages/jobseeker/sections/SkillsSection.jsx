import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Target, X, Plus } from 'lucide-react';
import api from '../../../services/api';

const SkillsSection = ({ data, onUpdate }) => {
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedData = typeof data === 'string' ? JSON.parse(data || '{}') : data || {};
  const technicalSkills = Array.isArray(parsedData.technical_skills) 
    ? parsedData.technical_skills 
    : (typeof parsedData.technical_skills === 'string' 
      ? JSON.parse(parsedData.technical_skills || '[]') 
      : []);
  const softSkills = Array.isArray(parsedData.soft_skills) 
    ? parsedData.soft_skills 
    : (typeof parsedData.soft_skills === 'string' 
      ? JSON.parse(parsedData.soft_skills || '[]') 
      : []);

  const updateSkills = async (updatedTechnical, updatedSoft) => {
    setSaving(true);
    try {
      await api.updateCompleteProfile({
        technical_skills: JSON.stringify(updatedTechnical),
        soft_skills: JSON.stringify(updatedSoft)
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating skills:', error);
      alert(error.message || 'Error updating skills');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      const updated = [...technicalSkills, newTechnicalSkill.trim()];
      updateSkills(updated, softSkills);
      setNewTechnicalSkill('');
    }
  };

  const handleAddSoftSkill = () => {
    if (newSoftSkill.trim()) {
      const updated = [...softSkills, newSoftSkill.trim()];
      updateSkills(technicalSkills, updated);
      setNewSoftSkill('');
    }
  };

  const handleRemoveTechnicalSkill = (index) => {
    const updated = technicalSkills.filter((_, i) => i !== index);
    updateSkills(updated, softSkills);
  };

  const handleRemoveSoftSkill = (index) => {
    const updated = softSkills.filter((_, i) => i !== index);
    updateSkills(technicalSkills, updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Skills
        </CardTitle>
        <CardDescription>Your technical and soft skills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Technical Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] p-3 border rounded-lg">
              {technicalSkills.length === 0 ? (
                <p className="text-sm text-gray-400">No technical skills added yet</p>
              ) : (
                technicalSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => handleRemoveTechnicalSkill(index)}
                    />
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a technical skill (e.g., Python, React, AWS)..."
                value={newTechnicalSkill}
                onChange={(e) => setNewTechnicalSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTechnicalSkill()}
                disabled={saving}
              />
              <Button onClick={handleAddTechnicalSkill} disabled={saving || !newTechnicalSkill.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Soft Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] p-3 border rounded-lg">
              {softSkills.length === 0 ? (
                <p className="text-sm text-gray-400">No soft skills added yet</p>
              ) : (
                softSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => handleRemoveSoftSkill(index)}
                    />
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a soft skill (e.g., Leadership, Communication)..."
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSoftSkill()}
                disabled={saving}
              />
              <Button onClick={handleAddSoftSkill} disabled={saving || !newSoftSkill.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Add 5-10 key skills that are relevant to your target jobs. Include both technical skills (tools, languages, frameworks) and soft skills (communication, leadership, problem-solving).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsSection;
