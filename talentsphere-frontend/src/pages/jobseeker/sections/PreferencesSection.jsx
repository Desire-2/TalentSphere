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

  const resetFormFromData = () => {
    setFormData({
      job_types: data?.job_types || [],
      expected_salary: data?.expected_salary || '',
      salary_currency: data?.salary_currency || 'USD',
      willing_to_relocate: data?.willing_to_relocate || false,
      willing_to_travel: data?.willing_to_travel || 'No',
      preferred_locations: data?.preferred_locations || [],
      work_authorization: data?.work_authorization || '',
      notice_period: data?.notice_period || ''
    });
  };

  const toggleJobType = (type) => {
    setFormData((prev) => ({
      ...prev,
      job_types: prev.job_types.includes(type)
        ? prev.job_types.filter((t) => t !== type)
        : [...prev.job_types, type]
    }));
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Job Preferences
            </CardTitle>
            <CardDescription>Your work preferences and requirements</CardDescription>
          </div>
          {!isEditing && (
            <Button
              onClick={() => {
                resetFormFromData();
                setIsEditing(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Job Types *</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {jobTypeOptions.map((type) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2 rounded border p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.job_types.includes(type)}
                      onChange={() => toggleJobType(type)}
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected_salary">Expected Salary</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                    className="w-full rounded border px-3 py-2 sm:w-24"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Input
                    id="expected_salary"
                    type="number"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                    placeholder="Annual"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notice_period">Notice Period</Label>
                <Input
                  id="notice_period"
                  value={formData.notice_period}
                  onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                  placeholder="e.g., 2 weeks"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Willing to Relocate</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.willing_to_relocate === true}
                      onChange={() => setFormData({ ...formData, willing_to_relocate: true })}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.willing_to_relocate === false}
                      onChange={() => setFormData({ ...formData, willing_to_relocate: false })}
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="willing_to_travel">Willing to Travel</Label>
                <select
                  id="willing_to_travel"
                  value={formData.willing_to_travel}
                  onChange={(e) => setFormData({ ...formData, willing_to_travel: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                >
                  {travelOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="work_authorization">Work Authorization</Label>
              <Input
                id="work_authorization"
                value={formData.work_authorization}
                onChange={(e) => setFormData({ ...formData, work_authorization: e.target.value })}
                placeholder="e.g., US Citizen, Work Visa"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Job Types</p>
              <p className="text-base break-words">{data?.job_types?.length > 0 ? data.job_types.join(', ') : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expected Salary</p>
              <p className="text-base break-words">
                {data?.expected_salary ? `${data.salary_currency || 'USD'} ${data.expected_salary.toLocaleString()}` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Willing to Relocate</p>
              <p className="text-base">{data?.willing_to_relocate ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Willing to Travel</p>
              <p className="text-base">{data?.willing_to_travel || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Notice Period</p>
              <p className="text-base">{data?.notice_period || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Work Authorization</p>
              <p className="text-base break-words">{data?.work_authorization || 'Not specified'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreferencesSection;
