import { useEffect, useState, useCallback } from 'react';
import type { TelegramWebApp, TelegramUser } from '@/types/telegram';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      
      // Initialize the WebApp
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0d1117');
      tg.setBackgroundColor('#0d1117');
      
      setIsReady(true);
    } else {
      // Mock user for development outside Telegram
      setUser({
        id: 123456789,
        first_name: 'DarK',
        last_name: 'Code',
        username: 'darkcode',
        is_premium: true,
      });
      setIsReady(true);
    }
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (!webApp?.HapticFeedback) return;
    
    if (type === 'selection') {
      webApp.HapticFeedback.selectionChanged();
    } else if (['success', 'error', 'warning'].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning');
    } else {
      webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
    }
  }, [webApp]);

  const showPopup = useCallback((message: string, title?: string) => {
    if (webApp) {
      webApp.showPopup({ title, message });
    } else {
      alert(message);
    }
  }, [webApp]);

  const openTelegramLink = useCallback((url: string) => {
    if (webApp) {
      webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  return {
    webApp,
    user,
    isReady,
    hapticFeedback,
    showPopup,
    openTelegramLink,
  };
};
