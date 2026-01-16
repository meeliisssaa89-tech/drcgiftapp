import { useCallback } from 'react';
import { useTelegram } from './useTelegram';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

/**
 * Enhanced haptic feedback hook with convenience methods
 * Provides granular control over haptic feedback throughout the app
 */
export const useHaptics = () => {
  const { hapticFeedback, isTelegram } = useTelegram();

  // Button press feedback
  const buttonPress = useCallback(() => {
    hapticFeedback('light');
  }, [hapticFeedback]);

  // Tab/selection change
  const selectionChange = useCallback(() => {
    hapticFeedback('selection');
  }, [hapticFeedback]);

  // Success action (claim reward, win, etc.)
  const success = useCallback(() => {
    hapticFeedback('success');
  }, [hapticFeedback]);

  // Error action (insufficient funds, failed action)
  const error = useCallback(() => {
    hapticFeedback('error');
  }, [hapticFeedback]);

  // Warning (confirm action, alert)
  const warning = useCallback(() => {
    hapticFeedback('warning');
  }, [hapticFeedback]);

  // Heavy impact (spin start, big action)
  const heavy = useCallback(() => {
    hapticFeedback('heavy');
  }, [hapticFeedback]);

  // Medium impact (spin during, moderate action)
  const medium = useCallback(() => {
    hapticFeedback('medium');
  }, [hapticFeedback]);

  // Generic trigger with type
  const trigger = useCallback((type: HapticType) => {
    hapticFeedback(type);
  }, [hapticFeedback]);

  // Double tap effect
  const doubleTap = useCallback(() => {
    hapticFeedback('light');
    setTimeout(() => hapticFeedback('light'), 100);
  }, [hapticFeedback]);

  // Success with celebration (for wins)
  const celebrate = useCallback(() => {
    hapticFeedback('success');
    setTimeout(() => hapticFeedback('medium'), 150);
    setTimeout(() => hapticFeedback('light'), 300);
  }, [hapticFeedback]);

  // Notification received
  const notification = useCallback(() => {
    hapticFeedback('warning');
  }, [hapticFeedback]);

  return {
    buttonPress,
    selectionChange,
    success,
    error,
    warning,
    heavy,
    medium,
    trigger,
    doubleTap,
    celebrate,
    notification,
    isTelegram,
  };
};
