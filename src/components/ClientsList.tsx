import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { useData, Client } from '@/contexts/DataContext';
import { useProfile } from '@/contexts/ProfileContext';
import { RecurringBillingPanel } from './RecurringBillingPanel';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, Phone, MapPin, Plus } from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onViewClient?: (client: Client) => void;
  onCreateEstimate?: () => void;
  onConnectStripe?: () => void;
}

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

  const handleClientUpdated = (updates: Partial<Client>) => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, updates);
    setSelectedClient(prev => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Clients</h2>
        <Button size="sm" className="w-full sm:w-auto py-3" onClick={() => { setEditingClient(null); setNewClient({ name: '', email: '', phone: '', address: '' }); setShowAddClient(true); }}>+ Add Client</Button>
      </div>

      {clients.length === 0 ? (
        <div style={{ background: '#1c1c1e', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)' }}>
          <Mail style={{ width: '40px', height: '40px', color: '#52525b', margin: '0 auto 12px' }} />
          <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '16px' }}>No clients yet. Add your first client!</p>
          <button onClick={() => { setEditingClient(null); setNewClient({ name: '', email: '', phone: '', address: '' }); setShowAddClient(true); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Add Your First Client</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {clients.map(client => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              style={{ background: '#1c1c1e', borderRadius: '12px', padding: '18px 20px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 4px' }} className="truncate">{client.name}</h3>
                    {client.billingStatus === 'past_due' && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Past Due</span>
                    )}
                  </div>
                  {client.email && <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 2px' }} className="truncate">{client.email}</p>}
                  {client.phone && <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>{client.phone}</p>}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#a1a1aa' }}>{getClientEstimates(client.name).length} estimates</span>
                    <span style={{ fontWeight: '600', color: '#60a5fa' }}>${client.totalValue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-3">
                  <button onClick={(e) => handleEdit(client, e)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '13px', padding: '6px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={(e) => handleDelete(client.id, e)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '13px', padding: '6px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl" style={{ background: '#1c1c1e' }}>
            <div className="text-white p-4 flex justify-between items-center rounded-t-xl sticky top-0" style={{background: '#1c1c1e', borderBottom: '0.5px solid rgba(255,255,255,0.1)'}}>
              <h2 className="text-lg font-bold">{selectedClient.name}</h2>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-400 font-semibold uppercase">Contact Info</p>
                {selectedClient.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{selectedClient.phone}</span>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{selectedClient.address}</span>
                  </div>
                )}
                {!selectedClient.email && !selectedClient.phone && !selectedClient.address && (
                  <p className="text-sm text-gray-500">No contact details saved.</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Recurring Billing</p>
                {!selectedClient.email ? (
                  <p className="text-sm text-gray-500 bg-white/5 rounded-lg p-4">Add an email address for this client to enable recurring billing.</p>
                ) : profile?.stripe_account_id ? (
                  <RecurringBillingPanel
                    client={selectedClient}
                    stripeAccountId={profile.stripe_account_id}
                    onUpdated={handleClientUpdated}
                  />
                ) : (
                  <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-400">
                    Connect your Stripe account to enable recurring billing.
                    {onConnectStripe && (
                      <button onClick={onConnectStripe} className="block mt-2 text-blue-400 font-semibold hover:underline">Connect Stripe →</button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Estimates</p>
                {getClientEstimates(selectedClient.name).length === 0 ? (
                  <p className="text-sm text-gray-500 bg-white/5 rounded-lg p-4">No estimates yet for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {getClientEstimates(selectedClient.name).map(est => (
                      <div key={est.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm text-gray-200">{est.projectName}</p>
                          <p className="text-xs text-gray-400">{new Date(est.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-white">${est.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            est.status === 'approved' ? 'bg-green-100 text-green-700' :
                            est.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{est.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedClient(null); setEditingClient(selectedClient); setNewClient({ name: selectedClient.name, email: selectedClient.email, phone: selectedClient.phone, address: selectedClient.address }); setShowAddClient(true); }}
                  className="flex-1 px-4 py-3 border-2 border-blue-400 text-blue-400 rounded-lg hover:bg-blue-400/10 font-semibold text-sm"
                >
                  Edit Client
                </button>
                {onCreateEstimate && (
                  <button
                    onClick={() => { setSelectedClient(null); onCreateEstimate(); }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> New Estimate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="mx-2 max-w-md p-0 overflow-hidden bg-[#1c1c1e] border-white/10">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <DialogTitle className="text-lg font-bold">{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <button onClick={() => setShowAddClient(false)} className="p-1 hover:bg-blue-700 rounded"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">Name *</label>
              <input placeholder="Client name" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">Email</label>
              <input type="email" placeholder="client@email.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">Phone</label>
              <input placeholder="(555) 123-4567" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">Address</label>
              <input placeholder="123 Main St" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <Button type="submit" className="w-full py-4 text-base">{editingClient ? 'Update' : 'Add Client'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
