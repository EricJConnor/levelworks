import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Smartphone, Share, MoreVertical, Plus, Download, ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';
import {
  canInstall, isIOS, isIOSButNotSafari, isStandalone, onInstallChange, promptInstall,
} from '@/lib/installPrompt';

/**
 * One tap where the browser allows it.
 *
 * Android and desktop Chrome hand us a real install prompt, so the button
 * installs the app there and no dialog ever opens. **iPhone has no such API** —
 * Apple exposes no way to add to the home screen from script — so on iOS the
 * button opens the two steps instead. Once the app is installed the button
 * disappears entirely; offering to install something already installed is the
 * kind of small wrongness that makes an app feel unfinished.
 */
export const AddToHomeScreen: React.FC = () => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(canInstall());
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => onInstallChange(() => {
    setReady(canInstall());
    setInstalled(isStandalone());
  }), []);

  if (installed) return null;

  const ios = isIOS();

  const handleClick = async () => {
    if (ready) {
      const outcome = await promptInstall();
      // 'accepted' fires `appinstalled`, which hides the button for us.
      if (outcome !== 'unavailable') return;
    }
    setOpen(true);
  };

  return (
    <>
      <button onClick={handleClick} className="lv-a2hs">
        {ready ? <Download size={16} /> : <Smartphone size={16} />}
        <span>{t('nav.addToPhone')}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="text-blue-600" />
              {t('mod.addToPhoneTitle')}
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 text-sm mb-4">
            {t('mod.addToPhoneSub')}
          </p>

          {isIOSButNotSafari() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>{t('mod.noteLabel')}</strong> {t('mod.openInSafari')}
              </p>
            </div>
          )}

          {ios ? <IPhoneInstructions /> : <AndroidInstructions />}

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              {t('mod.onceInstalled')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function IPhoneInstructions() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">{t('mod.safariRequired')}</h3>
      <div className="space-y-3">
        <Step number={1} icon={<Share size={18} />} title={t('mod.iosStep1')} desc={t('mod.iosStep1Desc')} />
        <Step number={2} icon={<ChevronRight size={18} />} title={t('mod.iosStep2')} desc={t('mod.iosStep2Desc')} />
        <Step number={3} icon={<Plus size={18} />} title={t('mod.iosStep3')} desc={t('mod.iosStep3Desc')} />
        <Step number={4} icon={<Download size={18} />} title={t('mod.iosStep4')} desc={t('mod.iosStep4Desc')} />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-amber-800"><strong>{t('mod.noteLabel')}</strong> {t('mod.safariOnlyNote')}</p>
      </div>
    </div>
  );
}

function AndroidInstructions() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">{t('mod.chromeBrowser')}</h3>
      <div className="space-y-3">
        <Step number={1} icon={<MoreVertical size={18} />} title={t('mod.androidStep1')} desc={t('mod.androidStep1Desc')} />
        <Step number={2} icon={<Download size={18} />} title={t('mod.androidStep2')} desc={t('mod.androidStep2Desc')} />
        <Step number={3} icon={<Plus size={18} />} title={t('mod.androidStep3')} desc={t('mod.androidStep3Desc')} />
      </div>
      <h3 className="font-semibold text-gray-800 mt-6">{t('mod.samsungInternet')}</h3>
      <div className="space-y-3">
        <Step number={1} icon={<MoreVertical size={18} />} title={t('mod.samsungStep1')} desc={t('mod.samsungStep1Desc')} />
        <Step number={2} icon={<Plus size={18} />} title={t('mod.samsungStep2')} desc={t('mod.samsungStep2Desc')} />
      </div>
    </div>
  );
}

function Step({ number, icon, title, desc }: { number: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{number}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium text-gray-800">{icon}{title}</div>
        <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
