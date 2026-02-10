import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  userEmail?: string;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion',
        variant: 'destructive'
      });
      return;
    }

    setDeleting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'No user session found. Please sign in again.',
          variant: 'destructive'
        });
        setDeleting(false);
        return;
      }

      console.log('Deleting account for user:', user.id);

      // Call the delete-account edge function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { 
          userId: user.id,
          confirmEmail: user.email
        }
      });

      console.log('Delete account response:', data, error);

      if (error) {
        console.error('Delete account error:', error);
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.success === false && data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Account Deleted',
        description: data?.warning || 'Your account and all data have been permanently deleted.'
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/';

    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
        variant: 'destructive'
      });
      setDeleting(false);
    }
  };


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Your Account?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-gray-900">
              This action cannot be undone.
            </p>
            <p>
              This will permanently delete your account and remove all your data including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
              <li>All estimates and invoices</li>
              <li>All client information</li>
              <li>All job records</li>
              <li>Your profile and settings</li>
              <li>Chat history with AI assistant</li>
              <li>Any uploaded photos</li>
            </ul>
            <div className="pt-4">
              <Label htmlFor="confirm-delete" className="text-sm font-medium text-gray-900">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="mt-2"
                disabled={deleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
