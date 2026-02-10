import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Smartphone, Share, MoreVertical, Plus, Download, ChevronRight } from 'lucide-react';

export const AddToHomeScreen: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'iphone' | 'android'>('iphone');

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost" size="sm" className="gap-2 !bg-white/20 hover:!bg-white/30 !text-white border border-white/50">
        <Smartphone size={16} />
        <span className="hidden sm:inline">Add to Phone</span>
        <span className="sm:hidden">Install</span>
      </Button>



      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="text-blue-600" />
              Add Level to Your Phone
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 text-sm mb-4">
            Install Level on your home screen for quick access - works just like a native app!
          </p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('iphone')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                activeTab === 'iphone' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              iPhone / iPad
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                activeTab === 'android' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Android
            </button>
          </div>

          {activeTab === 'iphone' ? <IPhoneInstructions /> : <AndroidInstructions />}

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Once installed, Level will appear on your home screen and work offline!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function IPhoneInstructions() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Safari Browser (Required)</h3>
      <div className="space-y-3">
        <Step number={1} icon={<Share size={18} />} title="Tap the Share button" desc="Located at the bottom of Safari (square with arrow pointing up)" />
        <Step number={2} icon={<ChevronRight size={18} />} title="Scroll down in the menu" desc="Look through the list of options" />
        <Step number={3} icon={<Plus size={18} />} title='Tap "Add to Home Screen"' desc="It has a plus icon next to it" />
        <Step number={4} icon={<Download size={18} />} title='Tap "Add"' desc="Confirm by tapping Add in the top right corner" />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-amber-800"><strong>Note:</strong> You must use Safari. This feature doesn't work in Chrome or other browsers on iPhone.</p>
      </div>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Chrome Browser</h3>
      <div className="space-y-3">
        <Step number={1} icon={<MoreVertical size={18} />} title="Tap the menu button" desc="Three dots in the top right corner" />
        <Step number={2} icon={<Download size={18} />} title='Tap "Install app" or "Add to Home screen"' desc="You may need to scroll down to find it" />
        <Step number={3} icon={<Plus size={18} />} title='Tap "Install" or "Add"' desc="Confirm the installation" />
      </div>
      <h3 className="font-semibold text-gray-800 mt-6">Samsung Internet</h3>
      <div className="space-y-3">
        <Step number={1} icon={<MoreVertical size={18} />} title="Tap the menu button" desc="Three lines at the bottom right" />
        <Step number={2} icon={<Plus size={18} />} title='Tap "Add page to" then "Home screen"' desc="Select Home screen from options" />
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
