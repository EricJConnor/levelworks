import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id?: string;
  user_id: string;
  full_name: string;
  company_name: string;
  phone_number: string;
  business_address: string;
  profile_photo_url: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  uploadPhoto: (file: File) => Promise<string | null>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        setError(fetchError.message);
      } else {
        setProfile(data || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const updateProfile = async (data: Partial<Profile>): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const profileData = { ...data, user_id: session.user.id, updated_at: new Date().toISOString() };
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });
      
      if (upsertError) throw upsertError;
      await refreshProfile();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile, updateProfile, uploadPhoto }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};
