import { useEffect, useState, useCallback, useMemo } from 'react';
import type { TelegramWebApp, TelegramUser } from '@/types/telegram';

// Check if running inside Telegram
const isTelegramEnvironment = (): boolean => {
  // Check for Telegram WebApp object
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    // Check if initData exists (only present when running in Telegram)
    return Boolean(tg.initData && tg.initData.length > 0);
  }
  return false;
};

const getDefaultMockUser = (): TelegramUser => ({
  id: 123456789,
  first_name: 'Dev',
  last_name: 'User',
  username: 'devuser',
  is_premium: false,
});

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initTelegram = () => {
      if (!mounted) return;
      
      const tg = window.Telegram?.WebApp;
      
      if (tg && isTelegramEnvironment()) {
        // Running inside Telegram
        setIsTelegram(true);
        setWebApp(tg);
        
        // Get user from initDataUnsafe
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          setUser({
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username,
            language_code: tgUser.language_code,
            is_premium: tgUser.is_premium,
            photo_url: tgUser.photo_url,
          });
        }
        
        // Signal that web app is ready
        tg.ready();
        
        // Expand to full height
        tg.expand();
        
        // Set theme colors to match app
        try {
          tg.setHeaderColor('#0d1117');
          tg.setBackgroundColor('#0d1117');
        } catch (e) {
          console.warn('Could not set header/background color:', e);
        }
        
        // Disable closing confirmation for better UX
        try {
          tg.disableClosingConfirmation();
        } catch (e) {
          // Some versions don't support this
        }
        
        setIsReady(true);
      } else {
        // Running in browser (development mode)
        setIsTelegram(false);
        
        // Check for mock user in localStorage or use default
        const mockUserData = localStorage.getItem('telegram_mock_user');
        if (mockUserData) {
          try {
            setUser(JSON.parse(mockUserData));
          } catch {
            setUser(getDefaultMockUser());
          }
        } else {
          setUser(getDefaultMockUser());
        }
        
        setIsReady(true);
      }
    };

    // Try immediately
    initTelegram();

    return () => {
      mounted = false;
    };
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (!webApp?.HapticFeedback) return;
    
    try {
      if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      } else if (['success', 'error', 'warning'].includes(type)) {
        webApp.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning');
      } else {
        webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
      }
    } catch (e) {
      // Silently fail if haptic not available
    }
  }, [webApp]);

  const showPopup = useCallback((message: string, title?: string) => {
    if (webApp) {
      try {
        webApp.showPopup({ title, message });
      } catch {
        alert(message);
      }
    } else {
      alert(message);
    }
  }, [webApp]);

  const showAlert = useCallback((message: string) => {
    if (webApp) {
      try {
        webApp.showAlert(message);
      } catch {
        alert(message);
      }
    } else {
      alert(message);
    }
  }, [webApp]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp) {
        try {
          webApp.showConfirm(message, (confirmed) => {
            resolve(confirmed);
          });
        } catch {
          resolve(window.confirm(message));
        }
      } else {
        resolve(window.confirm(message));
      }
    });
  }, [webApp]);

  const openTelegramLink = useCallback((url: string) => {
    if (webApp) {
      try {
        webApp.openTelegramLink(url);
      } catch {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  const openLink = useCallback((url: string) => {
    if (webApp) {
      try {
        webApp.openLink(url);
      } catch {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  const close = useCallback(() => {
    if (webApp) {
      try {
        webApp.close();
      } catch {
        // Cannot close in browser
      }
    }
  }, [webApp]);

  // Get start parameter from URL (for referrals, etc.)
  const startParam = useMemo(() => {
    if (webApp?.initDataUnsafe) {
      // In Telegram, get from initDataUnsafe
      return (webApp.initDataUnsafe as any).start_param || null;
    }
    // In browser, check URL params
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('start') || null;
  }, [webApp]);

  // Theme params from Telegram
  const themeParams = useMemo(() => {
    return webApp?.themeParams || null;
  }, [webApp]);

  // Platform info
  const platform = useMemo(() => {
    return webApp?.platform || 'unknown';
  }, [webApp]);

  const colorScheme = useMemo(() => {
    return webApp?.colorScheme || 'dark';
  }, [webApp]);

  return {
    webApp,
    user,
    isReady,
    isTelegram,
    hapticFeedback,
    showPopup,
    showAlert,
    showConfirm,
    openTelegramLink,
    openLink,
    close,
    startParam,
    themeParams,
    platform,
    colorScheme,
  };
};