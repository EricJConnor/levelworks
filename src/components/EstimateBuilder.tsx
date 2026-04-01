import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { SendEstimateModal } from './SendEstimateModal';
import { X, Plus, Trash2, Users, Edit } from 'lucide-react';

interface LineItem { id: string; description: string; quantity: number; rate: number; total: number; }
interface Props { onClose: () => void; onConvertToInvoice?: (data: any) => void; existingEstimate?: any; }

const safeNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const cleanLineItem = (item: any, index: number): LineItem | null => {
  if (!item) return null;
  const description = safeString(item.description).trim();
  const quantity = safeNumber(item.quantity);
  const rate = safeNumber(item.rate);
  if (!description || quantity <= 0) return null;
  return {
    id: safeString(item.id || `item-${index}-${Date.now()}`),
    description,
    quantity,
    rate,
    total: quantity * rate
  };
};

export const EstimateBuilder: React.FC<Props> = ({ onClose, onConvertToInvoice, existingEstimate }) => {
  const { addEstimate, updateEstimate, refreshEstimates, addClient, clients } = useData();
  const [clientName, setClientName] = useState(existingEstimate?.clientName || '');
  const [clientEmail, setClientEmail] = useState(existingEstimate?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(existingEstimate?.clientPhone || '');
  const [projectName, setProjectName] = useState(existingEstimate?.projectName || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(existingEstimate?.lineItems || [{ id: '1', description: '', quantity: 1, rate: 0, total: 0 }]);
  const [taxRate, setTaxRate] = useState(Number(existingEstimate?.taxRate) || 0);
  const [deposit, setDeposit] = useState(Number(existingEstimate?.deposit) || 0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [savedEstimateData, setSavedEstimateData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(!!existingEstimate);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const balanceDue = total - deposit;

  const addLineItem = () => setLineItems([...lineItems, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, total: 0 }]);

  const updateItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') updated.total = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => { if (lineItems.length > 1) setLineItems(lineItems.filter(item => item.id !== id)); };

  const saveEstimate = async (forSending = false): Promise<any> => {
    if (!clientName.trim()) { toast({ title: 'Error', description: 'Please enter client name', variant: 'destructive' }); return null; }
    if (!projectName.trim()) { toast({ title: 'Error', description: 'Please enter project name', variant: 'destructive' }); return null; }
    if (forSending && !clientEmail.trim()) { toast({ title: 'Error', description: 'Client email is required to send estimate', variant: 'destructive' }); return null; }

    setIsSaving(true);

    try {
      const existingToken = existingEstimate?.viewToken || existingEstimate?.view_token;
      const viewToken = (existingToken && String(existingToken).trim() !== '') ? existingToken : crypto.randomUUID();

      const validItems = lineItems
        .map((item, index) => cleanLineItem(item, index))
        .filter((item): item is LineItem => item !== null);

      if (validItems.length === 0) {
        toast({ title: 'Error', description: 'Please add at least one line item with a description and quantity', variant: 'destructive' });
        setIsSaving(false);
        return null;
      }

      const estimateData = {
        clientName: safeString(clientName).trim(),
        clientEmail: safeString(clientEmail).trim(),
        clientPhone: safeString(clientPhone).trim(),
        projectName: safeString(projectName).trim(),
        lineItems: validItems,
        taxRate: safeNumber(taxRate),
        deposit: safeNumber(deposit),
        total: safeNumber(total),
        status: 'draft' as const,
        viewToken
      };

      let resultId: string;
      let resultViewToken: string;

      if (existingEstimate?.id) {
        await updateEstimate(existingEstimate.id, estimateData);
        resultId = existingEstimate.id;
        resultViewToken = viewToken;
      } else {
        const saveResult = await addEstimate(estimateData);
        resultId = saveResult.id;
        resultViewToken = saveResult.viewToken;

        if (clientName.trim()) {
          const exists = clients.some(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
          if (!exists) {
            try {
              await addClient({ name: clientName.trim(), email: clientEmail.trim(), phone: clientPhone.trim(), address: '', totalJobs: 0, totalValue: 0 });
            } catch (e) {
              console.log('[EstimateBuilder] Client save skipped:', e);
            }
          }
        }
      }

      await refreshEstimates();
      const result = { id: resultId, ...estimateData, viewToken: resultViewToken };
      return result;

    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save estimate', variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const result = await saveEstimate(false);
    if (result) { toast({ title: 'Success', description: 'Estimate saved successfully' }); onClose(); }
  };

  const handleSendEstimate = async () => {
    const result = await saveEstimate(true);
    if (result && result.id && result.viewToken) {
      setSavedEstimateData(result);
      setShowSendModal(true);
    } else if (result) {
      toast({ title: 'Error', description: 'Failed to prepare estimate for sending. Please try again.', variant: 'destructive' });
    }
  };

  const handleSendModalClose = () => { setShowSendModal(false); setSavedEstimateData(null); };
  const handleSendSuccess = () => { setShowSendModal(false); setSavedEstimateData(null); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-auto">

        <div className="sticky top-0 bg-blue-600 text-white p-3 md:p-4 flex justify-between items-center z-10">
          <h2 className="text-lg md:text-2xl font-bold">
            {isReadOnly ? 'View Estimate' : existingEstimate ? 'Edit Estimate' : 'Create Estimate'}
          </h2>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <button
                onClick={() => setIsReadOnly(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 text-sm"
              >
                <Edit size={16} /> Edit
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded"><X size={24} /></button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            {!isReadOnly && clients.length > 0 && (
              <div className="md:col-span-3 mb-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowClientPicker(!showClientPicker)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-sm"
                  >
                    <Users size={16} /> Choose Saved Client
                  </button>
                  {showClientPicker && (
                    <div className="absolute top-12 left-0 z-50 bg-white border-2 border-gray-200 rounded-xl shadow-xl w-80 max-h-64 overflow-auto">
                      <div className="p-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700">Select a client</p>
                      </div>
                      {clients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setClientName(c.name);
                            setClientEmail(c.email || '');
                            setClientPhone(c.phone || '');
                            setShowClientPicker(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0"
                        >
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                          {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">Client Name *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600" placeholder="Enter client name" disabled={isReadOnly} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Client Email</label>
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600" placeholder="client@email.com" type="email" disabled={isReadOnly} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Client Phone</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600" placeholder="(555) 123-4567" type="tel" disabled={isReadOnly} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold mb-2">Project Name *</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600" placeholder="Enter project name" disabled={isReadOnly} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Line Items</h3>
              {!isReadOnly && <button onClick={addLineItem} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={18} /> Add</button>}
            </div>
            <div className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-semibold text-gray-600">Item {idx + 1}</span>
                    {!isReadOnly && <button onClick={() => removeItem(item.id)} className="text-red-600 p-1"><Trash2 size={18} /></button>}
                  </div>
                  <div className="space-y-3">
                    <textarea value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full border-2 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:outline-none resize-none disabled:bg-gray-100" placeholder="Description" rows={2} disabled={isReadOnly} />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Qty</label>
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border-2 rounded-lg px-3 py-3 text-base text-center focus:border-blue-500 focus:outline-none disabled:bg-gray-100" disabled={isReadOnly} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Rate</label>
                        <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full border-2 rounded-lg px-3 py-3 text-base text-center focus:border-blue-500 focus:outline-none disabled:bg-gray-100" disabled={isReadOnly} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Total</label>
                        <div className="w-full border-2 border-gray-200 bg-gray-100 rounded-lg px-3 py-3 text-base text-center font-semibold">${(Number(item.total) || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-3 mb-6">
            <div className="flex justify-between text-base"><span>Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span>Tax:</span>
              <div className="flex items-center gap-2">
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-16 border-2 rounded px-2 py-2 text-center text-base disabled:bg-gray-100" disabled={isReadOnly} />
                <span>%</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-3"><span>Total:</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
            <div className="flex justify-between items-center border-t pt-3">
              <span>Deposit:</span>
              <input type="number" value={deposit} onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} className="w-32 border-2 rounded px-3 py-2 text-base font-semibold text-right disabled:bg-gray-100" disabled={isReadOnly} />
            </div>
            <div className="flex justify-between text-lg font-bold"><span>Balance Due:</span><span className="text-green-600">${balanceDue.toFixed(2)}</span></div>
          </div>

          {isReadOnly ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => setIsReadOnly(false)} className="px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base flex items-center justify-center gap-2">
                <Edit size={18} /> Edit Estimate
              </button>
              <button onClick={handleSendEstimate} disabled={isSaving} className="px-4 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base disabled:opacity-50">
                Send
              </button>
              <button onClick={onClose} className="px-4 py-4 border-2 rounded-lg hover:bg-gray-50 font-semibold text-base">Close</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base disabled:opacity-50">{isSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={handleSendEstimate} disabled={isSaving} className="px-4 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base disabled:opacity-50">{isSaving ? 'Saving...' : 'Send'}</button>
              <button onClick={() => onConvertToInvoice?.({ clientName, clientEmail, clientPhone, projectName, lineItems, taxRate, deposit })} className="px-4 py-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-semibold text-base">Convert to Invoice</button>
              <button onClick={onClose} className="px-4 py-4 border-2 rounded-lg hover:bg-gray-50 font-semibold text-base">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {showSendModal && savedEstimateData && (
        <SendEstimateModal
          estimateData={savedEstimateData}
          onClose={handleSendModalClose}
          onSuccess={handleSendSuccess}
        />
      )}
    </div>
  );
};
