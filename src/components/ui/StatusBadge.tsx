import { cn } from '@/lib/utils';
import type { CustomerStatus, OpportunityStage, PaymentStatus, ApprovalStatus } from '@/types';

type BadgeType = CustomerStatus | OpportunityStage | PaymentStatus | ApprovalStatus | string;

const colorMap: Record<string, string> = {
  // Status
  OPEN: 'bg-accent/15 text-accent',
  IN_PROGRESS: 'bg-warning/15 text-warning',
  WAITING: 'bg-muted text-muted-foreground',
  DONE: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/15 text-destructive',
  // Priority
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-accent/15 text-accent',
  HIGH: 'bg-warning/15 text-warning',
  URGENT: 'bg-destructive/15 text-destructive',
  // Customer
  NEW_LEAD: 'bg-accent/15 text-accent',
  PURCHASED: 'bg-success/15 text-success',
  DORMANT: 'bg-muted text-muted-foreground',
  CLOSED: 'bg-muted text-muted-foreground',
  // Opp stages
  CONTACTED: 'bg-accent/15 text-accent',
  DEMO_SCHEDULED: 'bg-warning/15 text-warning',
  DEMO_DONE: 'bg-warning/15 text-warning',
  NEGOTIATION: 'bg-warning/15 text-warning',
  FOLLOW_UP: 'bg-warning/15 text-warning',
  WAITING_APPROVAL: 'bg-warning/15 text-warning',
  COMPARING: 'bg-warning/15 text-warning',
  WON: 'bg-success/15 text-success',
  LOST: 'bg-destructive/15 text-destructive',
  // Shipping
  DRAFT: 'bg-muted text-muted-foreground',
  RESERVED: 'bg-warning/15 text-warning',
  SHIPPED: 'bg-accent/15 text-accent',
  DELIVERED: 'bg-success/15 text-success',
  // Payment
  UNPAID: 'bg-destructive/15 text-destructive',
  DEPOSIT_PAID: 'bg-accent/15 text-accent',
  PARTIAL: 'bg-warning/15 text-warning',
  PAID: 'bg-success/15 text-success',
  // Approval
  SUBMITTED: 'bg-accent/15 text-accent',
  APPROVED: 'bg-success/15 text-success',
  REJECTED: 'bg-destructive/15 text-destructive',
  CUSTOMER_SIGNED: 'bg-blue-500/15 text-blue-600',
  // Slip status
  NO_SLIP: 'bg-muted text-muted-foreground',
  PENDING_VERIFY: 'bg-warning/15 text-warning',
  VERIFIED: 'bg-success/15 text-success',
  // Inventory
  AVAILABLE: 'bg-success/15 text-success',
  OUT: 'bg-destructive/15 text-destructive',
  // Visit
  NEW: 'bg-accent/15 text-accent',
  VISIT_FORM: 'bg-accent/15 text-accent',
  REPORT: 'bg-success/15 text-success',
  WEEKLY_PLAN: 'bg-warning/15 text-warning',
  // QC
  QC_PASSED: 'bg-success/15 text-success',
  QC_FAILED: 'bg-destructive/15 text-destructive',
  PENDING_QC: 'bg-warning/15 text-warning',
  READY_TO_SELL: 'bg-success/15 text-success',
  INSTALLED: 'bg-accent/15 text-accent',
  SENT_FOR_REPAIR: 'bg-destructive/15 text-destructive',
};

export default function StatusBadge({ status, className }: { status: BadgeType; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide',
      colorMap[status] || 'bg-muted text-muted-foreground',
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
