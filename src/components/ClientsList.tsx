import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useData, Client } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onViewClient: (client: Client) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ clients, onAddClient, onViewClient }) => {
  const { deleteClient, updateClient } = useData();
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
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

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setNewClient({ name: client.name, email: client.email, phone: client.phone, address: client.address });
    setShowAddClient(true);
  };

  const handleDelete = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this client?')) {
      deleteClient(clientId);
      toast({ title: 'Deleted' });
    }
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
            <Card key={client.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer min-w-0" onClick={() => onViewClient(client)}>
                  <h3 className="font-semibold text-base md:text-lg mb-1 truncate">{client.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{client.email}</p>
                  <p className="text-sm text-gray-600">{client.phone}</p>
                  <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                    <span>{client.totalJobs} jobs</span>
                    <span className="font-semibold">${client.totalValue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-3">
                  <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800 text-sm p-2">Edit</button>
                  <button onClick={(e) => handleDelete(client.id, e)} className="text-red-600 hover:text-red-800 text-sm p-2">Delete</button>
                </div>
              </div>
            </Card>
          ))}
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
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input type="email" placeholder="client@email.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} required className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Phone *</label>
              <input placeholder="(555) 123-4567" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} required className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Address *</label>
              <input placeholder="123 Main St" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} required className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none" />
            </div>
            <Button type="submit" className="w-full py-4 text-base">{editingClient ? 'Update' : 'Add Client'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
