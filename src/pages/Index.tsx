import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { SubscriptionGate } from '@/components/SubscriptionGate';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <SubscriptionGate>
        <AppLayout />
      </SubscriptionGate>
    </AppProvider>
  );
};

export default Index;
