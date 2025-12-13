import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Target, X, Plus, Code, Users, TrendingUp, Award, Star } from 'lucide-react';
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
      // Split by comma and filter out empty strings
      const newSkills = newTechnicalSkill
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill && !technicalSkills.includes(skill));
      
      if (newSkills.length > 0) {
        const updated = [...technicalSkills, ...newSkills];
        updateSkills(updated, softSkills);
      }
      setNewTechnicalSkill('');
    }
  };

  const handleAddSoftSkill = () => {
    if (newSoftSkill.trim()) {
      // Split by comma and filter out empty strings
      const newSkills = newSoftSkill
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill && !softSkills.includes(skill));
      
      if (newSkills.length > 0) {
        const updated = [...softSkills, ...newSkills];
        updateSkills(technicalSkills, updated);
      }
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
    <div className="space-y-6">
      {/* Technical Skills Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                Technical Skills
                <Badge variant="secondary" className="ml-2">{technicalSkills.length}</Badge>
              </CardTitle>
              <CardDescription>Programming languages, frameworks, tools, and technologies</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[80px] p-4 border-2 border-dashed rounded-lg bg-gray-50">
              {technicalSkills.length === 0 ? (
                <div className="w-full text-center py-4">
                  <Code className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No technical skills added yet</p>
                </div>
              ) : (
                technicalSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 group">
                    <Code className="w-3 h-3 mr-1" />
                    {skill}
                    <X 
                      className="w-3.5 h-3.5 ml-2 cursor-pointer opacity-70 hover:opacity-100 hover:text-red-600" 
                      onClick={() => handleRemoveTechnicalSkill(index)}
                    />
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skills (comma-separated): Python, React, AWS, Docker..."
                value={newTechnicalSkill}
                onChange={(e) => setNewTechnicalSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTechnicalSkill()}
                disabled={saving}
                className="flex-1"
              />
              <Button onClick={handleAddTechnicalSkill} disabled={saving || !newTechnicalSkill.trim()} className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Soft Skills Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Soft Skills
                <Badge variant="secondary" className="ml-2">{softSkills.length}</Badge>
              </CardTitle>
              <CardDescription>Interpersonal skills, work style, and personal qualities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[80px] p-4 border-2 border-dashed rounded-lg bg-gray-50">
              {softSkills.length === 0 ? (
                <div className="w-full text-center py-4">
                  <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No soft skills added yet</p>
                </div>
              ) : (
                softSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm px-3 py-1.5 bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 group">
                    <Users className="w-3 h-3 mr-1" />
                    {skill}
                    <X 
                      className="w-3.5 h-3.5 ml-2 cursor-pointer opacity-70 hover:opacity-100 hover:text-red-600" 
                      onClick={() => handleRemoveSoftSkill(index)}
                    />
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skills (comma-separated): Leadership, Communication, Problem Solving..."
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSoftSkill()}
                disabled={saving}
                className="flex-1"
              />
              <Button onClick={handleAddSoftSkill} disabled={saving || !newSoftSkill.trim()} variant="outline" className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Tips */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{technicalSkills.length + softSkills.length}</p>
                <p className="text-xs text-gray-600">Total Skills</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Code className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{technicalSkills.length}</p>
                <p className="text-xs text-gray-600">Technical</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{softSkills.length}</p>
                <p className="text-xs text-gray-600">Soft Skills</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Pro Tips for Building Your Skills Profile
            </h4>
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Add 8-15 skills total: 60% technical, 40% soft skills for best balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Focus on skills relevant to your target job positions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Include current industry-standard tools and technologies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>Update regularly as you learn new skills or improve existing ones</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsSection;
