import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Award, Plus, Edit2, Trash2, ExternalLink, AlertCircle, Calendar } from 'lucide-react';
import apiService from '../../../services/api';

const CertificationsSection = ({ data = [], onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
    does_not_expire: false
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      certification_name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: '',
      does_not_expire: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (cert) => {
    setFormData({
      certification_name: cert.certification_name || '',
      issuing_organization: cert.issuing_organization || '',
      issue_date: cert.issue_date || '',
      expiration_date: cert.expiration_date || '',
      credential_id: cert.credential_id || '',
      credential_url: cert.credential_url || '',
      does_not_expire: cert.does_not_expire || false
    });
    setEditingId(cert.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let response;
      if (editingId) {
        response = await apiService.updateCertification(editingId, formData);
      } else {
        response = await apiService.addCertification(formData);
      }

      if (response) {
        resetForm();
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving certification:', error);
      alert(error.message || 'Error saving certification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      await apiService.deleteCertification(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting certification:', error);
      alert(error.message || 'Error deleting certification');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const isExpiringSoon = (expirationDate) => {
    if (!expirationDate) return false;
    const daysUntil = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 90;
  };

  const isExpired = (expirationDate) => {
    return expirationDate && new Date(expirationDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
            <CardDescription>Your professional certifications and licenses</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Certification
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="certification_name">Certification Name *</Label>
              <Input
                id="certification_name"
                value={formData.certification_name}
                onChange={(e) => setFormData({...formData, certification_name: e.target.value})}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </div>
            <div>
              <Label htmlFor="issuing_organization">Issuing Organization *</Label>
              <Input
                id="issuing_organization"
                value={formData.issuing_organization}
                onChange={(e) => setFormData({...formData, issuing_organization: e.target.value})}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue_date">Issue Date *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  disabled={formData.does_not_expire}
                />
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.does_not_expire}
                    onChange={(e) => setFormData({...formData, does_not_expire: e.target.checked, expiration_date: ''})}
                  />
                  Does not expire
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credential_id">Credential ID</Label>
                <Input
                  id="credential_id"
                  value={formData.credential_id}
                  onChange={(e) => setFormData({...formData, credential_id: e.target.value})}
                  placeholder="e.g., AWS-SA-12345"
                />
              </div>
              <div>
                <Label htmlFor="credential_url">Credential URL</Label>
                <Input
                  id="credential_url"
                  type="url"
                  value={formData.credential_url}
                  onChange={(e) => setFormData({...formData, credential_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Certification'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        ) : data.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Award className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No certifications added yet</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Certification
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4 relative group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(cert)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(cert.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="pr-16">
                  <div className="flex items-start gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">{cert.certification_name}</h3>
                      <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="text-sm text-gray-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Issued: {formatDate(cert.issue_date)}
                    </div>
                    {cert.does_not_expire ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        No Expiration
                      </Badge>
                    ) : cert.expiration_date && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Expires: {formatDate(cert.expiration_date)}
                        </span>
                        {isExpired(cert.expiration_date) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </Badge>
                        )}
                        {isExpiringSoon(cert.expiration_date) && !isExpired(cert.expiration_date) && (
                          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    )}
                    {cert.credential_id && (
                      <div className="text-sm text-gray-600">
                        ID: {cert.credential_id}
                      </div>
                    )}
                    {cert.credential_url && (
                      <a 
                        href={cert.credential_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Credential <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
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

export default CertificationsSection;
