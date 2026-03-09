import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Users, Plus, Edit2, Trash2, Mail, Phone, Briefcase } from 'lucide-react';
import apiService from '../../../services/api';

const EMPTY_FORM = { name: '', position: '', company: '', email: '', phone: '', relationship: '' };

const ReferencesSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (ref) => {
    setFormData({
      name: ref.name || '',
      position: ref.position || '',
      company: ref.company || '',
      email: ref.email || '',
      phone: ref.phone || '',
      relationship: ref.relationship || '',
    });
    setEditingId(ref.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiService.updateReference(editingId, formData);
      } else {
        await apiService.addReference(formData);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error saving reference');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reference?')) return;
    try {
      await apiService.deleteReference(id);
      onUpdate();
    } catch (error) {
      alert(error.message || 'Error deleting reference');
    }
  };

  const field = (id, label, placeholder, type = 'text') => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={formData[id]}
        onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Professional References
            </CardTitle>
            <CardDescription>People who can vouch for your work</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />Add Reference
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('name', 'Full Name *', 'e.g., Jane Smith')}
              {field('position', 'Job Title', 'e.g., Senior Manager')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('company', 'Company', 'e.g., Acme Corp')}
              {field('relationship', 'Relationship', 'e.g., Direct Manager')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('email', 'Email', 'jane@example.com', 'email')}
              {field('phone', 'Phone', '+1 555 000 0000', 'tel')}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Reference' : 'Add Reference'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No references added yet</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />Add Your First Reference
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((ref) => (
              <div
                key={ref.id}
                className="relative group p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="pr-16">
                  <h3 className="font-semibold text-base">{ref.name}</h3>
                  {ref.position && (
                    <p className="text-sm text-blue-700 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />{ref.position}
                      {ref.company ? ` · ${ref.company}` : ''}
                    </p>
                  )}
                  {ref.relationship && (
                    <p className="text-xs text-gray-500 italic mt-1">{ref.relationship}</p>
                  )}
                  {ref.email && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />{ref.email}
                    </p>
                  )}
                  {ref.phone && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />{ref.phone}
                    </p>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(ref)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(ref.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferencesSection;
