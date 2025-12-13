import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Trophy, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import apiService from '../../../services/api';

const AwardsSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', issuer: '', date_received: '', description: '' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({ title: '', issuer: '', date_received: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (award) => {
    setFormData({ title: award.title || '', issuer: award.issuer || '', date_received: award.date_received || '', description: award.description || '' });
    setEditingId(award.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiService.updateAward(editingId, formData);
      } else {
        await apiService.addAward(formData);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error saving award');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this award?')) return;
    try {
      await apiService.deleteAward(id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error deleting award');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Awards & Achievements
            </CardTitle>
            <CardDescription>Recognition and accomplishments</CardDescription>
          </div>
          {!isAdding && (<Button onClick={() => setIsAdding(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Award</Button>)}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div><Label htmlFor="title">Award Name *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Employee of the Year" required /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="issuer">Issuer *</Label><Input id="issuer" value={formData.issuer} onChange={(e) => setFormData({...formData, issuer: e.target.value})} placeholder="e.g., Tech Corp" required /></div>
              <div><Label htmlFor="date_received">Date *</Label><Input id="date_received" type="date" value={formData.date_received} onChange={(e) => setFormData({...formData, date_received: e.target.value})} required /></div>
            </div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Why you received this award..." /></div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Award'}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No awards added yet</p>
            <Button onClick={() => setIsAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Your First Award</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((award) => (
              <div key={award.id} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg relative group hover:bg-yellow-100 transition-colors">
                <Trophy className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{award.title}</h3>
                  <p className="text-sm text-gray-700">{award.issuer}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />{formatDate(award.date_received)}</p>
                  {award.description && <p className="text-sm text-gray-600 mt-2">{award.description}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(award)}><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(award.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AwardsSection;
