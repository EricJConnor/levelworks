import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Check, X, Loader2 } from 'lucide-react';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || strength < 3) {
      toast({ title: 'Error', description: 'Please fix the errors before submitting', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Password updated successfully!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const CheckItem = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}<span>{text}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-orange-600" />
          </div>
          <div><CardTitle className="text-lg">Change Password</CardTitle><CardDescription>Update your account password</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <div className="relative">
              <Input id="current" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <div className="relative">
              <Input id="new" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2"><Progress value={strength * 20} className={`h-2 flex-1 ${strengthColor}`} /><span className={`text-xs font-medium ${strength <= 2 ? 'text-red-600' : strength <= 4 ? 'text-yellow-600' : 'text-green-600'}`}>{strengthLabel}</span></div>
                <div className="grid grid-cols-2 gap-1">
                  <CheckItem ok={checks.length} text="8+ characters" />
                  <CheckItem ok={checks.upper} text="Uppercase" />
                  <CheckItem ok={checks.lower} text="Lowercase" />
                  <CheckItem ok={checks.number} text="Number" />
                  <CheckItem ok={checks.special} text="Special char" />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <div className="relative">
              <Input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-500' : ''}`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && <p className="text-xs text-red-500">Passwords do not match</p>}
            {passwordsMatch && <p className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Passwords match</p>}
          </div>
          <Button type="submit" disabled={loading || !passwordsMatch || strength < 3} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
