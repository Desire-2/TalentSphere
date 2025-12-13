import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Settings, Edit2 } from 'lucide-react';
import api from '../../../services/api';

const PreferencesSection = ({ data = {}, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    job_types: data?.job_types || [], 
    expected_salary: data?.expected_salary || '', 
    salary_currency: data?.salary_currency || 'USD', 
    willing_to_relocate: data?.willing_to_relocate || false, 
    willing_to_travel: data?.willing_to_travel || 'No', 
    preferred_locations: data?.preferred_locations || [], 
    work_authorization: data?.work_authorization || '', 
    notice_period: data?.notice_period || '' 
  });
  const [saving, setSaving] = useState(false);

  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote'];
  const travelOptions = ['No', 'Occasionally', 'Frequently', 'Willing'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

  const toggleJobType = (type) => {
    setFormData(prev => ({ ...prev, job_types: prev.job_types.includes(type) ? prev.job_types.filter(t => t !== type) : [...prev.job_types, type] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCompleteProfile(formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Job Preferences</CardTitle><CardDescription>Your work preferences and requirements</CardDescription></div>
          {!isEditing && (<Button onClick={() => { setFormData({ job_types: data?.job_types || [], expected_salary: data?.expected_salary || '', salary_currency: data?.salary_currency || 'USD', willing_to_relocate: data?.willing_to_relocate || false, willing_to_travel: data?.willing_to_travel || 'No', preferred_locations: data?.preferred_locations || [], work_authorization: data?.work_authorization || '', notice_period: data?.notice_period || '' }); setIsEditing(true); }} size="sm"><Edit2 className="w-4 h-4 mr-1" />Edit</Button>)}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div><Label>Job Types *</Label><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">{jobTypeOptions.map(type => (<label key={type} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={formData.job_types.includes(type)} onChange={() => toggleJobType(type)} /><span className="text-sm">{type}</span></label>))}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="expected_salary">Expected Salary</Label><div className="flex gap-2"><select value={formData.salary_currency} onChange={(e) => setFormData({...formData, salary_currency: e.target.value})} className="w-24 px-3 py-2 border rounded">{currencyOptions.map(c => (<option key={c} value={c}>{c}</option>))}</select><Input id="expected_salary" type="number" value={formData.expected_salary} onChange={(e) => setFormData({...formData, expected_salary: e.target.value})} placeholder="Annual" /></div></div>
              <div><Label htmlFor="notice_period">Notice Period</Label><Input id="notice_period" value={formData.notice_period} onChange={(e) => setFormData({...formData, notice_period: e.target.value})} placeholder="e.g., 2 weeks" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Willing to Relocate</Label><div className="flex gap-4 mt-2"><label className="flex items-center gap-2"><input type="radio" checked={formData.willing_to_relocate === true} onChange={() => setFormData({...formData, willing_to_relocate: true})} />Yes</label><label className="flex items-center gap-2"><input type="radio" checked={formData.willing_to_relocate === false} onChange={() => setFormData({...formData, willing_to_relocate: false})} />No</label></div></div>
              <div><Label htmlFor="willing_to_travel">Willing to Travel</Label><select id="willing_to_travel" value={formData.willing_to_travel} onChange={(e) => setFormData({...formData, willing_to_travel: e.target.value})} className="w-full px-3 py-2 border rounded">{travelOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
            </div>
            <div><Label htmlFor="work_authorization">Work Authorization</Label><Input id="work_authorization" value={formData.work_authorization} onChange={(e) => setFormData({...formData, work_authorization: e.target.value})} placeholder="e.g., US Citizen, Work Visa" /></div>
            <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button><Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button></div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-sm font-medium text-gray-500">Job Types</p><p className="text-base">{data?.job_types?.length > 0 ? data.job_types.join(', ') : 'Not specified'}</p></div>
            <div><p className="text-sm font-medium text-gray-500">Expected Salary</p><p className="text-base">{data?.expected_salary ? `${data.salary_currency || 'USD'} ${data.expected_salary.toLocaleString()}` : 'Not specified'}</p></div>
            <div><p className="text-sm font-medium text-gray-500">Willing to Relocate</p><p className="text-base">{data?.willing_to_relocate ? 'Yes' : 'No'}</p></div>
            <div><p className="text-sm font-medium text-gray-500">Willing to Travel</p><p className="text-base">{data?.willing_to_travel || 'Not specified'}</p></div>
            <div><p className="text-sm font-medium text-gray-500">Notice Period</p><p className="text-base">{data?.notice_period || 'Not specified'}</p></div>
            <div><p className="text-sm font-medium text-gray-500">Work Authorization</p><p className="text-base">{data?.work_authorization || 'Not specified'}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreferencesSection;
