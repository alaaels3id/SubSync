import React from 'react';
import { X, Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotificationStore, NotificationType } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isOpen, setIsOpen, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const { language } = useSettingsStore();

  if (!isOpen) return null;

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'test':
        return <Bell className="w-4 h-4 text-brand-apricot" />;
      default:
        return <Info className="w-4 h-4 text-brand-teal-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-[2px]">
      <div
        className={`absolute top-0 bottom-0 ${
          language === 'ar' ? 'left-0' : 'right-0'
        } w-80 bg-brand-indigo-900 border-x border-brand-indigo-700 shadow-2xl flex flex-col`}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-brand-indigo-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-apricot" />
            <h3 className="text-sm font-semibold text-slate-100">
              {language === 'ar' ? 'مركز الإشعارات' : 'Notification Center'}
            </h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 border-b border-brand-indigo-800/80 bg-slate-950/30 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={markAllAsRead}
            className="hover:text-slate-200 transition flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>{language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
          </button>
          <button
            onClick={clearAll}
            className="hover:text-rose-400 transition flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{language === 'ar' ? 'مسح السجل' : 'Clear all'}</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                item.read
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                  : 'bg-brand-indigo-800/60 border-brand-indigo-600 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {renderIcon(item.type)}
                <span className="font-semibold text-slate-200 truncate flex-1">{item.title}</span>
                {!item.read && <span className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {item.message}
              </p>
              <span className="block mt-1 text-[9px] text-slate-500 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs">
              {language === 'ar' ? 'سجل الإشعارات فارغ' : 'No notifications'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
