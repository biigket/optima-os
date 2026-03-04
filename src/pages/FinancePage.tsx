import StatusBadge from '@/components/ui/StatusBadge';
import { mockFinanceDocs } from '@/data/mockData';
import { FileText } from 'lucide-react';

export default function FinancePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground">Documents and billing</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Document</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issue Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Approval</th>
            </tr>
          </thead>
          <tbody>
            {mockFinanceDocs.map(doc => (
              <tr key={doc.financeDocId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 flex items-center gap-2 font-medium text-foreground">
                  <FileText size={16} className="text-muted-foreground" />
                  {doc.financeDocId}
                </td>
                <td className="px-4 py-3"><StatusBadge status={doc.docType} /></td>
                <td className="px-4 py-3 text-muted-foreground">{doc.issueDate}</td>
                <td className="px-4 py-3 text-muted-foreground">{doc.dueDate}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">฿{doc.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={doc.paymentStatus} /></td>
                <td className="px-4 py-3"><StatusBadge status={doc.approvalStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
