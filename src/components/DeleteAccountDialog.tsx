import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, X } from 'lucide-react';
import { useT } from '@/i18n';

interface DeleteAccountDialogProps {
  userEmail?: string;
}

type T = (key: string, vars?: Record<string, string | number>) => string;

const gone = (t: T) => [
  t('mod.goneEstimatesInvoices'),
  t('mod.goneClients'),
  t('mod.goneJobRecords'),
  t('mod.goneProfileSettings'),
  t('mod.goneChatHistory'),
  t('mod.gonePhotos'),
];

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const t = useT();

  // Lock the page behind the sheet and let Escape close it, the way the
  // other modals in the app behave. Never while the delete is in flight.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !deleting) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, deleting]);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: t('mod.confirmationRequired'),
        description: t('mod.typeDeleteToConfirmSub'),
        variant: 'destructive'
      });
      return;
    }

    setDeleting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: t('mod.noSessionFound'),
          description: t('mod.signInAgainToDelete'),
          variant: 'destructive'
        });
        setDeleting(false);
        return;
      }

      console.log('Deleting account for user:', user.id);

      // Call the delete-account edge function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: {
          userId: user.id,
          confirmEmail: user.email
        }
      });

      console.log('Delete account response:', data, error);

      if (error) {
        console.error('Delete account error:', error);
        throw new Error(error.message || t('mod.failedToDeleteAccount'));
      }

      if (data?.success === false && data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: t('mod.accountDeleted'),
        description: data?.warning || t('mod.accountDeletedSub')
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/';

    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: t('mod.couldNotDeleteAccount'),
        description: error instanceof Error ? error.message : t('mod.somethingWrongTryAgain'),
        variant: 'destructive'
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <button type="button" className="lv-btn danger wide" onClick={() => setOpen(true)}>
        <Trash2 size={15} /> {t('mod.deleteAccount')}
      </button>

      {open && (
        <div className="lv-scrim" onClick={() => { if (!deleting) setOpen(false); }}>
          <div className="lv-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label={t('mod.deleteYourAccount')}>
            <div className="lv-modal-head">
              <div>
                <span className="lv-eyebrow" style={{ color: 'var(--lv-red)' }}>{t('mod.permanent')}</span>
                <h2 className="lv-h2">{t('mod.deleteYourAccount')}</h2>
              </div>
              <button className="lv-icon-btn" onClick={() => setOpen(false)} disabled={deleting} aria-label={t('a.close')}>
                <X size={20} />
              </button>
            </div>

            <div className="lv-modal-body">
              <p className="lv-sub" style={{ color: 'var(--lv-ink-2)', fontWeight: 600 }}>
                {t('mod.cannotBeUndone')}
              </p>
              <p className="lv-sub" style={{ marginTop: 6 }}>
                {userEmail
                  ? t('mod.deletingAccountForRemoves', { email: userEmail })
                  : t('mod.deletingYourAccountRemoves')}
              </p>

              <ul className="lv-small" style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                {gone(t).map(item => <li key={item}>{item}</li>)}
              </ul>

              <hr className="lv-hr" />

              <label className="lv-field">
                <span className="lv-label">{t('mod.typeDeleteToConfirm')}</span>
                <input
                  className="lv-input"
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={deleting}
                />
              </label>
            </div>

            <div className="lv-modal-foot">
              <div className="lv-actions">
                <button className="lv-btn quiet" onClick={() => setOpen(false)} disabled={deleting}>{t('a.cancel')}</button>
                <span className="spacer" />
                <button
                  className="lv-btn danger"
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                >
                  {deleting
                    ? <><Loader2 size={15} className="animate-spin" /> {t('a.deleting')}</>
                    : <><Trash2 size={15} /> {t('mod.deleteAccount')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
