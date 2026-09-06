import React, { useState, useEffect } from 'react';
import { useData, Client } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { RecurringBillingPanel } from './RecurringBillingPanel';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, Phone, MapPin, Plus, Users, Pencil, Trash2 } from 'lucide-react';

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
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, newClient);
      toast({ title: 'Success', description: 'Client updated!' });
      setEditingClient(null);
    } else {
      onAddClient({ ...newClient, totalJobs: 0, totalValue: 0 });
      toast({ title: 'Success', description: 'Client added!' });
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
    if (confirm('Delete this client?')) {
      deleteClient(clientId);
      toast({ title: 'Deleted' });
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

  const statusPill = (status: string) => {
    const tone = status === 'approved' ? 'green' : status === 'sent' ? 'blue' : status === 'rejected' ? 'red' : '';
    return <span className={`lv-pill ${tone}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
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
          <h1 className="lv-h1">Clients</h1>
          <p className="lv-sub">Everyone you work for, with the estimates written for them.</p>
        </div>
        <button className="lv-btn pri" onClick={openAddClient}><Plus size={16} /> Add client</button>
      </div>

      {clients.length === 0 ? (
        <div className="lv-empty">
          <Users size={30} />
          <h3>No clients yet</h3>
          <p>Add the people you work for once, and their details fill in on every estimate and invoice after that.</p>
          <button className="lv-btn pri" onClick={openAddClient}><Plus size={16} /> Add your first client</button>
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
                      {client.billingStatus === 'past_due' && <span className="lv-pill red">Past due</span>}
                    </div>
                    <div className="lv-row-s cl-clip">
                      {[client.email, client.phone].filter(Boolean).join(' · ') || 'No contact details saved'}
                    </div>
                  </div>
                  <div className="cl-meta">
                    <span className="lv-small lv-num">{count} {count === 1 ? 'estimate' : 'estimates'}</span>
                    <span className="lv-row-r">{money(client.totalValue)}</span>
                  </div>
                </button>
                <button className="lv-icon-btn cl-act" onClick={(e) => handleEdit(client, e)} title="Edit client" aria-label={`Edit ${client.name}`}>
                  <Pencil size={16} />
                </button>
                <button className="lv-icon-btn cl-act del" onClick={(e) => handleDelete(client.id, e)} title="Delete client" aria-label={`Delete ${client.name}`}>
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
                <span className="lv-eyebrow">Client</span>
                <h2 className="lv-h2" style={{ marginTop: 2 }}>{selectedClient.name}</h2>
              </div>
              <button className="lv-icon-btn" onClick={() => setSelectedClient(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="lv-modal-body">
              <div className="lv-stack">
                <div>
                  <span className="lv-eyebrow">Contact</span>
                  <div className="lv-card lv-card-pad" style={{ marginTop: 8, paddingTop: 4, paddingBottom: 4 }}>
                    {selectedClient.email && <div className="cl-contact"><Mail size={16} /> {selectedClient.email}</div>}
                    {selectedClient.phone && <div className="cl-contact"><Phone size={16} /> {selectedClient.phone}</div>}
                    {selectedClient.address && <div className="cl-contact"><MapPin size={16} /> {selectedClient.address}</div>}
                    {!selectedClient.email && !selectedClient.phone && !selectedClient.address && (
                      <div className="cl-contact"><span className="lv-small">No contact details saved.</span></div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="lv-eyebrow">Recurring billing</span>
                  <div style={{ marginTop: 8 }}>
                    {!selectedClient.email ? (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">Add an email address for this client to switch on recurring billing.</p>
                      </div>
                    ) : profile?.stripe_account_id ? (
                      <RecurringBillingPanel
                        client={selectedClient}
                        stripeAccountId={profile.stripe_account_id}
                        onUpdated={handleClientUpdated}
                      />
                    ) : (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">Connect your Stripe account to bill this client on a schedule.</p>
                        {onConnectStripe && (
                          <button className="lv-btn sec sm" style={{ marginTop: 12 }} onClick={onConnectStripe}>Connect Stripe</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="lv-eyebrow">Estimates</span>
                  <div style={{ marginTop: 8 }}>
                    {getClientEstimates(selectedClient.name).length === 0 ? (
                      <div className="lv-card lv-card-pad">
                        <p className="lv-small">No estimates written for this client yet.</p>
                      </div>
                    ) : (
                      <div className="lv-card">
                        {getClientEstimates(selectedClient.name).map(est => (
                          <div className="lv-row" key={est.id}>
                            <div style={{ minWidth: 0 }}>
                              <div className="lv-row-t cl-clip">{est.projectName || 'Unnamed project'}</div>
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
                  <Pencil size={15} /> Edit client
                </button>
                <div className="spacer" />
                {onCreateEstimate && (
                  <button className="lv-btn pri" onClick={() => { setSelectedClient(null); onCreateEstimate(); }}>
                    <Plus size={16} /> New estimate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddClient && (
        <div className="lv-scrim" onClick={() => setShowAddClient(false)}>
          <div className="lv-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editingClient ? 'Edit client' : 'Add client'}>
            <form onSubmit={handleSubmit} className="cl-form">
              <div className="lv-modal-head">
                <h2 className="lv-h2">{editingClient ? 'Edit client' : 'Add client'}</h2>
                <button type="button" className="lv-icon-btn" onClick={() => setShowAddClient(false)} aria-label="Close"><X size={20} /></button>
              </div>

              <div className="lv-modal-body">
                <label className="lv-field">
                  <span className="lv-label">Name *</span>
                  <input className="lv-input" placeholder="Client name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
                </label>
                <label className="lv-field">
                  <span className="lv-label">Email</span>
                  <input className="lv-input" type="email" placeholder="client@email.com" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                </label>
                <label className="lv-field">
                  <span className="lv-label">Phone</span>
                  <input className="lv-input" placeholder="(555) 123-4567" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                </label>
                <label className="lv-field">
                  <span className="lv-label">Address</span>
                  <input className="lv-input" placeholder="123 Main St" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
                </label>
              </div>

              <div className="lv-modal-foot">
                <div className="lv-actions">
                  <button type="button" className="lv-btn sec" onClick={() => setShowAddClient(false)}>Cancel</button>
                  <div className="spacer" />
                  <button type="submit" className="lv-btn pri">{editingClient ? 'Save changes' : 'Add client'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
