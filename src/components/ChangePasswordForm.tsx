import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';

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
  const strengthColor = strength <= 2 ? 'var(--lv-red)' : strength <= 4 ? 'var(--lv-amber)' : 'var(--lv-green)';
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || strength < 3) {
      toast({ title: 'Password not ready', description: 'Meet at least three of the rules and make both fields match.', variant: 'destructive' });
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

      toast({ title: 'Password updated', description: 'Use the new one next time you sign in.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Could not change password', description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const CheckItem = ({ ok, text }: { ok: boolean; text: string }) => (
    <span
      className="lv-small"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: ok ? 'var(--lv-green)' : 'var(--lv-faint)' }}
    >
      {ok ? <Check size={13} /> : <X size={13} />}{text}
    </span>
  );

  const eyeBtn = {
    position: 'absolute' as const,
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    background: 'none',
    border: 0,
    borderRadius: 'var(--lv-r-sm)',
    color: 'var(--lv-faint)',
    cursor: 'pointer',
  };

  return (
    <form className="lv-card" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
      <div className="lv-card-head">
        <div>
          <h2 className="lv-h2">Change password</h2>
          <p className="lv-small" style={{ marginTop: 3 }}>Enter the password you use now, then the new one twice.</p>
        </div>
      </div>

      <div className="lv-card-pad">
        <label className="lv-field">
          <span className="lv-label">Current password</span>
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              className="lv-input"
              id="current"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ paddingRight: 46 }}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={eyeBtn} aria-label={showCurrent ? 'Hide password' : 'Show password'}>
              {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        <label className="lv-field">
          <span className="lv-label">New password</span>
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              className="lv-input"
              id="new"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ paddingRight: 46 }}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtn} aria-label={showNew ? 'Hide password' : 'Show password'}>
              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        {newPassword && (
          <div style={{ marginTop: 10 }}>
            <div className="lv-inline" style={{ gap: 10, flexWrap: 'nowrap' }}>
              <span style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--lv-sunken)', overflow: 'hidden' }}>
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${strength * 20}%`,
                    background: strengthColor,
                    borderRadius: 999,
                    transition: 'width var(--lv-t) var(--lv-ease)',
                  }}
                />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: strengthColor, whiteSpace: 'nowrap' }}>{strengthLabel}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
              <CheckItem ok={checks.length} text="8 characters or more" />
              <CheckItem ok={checks.upper} text="Capital letter" />
              <CheckItem ok={checks.lower} text="Lower-case letter" />
              <CheckItem ok={checks.number} text="Number" />
              <CheckItem ok={checks.special} text="Symbol" />
            </div>
          </div>
        )}

        <label className="lv-field">
          <span className="lv-label">Confirm new password</span>
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              className="lv-input"
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ paddingRight: 46, borderColor: confirmPassword && !passwordsMatch ? 'var(--lv-red)' : undefined }}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        {confirmPassword && !passwordsMatch && (
          <p className="lv-small" style={{ marginTop: 7, color: 'var(--lv-red)' }}>The two passwords do not match.</p>
        )}
        {passwordsMatch && (
          <p className="lv-small" style={{ marginTop: 7, color: 'var(--lv-green)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} />Passwords match
          </p>
        )}
      </div>

      <div className="lv-card-foot">
        <button type="submit" className="lv-btn pri" disabled={loading || !passwordsMatch || strength < 3}>
          {loading ? <><Loader2 size={15} className="animate-spin" /> Updating</> : 'Update password'}
        </button>
      </div>
    </form>
  );
}
