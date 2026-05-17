import { toast } from 'sonner-native';
import { haptic } from './haptics';

export const showToast = {
  success: (message: string, description?: string) => {
    haptic.success();
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    haptic.error();
    toast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    haptic.light();
    toast(message, { description });
  },
  warning: (message: string, description?: string) => {
    haptic.warning();
    toast.warning(message, { description });
  },
};
