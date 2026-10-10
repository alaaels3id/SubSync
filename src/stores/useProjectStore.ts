import { create } from 'zustand';

export interface RecentProject {
  id: string;
  name: string;
  videoPath?: string;
  videoName?: string;
  lastOpened: number;
}

interface ProjectState {
  projectName: string;
  projectPath: string | null;
  isDirty: boolean;
  lastSaved: number | null;
  autosaveEnabled: boolean;
  recentProjects: RecentProject[];

  setProjectName: (name: string) => void;
  setProjectPath: (path: string | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setLastSaved: (timestamp: number) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  addRecentProject: (project: RecentProject) => void;
  createNewProject: (name: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'مشروع جديد (New Project)',
  projectPath: null,
  isDirty: false,
  lastSaved: null,
  autosaveEnabled: true,
  recentProjects: [
    {
      id: 'demo-sample-1',
      name: 'عرض توضيحي لمزامنة الترجمة',
      videoName: 'sample-tutorial.mp4',
      lastOpened: Date.now() - 3600000,
    },
  ],

  setProjectName: (name) => set({ projectName: name, isDirty: true }),
  setProjectPath: (projectPath) => set({ projectPath }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setLastSaved: (timestamp) => set({ lastSaved: timestamp, isDirty: false }),
  setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),

  addRecentProject: (project) =>
    set((state) => {
      const filtered = state.recentProjects.filter((p) => p.id !== project.id && p.name !== project.name);
      return { recentProjects: [project, ...filtered].slice(0, 10) };
    }),

  createNewProject: (name) =>
    set({
      projectName: name,
      projectPath: null,
      isDirty: false,
      lastSaved: null,
    }),
}));
