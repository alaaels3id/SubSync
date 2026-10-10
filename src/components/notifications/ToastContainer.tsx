import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { useNotificationStore, NotificationType } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();
  const { language } = useSettingsStore();

  if (toasts.length === 0) return null;

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'test':
        return <Bell className="w-4 h-4 text-brand-apricot shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-brand-teal-300 shrink-0" />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 ${
        language === 'ar' ? 'left-4' : 'right-4'
      } z-50 flex flex-col gap-2 pointer-events-none max-w-sm`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 text-slate-100 rounded-xl p-3 shadow-2xl flex items-start gap-2.5 backdrop-blur-md transition-all animate-in slide-in-from-bottom-2"
        >
          {renderIcon(toast.type)}
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-xs text-slate-200">{toast.title}</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
