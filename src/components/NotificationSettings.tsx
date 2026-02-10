import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushSubscribed } from '@/lib/pushNotifications';

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    const subscribed = await isPushSubscribed();
    setPushEnabled(subscribed);
  };

  const loadPreferences = async () => {
    const { data } = await supabase.functions.invoke('get-notification-preferences', {
      body: { userId: 'user-123' }
    });
    if (data?.preferences) setPreferences(data.preferences);
  };

  const togglePushNotifications = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPushNotifications();
        setPushEnabled(false);
        toast({ title: 'Push notifications disabled' });
      } else {
        const success = await subscribeToPushNotifications('user-123');
        if (success) {
          setPushEnabled(true);
          toast({ title: 'Push notifications enabled!' });
        } else {
          toast({ title: 'Failed to enable push notifications', variant: 'destructive' });
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  const updatePreference = async (eventType: string, field: string, value: boolean) => {
    const updated = preferences.map(p => 
      p.eventType === eventType ? { ...p, [field]: value } : p
    );
    setPreferences(updated);
    await supabase.functions.invoke('update-notification-preferences', {
      body: { userId: 'user-123', preferences: updated }
    });
    toast({ title: 'Preferences updated' });
  };

  return (
    <Tabs defaultValue="push" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="push">Push Notifications</TabsTrigger>
        <TabsTrigger value="preferences">Email Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="push">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {pushEnabled ? <Bell className="h-5 w-5 text-green-500" /> : <BellOff className="h-5 w-5" />}
              Push Notifications
            </CardTitle>
            <CardDescription>Get instant alerts on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts when estimates are viewed, signed, or payments received</p>
              </div>
              <Button onClick={togglePushNotifications} disabled={pushLoading} variant={pushEnabled ? 'destructive' : 'default'}>
                {pushLoading ? 'Processing...' : pushEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
            {pushEnabled && (
              <div className="space-y-3">
                <h4 className="font-medium">You'll receive notifications for:</h4>
                <div className="grid gap-2">
                  {['Estimate Viewed', 'Estimate Signed', 'Payment Received', 'Invoice Paid', 'Referral Bonus', 'New Messages'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-green-500" />
                      {item}
                      {item === 'Referral Bonus' && <Badge variant="secondary" className="text-xs ml-2">New</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>Choose which email notifications to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.eventType} className="flex items-center justify-between p-4 border rounded-lg">
                <Label className="text-base font-medium capitalize">{pref.eventType.replace(/_/g, ' ')}</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Switch checked={pref.emailEnabled} onCheckedChange={(v) => updatePreference(pref.eventType, 'emailEnabled', v)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
