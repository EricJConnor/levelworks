/**
 * The one translation flow, shared by every screen that has text a client will
 * read: the estimate builder, the invoice builder, and a job update.
 *
 * It never translates and applies in one step. The contractor sees his own
 * words beside the translation and chooses — this text becomes a contract, so
 * he reads it first. Keeping it in one place is also what stops the estimate
 * and the invoice from drifting into two different features.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Languages, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang, useT } from '@/i18n';
import { looksSpanish, translateItems, type Direction } from '@/lib/translate';

/** One piece of writing to translate. `label` names it in the review list. */
export interface Piece {
  id: string;
  text: string;
  label?: string;
}

interface Options {
  pieces: Piece[];
  /** Gives the model the job's context; never itself translated. */
  projectName?: string;
  /** Called with id → translated text for the pieces that came back. */
  onApply: (translations: Map<string, string>) => void;
  /** Shown when there is nothing to send — e.g. everything is already current. */
  emptyTitle?: string;
  emptyBody?: string;
}

export function useTranslator({ pieces, projectName, onApply, emptyTitle, emptyBody }: Options) {
  const t = useT();
  const { lang } = useLang();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; text: string }[]>([]);

  // Direction is guessed from what he has already written, so the button
  // almost always reads the way he needs it. With nothing written yet, fall
  // back to the language he set the app to: a contractor working in Spanish is
  // writing Spanish and wants English out.
  const written = pieces.map((p) => p.text || '').filter((s) => s.trim());
  const direction: Direction = written.length
    ? (written.some(looksSpanish) ? 'es-en' : 'en-es')
    : (lang === 'es' ? 'es-en' : 'en-es');

  const label = direction === 'es-en' ? t('tr.toEnglish') : t('tr.toSpanish');

  const start = async () => {
    const items = pieces.filter((p) => (p.text || '').trim()).map((p) => ({ id: p.id, text: p.text }));
    if (items.length === 0) {
      toast({
        title: emptyTitle || t('tr.nothingToTranslate'),
        description: emptyBody || t('tr.nothingToTranslateBody'),
        variant: emptyTitle ? 'default' : 'destructive',
      });
      return;
    }
    setBusy(true);
    setOpen(true);
    const res = await translateItems(direction, items, projectName?.trim() || undefined);
    setBusy(false);
    if (!res.ok) {
      setOpen(false);
      toast({ title: t('tr.failed'), description: res.message, variant: 'destructive' });
      return;
    }
    setResult(res.items);
  };

  const close = () => { if (!busy) { setOpen(false); setResult([]); } };

  const apply = () => {
    onApply(new Map(result.map((r) => [r.id, r.text])));
    setOpen(false);
    setResult([]);
    toast({ title: t('tr.applied'), description: t('tr.appliedBody') });
  };

  /** The button. Each screen places it; none of them restyles it. */
  const button = (
    <button className="lv-btn sec sm eb-translate" onClick={start} disabled={busy} type="button">
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />}
      {busy ? t('tr.translating') : label}
    </button>
  );

  const panelMarkup = open ? (
    // stopPropagation: this panel can open on top of another modal, and a
    // click on its own backdrop must not also close the screen underneath.
    <div className="lv-scrim" onClick={(e) => { e.stopPropagation(); close(); }}>
      <div className="lv-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="lv-modal-head">
          <div>
            <span className="lv-eyebrow">{direction === 'es-en' ? 'Español → English' : 'English → Español'}</span>
            <h2 className="lv-h2" style={{ marginTop: 2 }}>{t('tr.title')}</h2>
          </div>
          <button className="lv-icon-btn" onClick={close} disabled={busy} aria-label={t('a.close')} type="button"><X size={20} /></button>
        </div>
        <div className="lv-modal-body">
          {busy ? (
            <div className="eb-tr-loading">
              <Loader2 size={26} className="animate-spin" />
              <p className="lv-sub">{t('tr.translating')}</p>
            </div>
          ) : (
            <>
              <p className="lv-sub" style={{ marginBottom: 16 }}>{t('tr.intro')}</p>
              <div className="eb-tr-list">
                {result.map((r) => {
                  const original = pieces.find((p) => p.id === r.id);
                  return (
                    <div className="eb-tr-row" key={r.id}>
                      <div>
                        <span className="lv-eyebrow">{original?.label || t('tr.original')}</span>
                        <p className="eb-tr-text was">{original?.text || ''}</p>
                      </div>
                      <div>
                        <span className="lv-eyebrow">{t('tr.translated')}</span>
                        <p className="eb-tr-text now">{r.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="lv-modal-foot">
          <div className="lv-actions">
            <button className="lv-btn quiet" onClick={close} disabled={busy} type="button">{t('a.cancel')}</button>
            <div className="spacer" />
            <button className="lv-btn pri span" onClick={apply} disabled={busy || result.length === 0} type="button">
              <Check size={16} /> {t('tr.apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Rendered into <body>: this panel opens on top of screens that are
  // themselves modals with `overflow: hidden`, and a portal is what keeps it
  // from being clipped by whichever one it opened over.
  const panel = panelMarkup && typeof document !== 'undefined'
    ? createPortal(panelMarkup, document.body)
    : null;

  return { direction, translating: busy, label, start, button, panel };
}
