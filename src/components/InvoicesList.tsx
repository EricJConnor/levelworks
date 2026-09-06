import React, { useState } from 'react';
import { useInvoices } from '@/contexts/InvoiceContext';
import { FileText, DollarSign, Calendar, Trash2, Link, Check, Send, X, Search, Plus, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { sendInvoiceEmail } from '@/lib/edgeFunctions';
import { useT } from '@/i18n';

interface InvoicesListProps {
  onCreateInvoice?: () => void;
}

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<string, string> = { unpaid: 'amber', partially_paid: 'blue', paid: 'green', overdue: 'red' };
const STATUS_KEY: Record<string, string> = { unpaid: 's.unpaid', partially_paid: 's.partlyPaid', paid: 's.paid', overdue: 's.overdue' };

/* Labels are resolved at render time, so `t` is never called at module scope. */
const FILTERS: { key: string; labelKey: string }[] = [
  { key: 'all', labelKey: 'lst.filterAll' },
  { key: 'unpaid', labelKey: 's.unpaid' },
  { key: 'partially_paid', labelKey: 's.partlyPaid' },
  { key: 'paid', labelKey: 's.paid' },
  { key: 'overdue', labelKey: 's.overdue' },
];

/* Scoped to the `iv-` prefix so nothing here can reach another screen. */
const styles = `
.iv-tools { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.iv-segwrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin: -3px; padding: 3px; }
.iv-segwrap::-webkit-scrollbar { display: none; }
.iv-find { display: flex; gap: 10px; min-width: 0; }
.iv-find .lv-search { flex: 1; min-width: 0; }
@media (min-width: 900px) {
  .iv-tools { flex-direction: row; align-items: center; justify-content: space-between; }
  .iv-find { flex: 0 1 460px; }
}
.iv-list { overflow: hidden; }
.iv-item + .iv-item { border-top: 1px solid var(--lv-line); }
.iv-row { align-items: flex-start; border-bottom: 0; padding-bottom: 10px; cursor: pointer; }
.iv-row:hover { background: var(--lv-surface-2); }
.iv-row:focus-visible { outline: 2px solid var(--lv-blue); outline-offset: -2px; }
.iv-main { min-width: 0; flex: 1; }
.iv-titleline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.iv-sub { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.iv-amt { flex-shrink: 0; text-align: right; }
.iv-amt .lv-small { margin-top: 2px; }
.iv-chev { flex-shrink: 0; color: var(--lv-faint); margin-top: 2px; }
.iv-acts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px 14px; }
.iv-sec + .iv-sec { margin-top: 18px; }
.iv-sec > .lv-eyebrow { display: block; margin-bottom: 8px; }
.iv-sum { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; font-size: 14.5px; color: var(--lv-mute); }
.iv-sum b { color: var(--lv-ink); font-weight: 650; }
.iv-sum.total { border-top: 1px solid var(--lv-line); margin-top: 6px; padding-top: 12px; font-size: 15px; font-weight: 600; color: var(--lv-ink); }
.iv-sum.total b { font-size: 19px; font-weight: 700; letter-spacing: -.02em; }
@media (max-width: 520px) {
  .iv-row { padding-left: 14px; padding-right: 14px; }
  .iv-acts { padding: 0 14px 14px; }
}
`;

export const InvoicesList: React.FC<InvoicesListProps> = ({ onCreateInvoice }) => {
  const { invoices, deleteInvoice, recordPayment, updateInvoice } = useInvoices();
  const { toast } = useToast();
  const t = useT();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; invoiceId: string | null }>({ open: false, invoiceId: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const handleMarkPaid = async (invoice: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const balanceDue = invoice.total - invoice.amountPaid;
    if (balanceDue <= 0) return;
    await recordPayment(invoice.id, balanceDue, t('lst.markedAsPaidNote'));
    setSelectedInvoice(null);
  };

  const handleRecordPayment = async () => {
    if (!paymentDialog.invoiceId || !paymentAmount) return;
    await recordPayment(paymentDialog.invoiceId, parseFloat(paymentAmount), paymentNote);
    setPaymentDialog({ open: false, invoiceId: null });
    setPaymentAmount('');
    setPaymentNote('');
    toast({ title: t('lst.paymentRecorded') });
  };

  const copyPaymentLink = (invoice: any) => {
    const link = `${window.location.origin}/view-invoice/${invoice.viewToken}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invoice.id);
    toast({ title: t('lst.paymentLinkCopied') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendInvoice = async (invoice: any) => {
    if (!invoice.clientEmail) {
      toast({ title: t('lst.noClientEmail'), description: t('lst.noClientEmailBody'), variant: 'destructive' });
      return;
    }
    setSendingId(invoice.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await sendInvoiceEmail({
        invoiceId: invoice.id,
        clientEmail: invoice.clientEmail,
        invoiceData: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientPhone: invoice.clientPhone,
          projectName: invoice.projectName,
          total: invoice.total,
          amountDue: invoice.total - invoice.amountPaid,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          viewToken: invoice.viewToken
        },
        userId: user?.id
      });
      if (result.error) throw result.error;
      await updateInvoice(invoice.id, { sentAt: new Date().toISOString() });
      toast({ title: t('lst.invoiceSent') });
    } catch (error: any) {
      toast({ title: t('lst.invoiceSendFailed'), description: error.message || `${t('e.somethingWrong')} ${t('e.tryAgain')}`, variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  const statusPill = (status: string) => (
    <span className={`lv-pill ${STATUS_TONE[status] ?? ''}`}>
      {STATUS_KEY[status] ? t(STATUS_KEY[status]) : String(status || '').replace('_', ' ')}
    </span>
  );

  const parseLineItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  const term = query.trim().toLowerCase();
  const visibleInvoices = invoices
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => !term
      || (i.clientName || '').toLowerCase().includes(term)
      || (i.projectName || '').toLowerCase().includes(term)
      || (i.invoiceNumber || '').toLowerCase().includes(term));

  const isFiltered = statusFilter !== 'all' || term.length > 0;
  const closePayment = () => setPaymentDialog({ open: false, invoiceId: null });

  return (
    <div>
      <style>{styles}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{t('nav.invoices')}</h1>
          <p className="lv-sub">{t('lst.invoicesSub')}</p>
        </div>
        <button className="lv-btn pri" onClick={onCreateInvoice}>
          <Plus size={16} /> {t('nav.newInvoice')}
        </button>
      </div>

      {invoices.length > 0 && (
        <div className="iv-tools">
          <div className="iv-segwrap">
            <div className="lv-seg" role="group" aria-label={t('lst.filterByStatus')}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={statusFilter === f.key ? 'on' : ''}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="iv-find">
            <div className="lv-search">
              <Search size={16} />
              <input
                className="lv-input"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('lst.searchInvoicesPlaceholder')}
                aria-label={t('lst.searchInvoices')}
              />
            </div>
          </div>
        </div>
      )}

      {visibleInvoices.length === 0 ? (
        <div className="lv-empty">
          <FileText size={30} />
          <h3>{isFiltered ? t('lst.nothingMatches') : t('lst.noInvoicesYet')}</h3>
          <p>
            {isFiltered
              ? t('lst.tryAnotherStatus')
              : t('lst.noInvoicesBody')}
          </p>
          {isFiltered ? (
            <button className="lv-btn sec" onClick={() => { setStatusFilter('all'); setQuery(''); }}>{t('a.clearFilters')}</button>
          ) : (
            <button className="lv-btn pri" onClick={onCreateInvoice}><Plus size={16} /> {t('nav.newInvoice')}</button>
          )}
        </div>
      ) : (
        <div className="lv-card iv-list">
          {visibleInvoices.map(invoice => {
            const due = invoice.total - invoice.amountPaid;
            return (
              <div className="iv-item" key={invoice.id}>
                <div
                  className="lv-row iv-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedInvoice(invoice)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedInvoice(invoice); } }}
                >
                  <div className="iv-main">
                    <div className="iv-titleline">
                      <span className="lv-row-t lv-num">{invoice.invoiceNumber}</span>
                      {statusPill(invoice.status)}
                      {!invoice.sentAt && <span className="lv-pill">{t('lst.notSent')}</span>}
                    </div>
                    <span className="lv-row-s iv-sub">
                      {invoice.clientName || t('lst.noClient')} · {invoice.projectName || t('lst.untitledProject')}
                    </span>
                  </div>
                  <div className="iv-amt">
                    <div className="lv-row-r lv-num">{money(invoice.total)}</div>
                    <div className="lv-small lv-num">{due > 0 ? t('lst.amountDue', { amount: money(due) }) : t('lst.paidInFull')}</div>
                  </div>
                  <ChevronRight className="iv-chev" size={18} />
                </div>

                <div className="iv-acts">
                  {invoice.status !== 'paid' && (
                    <button className="lv-btn go sm" onClick={(e) => handleMarkPaid(invoice, e)}>
                      <Check size={14} /> {t('lst.markPaidShort')}
                    </button>
                  )}
                  <button
                    className="lv-btn sec sm"
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={sendingId === invoice.id}
                  >
                    <Send size={14} />
                    {sendingId === invoice.id ? t('a.sending') : invoice.sentAt ? t('a.resend') : t('a.send')}
                  </button>
                  <button className="lv-btn quiet sm" onClick={() => copyPaymentLink(invoice)} disabled={!invoice.viewToken}>
                    {copiedId === invoice.id ? <Check size={14} /> : <Link size={14} />}
                    {copiedId === invoice.id ? t('a.copied') : t('a.copyLink')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedInvoice && (
        <div className="lv-scrim" onClick={() => setSelectedInvoice(null)}>
          <div className="lv-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="lv-modal-head">
              <div style={{ minWidth: 0 }}>
                <h2 className="lv-h2 lv-num">{selectedInvoice.invoiceNumber}</h2>
                <p className="lv-small" style={{ marginTop: 3 }}>{selectedInvoice.clientName} · {selectedInvoice.projectName}</p>
              </div>
              <button className="lv-icon-btn" onClick={() => setSelectedInvoice(null)} aria-label={t('a.close')}>
                <X size={20} />
              </button>
            </div>

            <div className="lv-modal-body">
              <div className="lv-inline">
                {statusPill(selectedInvoice.status)}
                {!selectedInvoice.sentAt && <span className="lv-pill">{t('lst.notSent')}</span>}
                <span className="lv-small lv-inline" style={{ gap: 5 }}>
                  <Calendar size={13} /> {t('lst.issuedOn', { date: new Date(selectedInvoice.issueDate).toLocaleDateString() })}
                </span>
                {selectedInvoice.dueDate && (
                  <span className="lv-small">{t('lst.dueOn', { date: new Date(selectedInvoice.dueDate).toLocaleDateString() })}</span>
                )}
              </div>

              <div className="iv-sec" style={{ marginTop: 18 }}>
                <span className="lv-eyebrow">{t('m.client')}</span>
                <div className="lv-card lv-card-pad">
                  <p className="lv-h3">{selectedInvoice.clientName}</p>
                  {selectedInvoice.clientEmail && <p className="lv-small" style={{ marginTop: 3 }}>{selectedInvoice.clientEmail}</p>}
                  {selectedInvoice.clientPhone && <p className="lv-small" style={{ marginTop: 2 }}>{selectedInvoice.clientPhone}</p>}
                </div>
              </div>

              <div className="iv-sec">
                <span className="lv-eyebrow">{t('lst.lineItems')}</span>
                <div className="lv-card">
                  {parseLineItems(selectedInvoice.lineItems).map((item: any, idx: number) => (
                    <div className="lv-row" key={idx} style={{ alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="lv-row-t" style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{item.description}</div>
                        <div className="lv-row-s lv-num">{item.quantity} × {money(Number(item.rate))}</div>
                      </div>
                      <span className="lv-row-r lv-num">{money(Number(item.total || item.quantity * item.rate))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="iv-sec">
                <div className="lv-card lv-card-pad">
                  <div className="iv-sum"><span>{t('m.total')}</span><b className="lv-num">{money(selectedInvoice.total)}</b></div>
                  <div className="iv-sum">
                    <span>{t('s.paid')}</span>
                    <b className="lv-num" style={{ color: 'var(--lv-green)' }}>−{money(selectedInvoice.amountPaid)}</b>
                  </div>
                  <div className="iv-sum total">
                    <span>{t('m.balanceDue')}</span>
                    <b className="lv-num">{money(selectedInvoice.total - selectedInvoice.amountPaid)}</b>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="iv-sec">
                  <span className="lv-eyebrow">{t('m.notes')}</span>
                  <div className="lv-card lv-card-pad">
                    <p className="lv-sub" style={{ whiteSpace: 'pre-wrap' }}>{selectedInvoice.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lv-modal-foot">
              <div className="lv-actions">
                <button
                  className="lv-btn pri span"
                  onClick={() => handleSendInvoice(selectedInvoice)}
                  disabled={sendingId === selectedInvoice.id}
                >
                  <Send size={16} />
                  {sendingId === selectedInvoice.id ? t('a.sending') : selectedInvoice.sentAt ? t('lst.resendInvoice') : t('lst.sendInvoice')}
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <>
                    <button className="lv-btn go" onClick={() => handleMarkPaid(selectedInvoice)}>
                      <Check size={16} /> {t('lst.markAsPaid')}
                    </button>
                    <button
                      className="lv-btn sec"
                      onClick={() => { setPaymentDialog({ open: true, invoiceId: selectedInvoice.id }); setSelectedInvoice(null); }}
                    >
                      <DollarSign size={16} /> {t('lst.recordPayment')}
                    </button>
                    <button className="lv-btn quiet" onClick={() => copyPaymentLink(selectedInvoice)} disabled={!selectedInvoice.viewToken}>
                      {copiedId === selectedInvoice.id ? <Check size={16} /> : <Link size={16} />}
                      {copiedId === selectedInvoice.id ? t('a.copied') : t('lst.copyPaymentLink')}
                    </button>
                  </>
                )}
                <span className="spacer" />
                <button
                  className="lv-btn danger"
                  onClick={() => { deleteInvoice(selectedInvoice.id); setSelectedInvoice(null); }}
                >
                  <Trash2 size={16} /> {t('a.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentDialog.open && (
        <div className="lv-scrim" onClick={closePayment}>
          <div className="lv-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="lv-modal-head">
              <h2 className="lv-h2">{t('lst.recordPayment')}</h2>
              <button className="lv-icon-btn" onClick={closePayment} aria-label={t('a.close')}><X size={20} /></button>
            </div>
            <div className="lv-modal-body">
              <label className="lv-field" htmlFor="amount">
                <span className="lv-label">{t('lst.paymentAmount')}</span>
                <input
                  id="amount"
                  className="lv-input num"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="lv-field" htmlFor="note">
                <span className="lv-label">{t('lst.noteOptional')}</span>
                <textarea
                  id="note"
                  className="lv-textarea"
                  rows={3}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={t('lst.paymentNotePlaceholder')}
                />
              </label>
            </div>
            <div className="lv-modal-foot">
              <div className="lv-actions">
                <button className="lv-btn sec" onClick={closePayment}>{t('a.cancel')}</button>
                <span className="spacer" />
                <button className="lv-btn go" onClick={handleRecordPayment} disabled={!paymentAmount}>{t('lst.recordPayment')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
