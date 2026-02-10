import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StripePaymentForm } from './StripePaymentForm';

interface UpdatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UpdatePaymentDialog({ open, onOpenChange, onSuccess }: UpdatePaymentDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <StripePaymentForm onSuccess={handleSuccess} isUpdate={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}