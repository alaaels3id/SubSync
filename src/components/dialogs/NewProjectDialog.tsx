import React, { useState } from 'react';
import { X, FolderPlus, Video } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVideoFile: () => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  isOpen,
  onClose,
  onOpenVideoFile,
}) => {
  const { createNewProject, addRecentProject } = useProjectStore();
  const { videoSource } = usePlayerStore();
  const { language } = useSettingsStore();

  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (language === 'ar' ? 'مشروع جديد' : 'New Project');
    createNewProject(finalName);
    addRecentProject({
      id: `proj-${Date.now()}`,
      name: finalName,
      videoName: videoSource?.name,
      videoPath: videoSource?.path,
      lastOpened: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-brand-indigo-900 border border-brand-indigo-700 rounded-2xl shadow-2xl text-slate-100 p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-brand-indigo-700">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-brand-apricot" />
            <h3 className="text-base font-semibold">
              {language === 'ar' ? 'إنشاء مشروع جديد' : 'Create New Project'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {language === 'ar' ? 'اسم المشروع:' : 'Project Name:'}
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === 'ar' ? 'مثال: فيلم وثائقي - حلقة 1' : 'e.g. Documentary Episode 1'}
            className="w-full bg-slate-950 border border-brand-indigo-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-teal"
          />
        </div>

        {/* Video Source Picker Shortcut */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {language === 'ar' ? 'فيديو المشروع الرئيسي:' : 'Primary Video Source:'}
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-brand-indigo-800">
            <div className="flex items-center gap-2 truncate">
              <Video className="w-4 h-4 text-brand-teal-300 shrink-0" />
              <span className="text-xs text-slate-300 truncate">
                {videoSource ? videoSource.name : language === 'ar' ? 'لم يتم تحديد فيديو بعد' : 'No video selected'}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenVideoFile}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition shrink-0"
            >
              {language === 'ar' ? 'اختيار...' : 'Browse...'}
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs bg-brand-teal hover:bg-brand-teal-600 text-white font-medium transition"
          >
            {language === 'ar' ? 'بدء المشروع' : 'Start Project'}
          </button>
        </div>
      </form>
    </div>
  );
};
