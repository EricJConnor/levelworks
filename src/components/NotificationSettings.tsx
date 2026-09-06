import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushSubscribed } from '@/lib/pushNotifications';

const ALERTS = [
  'An estimate is opened',
  'An estimate is signed',
  'A payment comes in',
  'An invoice is paid',
  'A referral signs up',
  'A new message arrives',
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        flexShrink: 0,
        width: 52,
        height: 40,
        padding: 0,
        border: 0,
        background: 'none',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'block',
          position: 'relative',
          width: 44,
          height: 26,
          borderRadius: 999,
          background: on ? 'var(--lv-blue)' : 'var(--lv-line-2)',
          transition: 'background var(--lv-t) var(--lv-ease)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: 'var(--lv-shadow-sm)',
            transform: on ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform var(--lv-t) var(--lv-ease)',
          }}
        />
      </span>
    </button>
  );
}

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
        toast({ title: 'Push notifications turned off' });
      } else {
        const success = await subscribeToPushNotifications('user-123');
        if (success) {
          setPushEnabled(true);
          toast({ title: 'Push notifications turned on' });
        } else {
          toast({ title: 'Could not turn on push notifications', description: 'Allow notifications for this site in your browser, then try again.', variant: 'destructive' });
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
    toast({ title: 'Notification settings saved' });
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">Notifications</h1>
          <p className="lv-sub">Choose how you hear about your jobs.</p>
        </div>
      </div>

      <div className="lv-card" style={{ marginBottom: 16 }}>
        <div className="lv-card-head">
          <div>
            <h2 className="lv-h2">On this device</h2>
            <p className="lv-small" style={{ marginTop: 3 }}>Alerts on your phone or laptop, even when the app is closed.</p>
          </div>
          <span className={`lv-pill ${pushEnabled ? 'green' : ''}`}>{pushEnabled ? 'On' : 'Off'}</span>
        </div>

        <div className="lv-row">
          <div style={{ minWidth: 0 }}>
            <div className="lv-row-t">Push notifications</div>
            <div className="lv-row-s">Get told the moment an estimate is opened, signed or paid.</div>
          </div>
          <button
            className={`lv-btn ${pushEnabled ? 'sec' : 'pri'}`}
            onClick={togglePushNotifications}
            disabled={pushLoading}
            style={{ flexShrink: 0 }}
          >
            {pushLoading ? 'Working' : pushEnabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>

        {pushEnabled && (
          <div className="lv-card-pad">
            <p className="lv-eyebrow" style={{ display: 'block', marginBottom: 10 }}>What you will be told about</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {ALERTS.map(item => (
                <div key={item} className="lv-small" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lv-ink-2)' }}>
                  <Bell size={14} style={{ color: 'var(--lv-blue)', flexShrink: 0 }} />{item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lv-card">
        <div className="lv-card-head">
          <div>
            <h2 className="lv-h2">Email</h2>
            <p className="lv-small" style={{ marginTop: 3 }}>Which of these should also reach your inbox.</p>
          </div>
        </div>

        {preferences.length === 0 ? (
          <div className="lv-card-pad">
            <p className="lv-sub">No email settings to show yet. They appear once your account has sent its first estimate.</p>
          </div>
        ) : (
          preferences.map((pref) => (
            <div key={pref.eventType} className="lv-row">
              <div style={{ minWidth: 0 }}>
                <div className="lv-row-t" style={{ textTransform: 'capitalize' }}>{pref.eventType.replace(/_/g, ' ')}</div>
                <div className="lv-row-s">Send me an email when this happens.</div>
              </div>
              <Toggle
                on={!!pref.emailEnabled}
                label={`Email me when ${pref.eventType.replace(/_/g, ' ')}`}
                onChange={(v) => updatePreference(pref.eventType, 'emailEnabled', v)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
