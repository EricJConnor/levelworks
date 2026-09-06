import React, { useState, useEffect } from 'react';
import { useData, Client } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { RecurringBillingPanel } from './RecurringBillingPanel';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, Phone, MapPin, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { useT } from '@/i18n';

interface ClientsListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onViewClient?: (client: Client) => void;
  onCreateEstimate?: () => void;
  onConnectStripe?: () => void;
}

const money = (n: number) => `$${(Number(n) || 0).toLocaleString()}`;

export const ClientsList: React.FC<ClientsListProps> = ({ clients, onAddClient, onCreateEstimate, onConnectStripe }) => {
  const { deleteClient, updateClient, refreshClients, estimates } = useData();
  const { profile } = useProfile();
  const t = useT();
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, newClient);
      toast({ title: t('lst.clientUpdated'), description: t('lst.clientUpdatedBody') });
      setEditingClient(null);
    } else {
      onAddClient({ ...newClient, totalJobs: 0, totalValue: 0 });
      toast({ title: t('lst.clientAdded'), description: t('lst.clientAddedBody') });
    }
    setNewClient({ name: '', email: '', phone: '', address: '' });
    setShowAddClient(false);
  };

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setNewClient({ name: client.name, email: client.email, phone: client.phone, address: client.address });
    setShowAddClient(true);
  };

  const handleDelete = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('lst.confirmDeleteClient'))) {
      deleteClient(clientId);
      toast({ title: t('lst.clientDeleted') });
      if (selectedClient?.id === clientId) setSelectedClient(null);
    }
  };

  const getClientEstimates = (clientName: string) => {
    return estimates.filter(e => e.clientName?.toLowerCase() === clientName.toLowerCase());
  };

  // Pick up billing status changes that landed via the Stripe webhook since the last load.
  useEffect(() => { refreshClients(); }, []);

  // The add/edit form was a Radix dialog before the restyle; keep its escape-to-close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showAddClient) setShowAddClient(false);
      else if (selectedClient) setSelectedClient(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAddClient, selectedClient]);

  const handleClientUpdated = (updates: Partial<Client>) => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, updates);
    setSelectedClient(prev => (prev ? { ...prev, ...updates } : prev));
  };

  const openAddClient = () => {
    setEditingClient(null);
    setNewClient({ name: '', email: '', phone: '', address: '' });
    setShowAddClient(true);
  };

  const STATUS_KEY: Record<string, string> = { draft: 's.draft', sent: 's.sent', approved: 's.approved', rejected: 's.rejected' };

  const statusPill = (status: string) => {
    const tone = status === 'approved' ? 'green' : status === 'sent' ? 'blue' : status === 'rejected' ? 'red' : '';
    return (
      <span className={`lv-pill ${tone}`}>
        {STATUS_KEY[status] ? t(STATUS_KEY[status]) : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <style>{`
        .cl-row { display: flex; align-items: center; gap: 10px; padding: 0 10px 0 18px; border-bottom: 1px solid var(--lv-line); }
        .cl-row:last-child { border-bottom: 0; }
        .cl-open {
          flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 14px 8px 14px 0; background: none; border: 0; text-align: left;
          font: inherit; color: inherit; cursor: pointer; border-radius: var(--lv-r-sm);
        }
        .cl-row:hover { background: var(--lv-surface-2); }
        .cl-open:focus-visible { outline: 2px solid var(--lv-blue); outline-offset: -2px; }
        .cl-name { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .cl-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cl-act { width: 40px; height: 40px; flex-shrink: 0; }
        .cl-act.del:hover { background: var(--lv-red-soft); color: var(--lv-red); }
        .cl-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .cl-contact { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--lv-line); font-size: 14.5px; color: var(--lv-ink-2); word-break: break-word; }
        .cl-contact:last-child { border-bottom: 0; }
        .cl-form { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .cl-contact svg { color: var(--lv-faint); flex-shrink: 0; }
        @media (max-width: 520px) {
          .cl-open { flex-direction: column; align-items: flex-start; gap: 6px; }
          .cl-meta { gap: 8px; }
        }
      `}</style>

      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{t('nav.clients')}</h1>
          <p className="lv-sub">{t('lst.clientsSub')}</p>
        </div>
        <button className="lv-btn pri" onClick={openAddClient}><Plus size={16} /> {t('lst.addClient')}</button>
      </div>

      {clients.length === 0 ? (
        <div className="lv-empty">
          <Users size={30} />
          <h3>{t('lst.noClientsYet')}</h3>
          <p>{t('lst.noClientsBody')}</p>
          <button className="lv-btn pri" onClick={openAddClient}><Plus size={16} /> {t('lst.addFirstClient')}</button>
        </div>
      ) : (
        <div className="lv-card">
          {clients.map(client => {
            const count = getClientEstimates(client.name).length;
            return (
              <div className="cl-row" key={client.id}>
                <button className="cl-open" onClick={() => setSelectedClient(client)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="cl-name">
                      <span className="lv-row-t cl-clip">{client.name}</span>
                      {client.billingStatus === 'past_due' && <span className="lv-pill red">{t('s.pastDue')}</span>}
                    </div>
                    <div className="lv-row-s cl-clip">
                      {[client.email, client.phone].filter(Boolean).join(' · ') || t('lst.noContactDetails')}
                    </div>
                  </div>
                  <div className="cl-meta">
                    <span className="lv-small lv-num">{count === 1 ? t('lst.estimateCountOne', { count }) : t('lst.estimateCountMany', { count })}</span>
                    <span className="lv-row-r">{money(client.totalValue)}</span>
                  </div>
                </button>
                <button className="lv-icon-btn cl-act" onClick={(e) => handleEdit(client, e)} title={t('lst.editClient')} aria-label={t('lst.editNamed', { name: client.name })}>
                  <Pencil size={16} />
                </button>
                <button className="lv-icon-btn cl-act del" onClick={(e) => handleDelete(client.id, e)} title={t('lst.deleteClient')} aria-label={t('lst.deleteNamed', { name: client.name })}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedClient && (
        <div className="lv-scrim" onClick={() => setSelectedClient(null)}>
          <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={selectedClient.name}>
            <div className="lv-modal-head">
              <div style={{ minWidth: 0 }}>
                <span className="lv-eyebrow">{t('m.client')}</span>
                <h2 className="lv-h2" style={{ marginTop: 2 }}>{selectedClient.name}</h2>
              </div>
              <button className="lv-icon-btn" onClick={() => setSelectedClient(null)} aria-label={t('a.close')}><X size={20} /></button>
            </div>

            <div className="lv-modal-body">
              <div className="lv-stack">
                <div>
                  <span className="lv-eyebrow">{t('lst.contact')}</span>
                  <div className="lv-card lv-card-pad" style={{ marginTop: 8, paddingTop: 4, paddingBottom: 4 }}>
                    {selectedClient.email && <div className="cl-contact"><Mail size={16} /> {selectedClient.email}</div>}
                    {selectedClient.phone && <div className="cl-contact"><Phone size={16} /> {selectedClient.phone}</div>}
                    {selectedClient.address && <div className="cl-contact"><MapPin size={16} /> {selectedClient.address}</div>}
                    {!selectedClient.email && !selectedClient.phone && !selectedClient.address && (
                      <div className="cl-contact"><span className="lv-small">{t('lst.noContactDetailsSentence')}</span></div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="lv-eyebrow">{t('lst.recurringBilling')}</span>
                  <div style={{ marginTop: 8 }}>
                    {!selectedClient.email ? (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">{t('lst.addEmailForBilling')}</p>
                      </div>
                    ) : profile?.stripe_account_id ? (
                      <RecurringBillingPanel
                        client={selectedClient}
                        stripeAccountId={profile.stripe_account_id}
                        onUpdated={handleClientUpdated}
                      />
                    ) : (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">{t('lst.connectStripeForBilling')}</p>
                        {onConnectStripe && (
                          <button className="lv-btn sec sm" style={{ marginTop: 12 }} onClick={onConnectStripe}>{t('lst.connectStripe')}</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="lv-eyebrow">{t('nav.estimates')}</span>
                  <div style={{ marginTop: 8 }}>
                    {getClientEstimates(selectedClient.name).length === 0 ? (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">{t('lst.noEstimatesForClient')}</p>
                      </div>
                    ) : (
                      <div className="lv-card">
                        {getClientEstimates(selectedClient.name).map(est => (
                          <div className="lv-row" key={est.id}>
                            <div style={{ minWidth: 0 }}>
                              <div className="lv-row-t cl-clip">{est.projectName || t('lst.unnamedProject')}</div>
                              <div className="lv-row-s">{new Date(est.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="cl-meta">
                              <span className="lv-row-r">${est.total.toFixed(2)}</span>
                              {statusPill(est.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lv-modal-foot">
              <div className="lv-actions">
                <button
                  className="lv-btn sec"
                  onClick={() => { setSelectedClient(null); setEditingClient(selectedClient); setNewClient({ name: selectedClient.name, email: selectedClient.email, phone: selectedClient.phone, address: selectedClient.address }); setShowAddClient(true); }}
                >
                  <Pencil size={15} /> {t('lst.editClient')}
                </button>
                <div className="spacer" />
                {onCreateEstimate && (
                  <button className="lv-btn pri" onClick={() => { setSelectedClient(null); onCreateEstimate(); }}>
                    <Plus size={16} /> {t('nav.newEstimate')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddClient && (
        <div className="lv-scrim" onClick={() => setShowAddClient(false)}>
          <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editingClient ? t('lst.editClient') : t('lst.addClient')}>
            <form onSubmit={handleSubmit} className="cl-form">
              <div className="lv-modal-head">
                <h2 className="lv-h2">{editingClient ? t('lst.editClient') : t('lst.addClient')}</h2>
                <button type="button" className="lv-icon-btn" onClick={() => setShowAddClient(false)} aria-label={t('a.close')}><X size={20} /></button>
              </div>

              <div className="lv-modal-body">
                <label className="lv-field">
                  <span className="lv-label">{t('lst.nameRequired')}</span>
                  <input className="lv-input" placeholder={t('lst.clientNamePlaceholder')} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('m.email')}</span>
                  <input className="lv-input" type="email" placeholder="client@email.com" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('m.phone')}</span>
                  <input className="lv-input" placeholder="(555) 123-4567" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                </label>
                <label className="lv-field">
                  <span className="lv-label">{t('m.address')}</span>
                  <input className="lv-input" placeholder={t('lst.addressPlaceholder')} value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
                </label>
              </div>

              <div className="lv-modal-foot">
                <div className="lv-actions">
                  <button type="button" className="lv-btn sec" onClick={() => setShowAddClient(false)}>{t('a.cancel')}</button>
                  <div className="spacer" />
                  <button type="submit" className="lv-btn pri">{editingClient ? t('lst.saveChanges') : t('lst.addClient')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
