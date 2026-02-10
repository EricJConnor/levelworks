import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { X, ArrowLeft, Loader2, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form fields when modal closes or mode changes
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
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

        if (data?.user && !data.session) {
          toast({ title: 'Check your email', description: 'We sent you a confirmation link.', duration: 7000 });
          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) throw new Error('No session returned');
        
        // Store remember me preference
        if (!rememberMe) {
          sessionStorage.setItem('clearSessionOnClose', 'true');
        } else {
          sessionStorage.removeItem('clearSessionOnClose');
        }
        
        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify session is available
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Session not established');
      }
      
      toast({ title: isSignUp ? 'Account created!' : 'Welcome back!' });
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { 
      toast({ title: 'Please enter your email', variant: 'destructive' }); 
      return; 
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'We sent you a password reset link.', duration: 7000 });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { 
      setLoading(false); 
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return 'Reset Password';
    return isSignUp ? 'Create Account' : 'Sign In';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="mx-2 max-w-md p-0 overflow-hidden">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isForgotPassword && (
              <button 
                onClick={() => setIsForgotPassword(false)} 
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                type="button"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <DialogTitle className="text-lg font-bold">{getTitle()}</DialogTitle>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="p-5 space-y-4">
            <p className="text-sm text-gray-600">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="John Smith"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Lock size={16} />
                Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6} 
                className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
            {!isSignUp && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}`}>
                    {rememberMe && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="sr-only" 
                  />
                  <span className="text-sm font-medium text-gray-700">Keep me signed in</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)} 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
            <button 
              type="button" 
              className="w-full py-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors" 
              onClick={handleModeSwitch}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
