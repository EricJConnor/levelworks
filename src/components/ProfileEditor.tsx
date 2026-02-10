import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, User, Building2, Phone, MapPin, Save, Check } from 'lucide-react';

export const ProfileEditor: React.FC = () => {
  const { profile, loading, updateProfile, uploadPhoto } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone_number: '',
    business_address: '',
    profile_photo_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone_number: profile.phone_number || '',
        business_address: profile.business_address || '',
        profile_photo_url: profile.profile_photo_url || ''
      });
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    
    setUploading(true);
    const url = await uploadPhoto(file);
    if (url) {
      setFormData(prev => ({ ...prev, profile_photo_url: url }));
      await updateProfile({ profile_photo_url: url });
      toast({ title: 'Photo uploaded!', description: 'Your profile photo has been updated' });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      toast({ title: 'Profile saved!', description: 'Your profile has been updated successfully' });
    } else {
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Edit Profile</CardTitle>
        <CardDescription>Update your personal and business information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {formData.profile_photo_url ? (
                  <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow-lg">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <p className="text-sm text-gray-500">Click the camera icon to upload a photo</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2"><User className="w-4 h-4" />Full Name</Label>
              <Input id="full_name" value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="flex items-center gap-2"><Building2 className="w-4 h-4" />Company Name</Label>
              <Input id="company_name" value={formData.company_name} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} placeholder="Smith Contracting LLC" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2"><Phone className="w-4 h-4" />Phone Number</Label>
            <Input id="phone_number" type="tel" value={formData.phone_number} onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))} placeholder="(555) 123-4567" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address" className="flex items-center gap-2"><MapPin className="w-4 h-4" />Business Address</Label>
            <Textarea id="business_address" value={formData.business_address} onChange={e => setFormData(p => ({ ...p, business_address: e.target.value }))} placeholder="123 Main Street&#10;City, State 12345" rows={3} />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
