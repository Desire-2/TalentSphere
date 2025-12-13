import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Languages, Plus, Edit2, Trash2 } from 'lucide-react';

const LanguagesSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ language: '', proficiency_level: 'Professional' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setFormData({ language: '', proficiency_level: 'Professional' }); setIsAdding(false); setEditingId(null); };
  const handleEdit = (lang) => { setFormData({ language: lang.language || '', proficiency_level: lang.proficiency_level || 'Professional' }); setEditingId(lang.id); setIsAdding(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/profile/languages/${editingId}` : '/api/profile/languages';
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) { resetForm(); onUpdate(); } else alert('Failed to save');
    } catch (error) { alert('Error saving'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this language?')) return;
    try {
      const response = await fetch(`/api/profile/languages/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (response.ok) onUpdate();
    } catch (error) { console.error(error); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Languages className="w-5 h-5" />Languages</CardTitle>
            <CardDescription>Languages you can communicate in</CardDescription>
          </div>
          {!isAdding && (<Button onClick={() => setIsAdding(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Language</Button>)}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div><Label htmlFor="language">Language *</Label><Input id="language" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} placeholder="e.g., English, Spanish" required /></div>
            <div><Label htmlFor="proficiency_level">Proficiency Level *</Label>
              <select id="proficiency_level" value={formData.proficiency_level} onChange={(e) => setFormData({...formData, proficiency_level: e.target.value})} className="w-full px-3 py-2 border rounded-md" required>
                <option value="Native">Native</option>
                <option value="Fluent">Fluent</option>
                <option value="Professional">Professional</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Basic">Basic</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Language'}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Languages className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No languages added yet</p>
            <Button onClick={() => setIsAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Language</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((lang) => (
              <div key={lang.id} className="flex items-center justify-between p-3 border rounded group hover:bg-gray-50 transition-colors">
                <span className="font-medium">{lang.language}</span>
                <div className="flex items-center gap-2">
                  <Badge>{lang.proficiency_level}</Badge>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(lang)}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(lang.id)} className="text-red-600"><Trash2 className="w-3 h-3" /></Button>
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

export default LanguagesSection;
