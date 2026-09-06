import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/pixel';
import { useToast } from '@/hooks/use-toast';
import { X, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useT } from '@/i18n';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result?: { isNewUser?: boolean }) => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const t = useT();

  // Reset form fields when modal closes or mode changes
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setIsForgotPassword(false);
  }, []);

  // Update isSignUp when defaultMode changes or modal opens
  useEffect(() => {
    if (open) {
      setIsSignUp(defaultMode === 'signup');
      // Reset form when modal opens to ensure clean state
      resetForm();
    }
  }, [open, defaultMode, resetForm]);

  // Handle modal close - reset form state
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle switching between signin and signup
  const handleModeSwitch = useCallback(() => {
    setIsSignUp(prev => !prev);
    // Clear password when switching modes for security
    setPassword('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({ title: t('e.somethingWrong'), description: t('mod.passwordsDoNotMatch'), variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
            }
          }
        });
        if (error) {
          console.error("Signup error:", error);
          throw error;
        }

        trackEvent('CompleteRegistration');

        if (data?.user && !data.session) {
          toast({ title: t('mod.checkYourEmail'), description: t('mod.confirmationLinkSent'), duration: 7000 });
          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) throw new Error('No session returned');

        // Session persisted by Supabase - keep me signed in works automatically
        localStorage.setItem('levelworks-remember-me', rememberMe ? 'true' : 'false');

        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verify session is available
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Session not established');
      }

      toast({ title: isSignUp ? t('mod.accountCreated') : t('mod.welcomeBack') });
      handleClose();
      onSuccess({ isNewUser: isSignUp });
    } catch (error: any) {
      toast({ title: t('e.somethingWrong'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: t('mod.enterYourEmail'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({ title: t('mod.checkYourEmail'), description: t('mod.resetLinkSent'), duration: 7000 });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: t('e.somethingWrong'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return t('mod.resetYourPassword');
    return isSignUp ? t('mod.createYourAccount') : t('a.signIn');
  };

  const getSub = () => {
    if (isForgotPassword) return t('mod.resetPasswordSub');
    return isSignUp
      ? t('mod.signUpSub')
      : t('mod.signInSub');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="lv-modal p-0 gap-0 border-0 [&>button]:hidden">

        <div className="lv-modal-head">
          <div className="lv-inline" style={{ gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="lv-icon-btn"
                style={{ marginLeft: -8 }}
                aria-label={t('a.back')}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <span className="lv-eyebrow">LevelWorks</span>
              <DialogTitle className="lv-h2">{getTitle()}</DialogTitle>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="lv-icon-btn" aria-label={t('a.close')}>
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <div className="lv-modal-body">
            <div className="lv-stack">
              <p className="lv-sub">{getSub()}</p>

              <div>
                {isSignUp && !isForgotPassword && (
                  <label className="lv-field">
                    <span className="lv-label">{t('mod.fullName')}</span>
                    <input
                      className="lv-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={t('mod.fullNamePlaceholder')}
                      autoComplete="name"
                      disabled={loading}
                    />
                  </label>
                )}

                <label className="lv-field">
                  <span className="lv-label">{t('m.email')}</span>
                  <input
                    className="lv-input"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('mod.emailPlaceholder')}
                    autoComplete="email"
                    disabled={loading}
                  />
                </label>

                {!isForgotPassword && (
                  <label className="lv-field">
                    <span className="lv-label">{t('mod.password')}</span>
                    <span style={{ position: 'relative', display: 'block' }}>
                      <input
                        className="lv-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder={t('mod.atLeast6Characters')}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        style={{ paddingRight: 46 }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="lv-icon-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('mod.hidePassword') : t('mod.showPassword')}
                        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34 }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </span>
                  </label>
                )}

                {isSignUp && !isForgotPassword && (
                  <label className="lv-field">
                    <span className="lv-label">{t('mod.confirmPassword')}</span>
                    <input
                      className="lv-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={t('mod.typeItOnceMore')}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </label>
                )}
              </div>

              {!isSignUp && !isForgotPassword && (
                <div className="lv-inline" style={{ justifyContent: 'space-between' }}>
                  <label className="lv-inline" style={{ gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: 17, height: 17, accentColor: 'var(--lv-blue)', cursor: 'pointer' }}
                    />
                    <span className="lv-small" style={{ color: 'var(--lv-ink-2)' }}>{t('mod.keepMeSignedIn')}</span>
                  </label>
                  <button
                    type="button"
                    className="lv-btn quiet sm"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    {t('mod.forgotPassword')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lv-modal-foot">
            {isForgotPassword ? (
              <div className="lv-actions">
                <button type="button" className="lv-btn quiet" onClick={() => setIsForgotPassword(false)} disabled={loading}>
                  {t('a.back')}
                </button>
                <span className="spacer" />
                <button type="submit" className="lv-btn pri" disabled={loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t('a.sending')}</> : t('mod.sendResetLink')}
                </button>
              </div>
            ) : (
              <div className="lv-actions">
                <button type="button" className="lv-btn quiet" onClick={handleModeSwitch}>
                  {isSignUp ? t('mod.signInInstead') : t('mod.createAnAccount')}
                </button>
                <span className="spacer" />
                <button type="submit" className="lv-btn pri" disabled={loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t('mod.pleaseWait')}</> : (isSignUp ? t('mod.createAccount') : t('a.signIn'))}
                </button>
              </div>
            )}
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
