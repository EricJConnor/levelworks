import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { useData, Client } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { X, Mail, Phone, MapPin, Plus } from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onViewClient?: (client: Client) => void;
  onCreateEstimate?: () => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ clients, onAddClient, onCreateEstimate }) => {
  const { deleteClient, updateClient, estimates } = useData();
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Clients</h2>
        <Button size="sm" className="w-full sm:w-auto py-3" onClick={() => { setEditingClient(null); setNewClient({ name: '', email: '', phone: '', address: '' }); setShowAddClient(true); }}>+ Add Client</Button>
      </div>

      {clients.length === 0 ? (
        <Card className="p-6 md:p-8 text-center text-gray-500"><p>No clients yet. Add your first client!</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {clients.map(client => (
            <Card
              key={client.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg mb-1 truncate">{client.name}</h3>
                  {client.email && <p className="text-sm text-gray-600 truncate">{client.email}</p>}
                  {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                  <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                    <span>{getClientEstimates(client.name).length} estimates</span>
                    <span className="font-semibold text-blue-600">${client.totalValue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-3">
                  <button onClick={(e) => handleEdit(client, e)} className="text-blue-600 hover:text-blue-800 text-sm p-2">Edit</button>
                  <button onClick={(e) => handleDelete(client.id, e)} className="text-red-600 hover:text-red-800 text-sm p-2">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
            <div className="text-white p-4 flex justify-between items-center rounded-t-xl sticky top-0" style={{background: '#1c1c1e'}}>
              <h2 className="text-lg font-bold">{selectedClient.name}</h2>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-blue-700 rounded-lg">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase">Contact Info</p>
                {selectedClient.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{selectedClient.phone}</span>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{selectedClient.address}</span>
                  </div>
                )}
                {!selectedClient.email && !selectedClient.phone && !selectedClient.address && (
                  <p className="text-sm text-gray-400">No contact details saved.</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Estimates</p>
                {getClientEstimates(selectedClient.name).length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4">No estimates yet for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {getClientEstimates(selectedClient.name).map(est => (
                      <div key={est.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{est.projectName}</p>
                          <p className="text-xs text-gray-500">{new Date(est.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">${est.total.toFixed(2)}</p>
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
                  className="flex-1 px-4 py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-sm"
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
        <DialogContent className="mx-2 max-w-md p-0 overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <DialogTitle className="text-lg font-bold">{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <button onClick={() => setShowAddClient(false)} className="p-1 hover:bg-blue-700 rounded"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name *</label>
              <input placeholder="Client name" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input type="email" placeholder="client@email.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Phone</label>
              <input placeholder="(555) 123-4567" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Address</label>
              <input placeholder="123 Main St" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <Button type="submit" className="w-full py-4 text-base">{editingClient ? 'Update' : 'Add Client'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
