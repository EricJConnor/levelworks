import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsValidSession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsValidSession(true);
    });
  }, []);

  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
    { label: 'One special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const strength = checks.filter(c => c.valid).length;
  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = strength >= 4 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      window.location.href = '/app';
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full">Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-gray-600 mt-2">Create a strong password for your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 rounded-lg px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none" placeholder="Enter new password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-2">{[...Array(5)].map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded ${i < strength ? strengthColor : 'bg-gray-200'}`} />)}</div>
                <p className={`text-sm font-medium ${strength <= 2 ? 'text-red-600' : strength <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>{strengthLabel}</p>
                <div className="mt-2 space-y-1">{checks.map((c, i) => <div key={i} className={`flex items-center gap-2 text-sm ${c.valid ? 'text-green-600' : 'text-gray-400'}`}>{c.valid ? <Check size={14} /> : <X size={14} />}{c.label}</div>)}</div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border-2 rounded-lg px-4 py-3 pr-12 focus:outline-none ${confirmPassword && !passwordsMatch ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`} placeholder="Confirm new password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && <p className="text-red-500 text-sm mt-1">Passwords do not match</p>}
            {passwordsMatch && <p className="text-green-600 text-sm mt-1 flex items-center gap-1"><Check size={14} />Passwords match</p>}
          </div>
          <Button type="submit" className="w-full py-4" disabled={!canSubmit || loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
        </form>
      </div>
    </div>
  );
}