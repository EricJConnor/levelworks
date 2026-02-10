import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export const EstimateView: React.FC = () => {
  const { id } = useParams();
  const [estimate, setEstimate] = useState<any>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signerName, setSignerName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`estimate-${id}`);
    if (stored) {
      setEstimate(JSON.parse(stored));
    }
  }, [id]);

  const handleSign = async (signature: string) => {
    if (!signerName.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
      return;
    }

    try {
      const signedEstimate = { ...estimate, signature, signedBy: signerName, signedAt: new Date().toISOString(), status: 'signed' };
      localStorage.setItem(`estimate-${id}`, JSON.stringify(signedEstimate));
      setEstimate(signedEstimate);

      await supabase.functions.invoke('notify-signature', {
        body: { 
          estimateId: id, 
          clientName: estimate.clientName, 
          projectName: estimate.projectName,
          contractorEmail: 'contractor@example.com',
          contractorPhone: '+1234567890'
        }
      });

      toast({ title: 'Success!', description: 'Estimate signed successfully. The contractor has been notified.' });
      setShowSignature(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (!estimate) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const subtotal = estimate.lineItems?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const tax = subtotal * ((estimate.taxRate || 0) / 100);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Estimate</h1>
          <p className="text-gray-600">ID: {id}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Client Information</h3>
            <p className="text-lg font-semibold">{estimate.clientName}</p>
            {estimate.clientEmail && <p className="text-gray-600">{estimate.clientEmail}</p>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Project</h3>
            <p className="text-lg font-semibold">{estimate.projectName}</p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.lineItems?.map((item: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                <td className="p-3 text-right font-semibold">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-4 max-w-md ml-auto space-y-2 mb-8">
          <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax ({estimate.taxRate}%):</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-xl font-bold border-t pt-2"><span>Total:</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
        </div>

        {estimate.status === 'signed' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-800 mb-2">Signed</h3>
            <p className="text-gray-700">Signed by: {estimate.signedBy}</p>
            <p className="text-gray-600 text-sm">Date: {new Date(estimate.signedAt).toLocaleString()}</p>
            {estimate.signature && <img src={estimate.signature} alt="Signature" className="mt-4 border rounded" />}
          </div>
        ) : showSignature ? (
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">Sign Estimate</h3>
            <input value={signerName} onChange={(e) => setSignerName(e.target.value)} 
              className="w-full border rounded px-3 py-2 mb-4" placeholder="Enter your full name" />
            <SignatureCanvas onSave={handleSign} />
          </div>
        ) : (
          <button onClick={() => setShowSignature(true)} 
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg">
            Sign Estimate
          </button>
        )}
      </div>
    </div>
  );
};
