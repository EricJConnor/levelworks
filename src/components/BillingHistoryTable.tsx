import { Download, FileText } from 'lucide-react';

interface BillingHistoryTableProps {
  invoices: any[];
}

/* Scoped to the `bh-` prefix so nothing here can reach another screen. */
const styles = `
.bh-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.bh-table { width: 100%; border-collapse: collapse; min-width: 460px; }
.bh-table th {
  text-align: left;
  padding: 10px 18px;
  font-size: 11.5px;
  font-weight: 650;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--lv-faint);
  border-bottom: 1px solid var(--lv-line);
  white-space: nowrap;
}
.bh-table td {
  padding: 13px 18px;
  font-size: 14.5px;
  color: var(--lv-ink-2);
  border-bottom: 1px solid var(--lv-line);
  white-space: nowrap;
}
.bh-table tr:last-child td { border-bottom: 0; }
.bh-amt { font-weight: 650; color: var(--lv-ink); }
.bh-r { text-align: right; }
.bh-empty { padding: 30px 18px; text-align: center; }
`;

const STATUS_TONE: Record<string, string> = {
  paid: 'green',
  open: 'amber',
  draft: '',
  void: '',
  uncollectible: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  open: 'Open',
  draft: 'Draft',
  void: 'Void',
  uncollectible: 'Failed',
};

export function BillingHistoryTable({ invoices }: BillingHistoryTableProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'usd'
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`lv-pill ${STATUS_TONE[status] ?? ''}`}>
        {STATUS_LABEL[status] || status}
      </span>
    );
  };

  return (
    <div className="lv-card">
      <style>{styles}</style>

      <div className="lv-card-head">
        <div>
          <span className="lv-eyebrow">Billing</span>
          <h2 className="lv-h2" style={{ marginTop: 2 }}>Billing history</h2>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bh-empty">
          <FileText size={26} style={{ color: 'var(--lv-faint)' }} />
          <p className="lv-small" style={{ marginTop: 8 }}>No payments yet. Your invoices show up here once you have been billed.</p>
        </div>
      ) : (
        <div className="bh-scroll">
          <table className="bh-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="bh-r">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="lv-num">{formatDate(invoice.created)}</td>
                  <td className="lv-num bh-amt">{formatAmount(invoice.amount_paid)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td className="bh-r">
                    {invoice.invoice_pdf && (
                      <button
                        className="lv-btn quiet sm"
                        type="button"
                        onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                      >
                        <Download size={15} />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
