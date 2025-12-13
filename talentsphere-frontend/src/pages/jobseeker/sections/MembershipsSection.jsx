import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import apiService from '../../../services/api';

const MembershipsSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ organization_name: '', membership_type: '', start_date: '', end_date: '', is_current: true });
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setFormData({ organization_name: '', membership_type: '', start_date: '', end_date: '', is_current: true }); setIsAdding(false); setEditingId(null); };
  const handleEdit = (mem) => { setFormData({ organization_name: mem.organization_name || '', membership_type: mem.membership_type || '', start_date: mem.start_date || '', end_date: mem.end_date || '', is_current: mem.is_current || true }); setEditingId(mem.id); setIsAdding(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiService.updateProfessionalMembership(editingId, formData);
      } else {
        await apiService.addProfessionalMembership(formData);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error saving membership');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this membership?')) return;
    try {
      await apiService.deleteProfessionalMembership(id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error deleting membership');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric' }) : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Professional Memberships</CardTitle><CardDescription>Organizations and associations</CardDescription></div>
          {!isAdding && (<Button onClick={() => setIsAdding(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Membership</Button>)}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="organization_name">Organization *</Label><Input id="organization_name" value={formData.organization_name} onChange={(e) => setFormData({...formData, organization_name: e.target.value})} placeholder="e.g., IEEE" required /></div>
              <div><Label htmlFor="membership_type">Membership Type</Label><Input id="membership_type" value={formData.membership_type} onChange={(e) => setFormData({...formData, membership_type: e.target.value})} placeholder="e.g., Member, Fellow, Associate" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="start_date">Start Date *</Label><Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required /></div>
              <div><Label htmlFor="end_date">End Date</Label><Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} disabled={formData.is_current} /><label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={formData.is_current} onChange={(e) => setFormData({...formData, is_current: e.target.checked, end_date: ''})} />Current member</label></div>
            </div>
            <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button></div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg"><Users className="w-12 h-12 mx-auto text-gray-400 mb-3" /><p className="text-gray-500 mb-4">No memberships yet</p><Button onClick={() => setIsAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Membership</Button></div>
        ) : (
          <div className="space-y-3">
            {data.map((mem) => (
              <div key={mem.id} className="flex items-center justify-between p-3 border rounded group hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold">{mem.organization_name}</h3>
                  <p className="text-sm text-gray-600">{mem.membership_type || 'Member'} • Since {formatDate(mem.start_date)}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(mem)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(mem.id)} className="text-red-600"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembershipsSection;
