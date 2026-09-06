import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushSubscribed } from '@/lib/pushNotifications';
import { useT } from '@/i18n';

type T = (key: string, vars?: Record<string, string | number>) => string;

const alerts = (t: T) => [
  t('mod.alertEstimateOpened'),
  t('mod.alertEstimateSigned'),
  t('mod.alertPaymentComesIn'),
  t('mod.alertInvoicePaid'),
  t('mod.alertReferralSignsUp'),
  t('mod.alertNewMessage'),
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
  const t = useT();

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
        toast({ title: t('mod.pushTurnedOff') });
      } else {
        const success = await subscribeToPushNotifications('user-123');
        if (success) {
          setPushEnabled(true);
          toast({ title: t('mod.pushTurnedOn') });
        } else {
          toast({ title: t('mod.couldNotTurnOnPush'), description: t('mod.allowNotificationsInBrowser'), variant: 'destructive' });
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
    toast({ title: t('mod.notificationSettingsSaved') });
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="lv-page-head">
        <div>
          <h1 className="lv-h1">{t('nav.notifications')}</h1>
          <p className="lv-sub">{t('mod.notificationsSub')}</p>
        </div>
      </div>

      <div className="lv-card" style={{ marginBottom: 16 }}>
        <div className="lv-card-head">
          <div>
            <h2 className="lv-h2">{t('mod.onThisDevice')}</h2>
            <p className="lv-small" style={{ marginTop: 3 }}>{t('mod.onThisDeviceSub')}</p>
          </div>
          <span className={`lv-pill ${pushEnabled ? 'green' : ''}`}>{pushEnabled ? t('mod.on') : t('mod.off')}</span>
        </div>

        <div className="lv-row">
          <div style={{ minWidth: 0 }}>
            <div className="lv-row-t">{t('mod.pushNotifications')}</div>
            <div className="lv-row-s">{t('mod.pushNotificationsSub')}</div>
          </div>
          <button
            className={`lv-btn ${pushEnabled ? 'sec' : 'pri'}`}
            onClick={togglePushNotifications}
            disabled={pushLoading}
            style={{ flexShrink: 0 }}
          >
            {pushLoading ? t('mod.working') : pushEnabled ? t('mod.turnOff') : t('mod.turnOn')}
          </button>
        </div>

        {pushEnabled && (
          <div className="lv-card-pad">
            <p className="lv-eyebrow" style={{ display: 'block', marginBottom: 10 }}>{t('mod.whatYouWillBeToldAbout')}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {alerts(t).map(item => (
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
            <h2 className="lv-h2">{t('m.email')}</h2>
            <p className="lv-small" style={{ marginTop: 3 }}>{t('mod.emailSettingsSub')}</p>
          </div>
        </div>

        {preferences.length === 0 ? (
          <div className="lv-card-pad">
            <p className="lv-sub">{t('mod.noEmailSettingsYet')}</p>
          </div>
        ) : (
          preferences.map((pref) => (
            <div key={pref.eventType} className="lv-row">
              <div style={{ minWidth: 0 }}>
                <div className="lv-row-t" style={{ textTransform: 'capitalize' }}>{pref.eventType.replace(/_/g, ' ')}</div>
                <div className="lv-row-s">{t('mod.emailMeWhenThisHappens')}</div>
              </div>
              <Toggle
                on={!!pref.emailEnabled}
                label={t('mod.emailMeWhen', { event: pref.eventType.replace(/_/g, ' ') })}
                onChange={(v) => updatePreference(pref.eventType, 'emailEnabled', v)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
