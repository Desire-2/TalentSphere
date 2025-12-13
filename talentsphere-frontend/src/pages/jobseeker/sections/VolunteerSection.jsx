import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Heart, Plus, Edit2, Trash2, Calendar } from 'lucide-react';

const VolunteerSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ role: '', organization: '', start_date: '', end_date: '', is_current: false, description: '' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setFormData({ role: '', organization: '', start_date: '', end_date: '', is_current: false, description: '' }); setIsAdding(false); setEditingId(null); };
  const handleEdit = (vol) => { setFormData({ role: vol.role || '', organization: vol.organization || '', start_date: vol.start_date || '', end_date: vol.end_date || '', is_current: vol.is_current || false, description: vol.description || '' }); setEditingId(vol.id); setIsAdding(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/profile/volunteer-experience/${editingId}` : '/api/profile/volunteer-experience';
      const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { resetForm(); onUpdate(); } else alert('Failed to save');
    } catch (error) { alert('Error saving'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { const response = await fetch(`/api/profile/volunteer-experience/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (response.ok) onUpdate(); } catch (error) { console.error(error); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" />Volunteer Experience</CardTitle><CardDescription>Community involvement and volunteer work</CardDescription></div>
          {!isAdding && (<Button onClick={() => setIsAdding(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Volunteer Work</Button>)}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="role">Role *</Label><Input id="role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="e.g., Volunteer Coordinator" required /></div>
              <div><Label htmlFor="organization">Organization *</Label><Input id="organization" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} placeholder="e.g., Red Cross" required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="start_date">Start Date *</Label><Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required /></div>
              <div><Label htmlFor="end_date">End Date</Label><Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} disabled={formData.is_current} /><label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={formData.is_current} onChange={(e) => setFormData({...formData, is_current: e.target.checked, end_date: ''})} />Currently volunteering</label></div>
            </div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="What did you do?" /></div>
            <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg"><Heart className="w-12 h-12 mx-auto text-gray-400 mb-3" /><p className="text-gray-500 mb-4">No volunteer experience added yet</p><Button onClick={() => setIsAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Volunteer Work</Button></div>
        ) : (
          <div className="space-y-4">
            {data.map((vol) => (
              <div key={vol.id} className="border-l-4 border-pink-500 pl-4 pb-4 relative group hover:bg-gray-50 p-4 rounded-r transition-colors">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(vol)}><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(vol.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <h3 className="font-semibold">{vol.role}</h3>
                <p className="text-sm text-gray-600">{vol.organization}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(vol.start_date)} - {vol.is_current ? 'Present' : formatDate(vol.end_date)}</p>
                {vol.description && <p className="text-sm text-gray-600 mt-2">{vol.description}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolunteerSection;
