import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../useProjectStore';

describe('Zustand Store - useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projectName: 'مشروع جديد (New Project)',
      projectPath: null,
      isDirty: false,
      lastSaved: null,
      autosaveEnabled: true,
      recentProjects: [],
    });
  });

  it('updates project name and marks as dirty', () => {
    const { setProjectName } = useProjectStore.getState();
    setProjectName('Documentary Episode 2');

    const state = useProjectStore.getState();
    expect(state.projectName).toBe('Documentary Episode 2');
    expect(state.isDirty).toBe(true);
  });

  it('creates a new project and resets path and dirty flags', () => {
    const { setIsDirty, setProjectPath, createNewProject } = useProjectStore.getState();
    setIsDirty(true);
    setProjectPath('/path/to/old.subsync');

    createNewProject('Fresh Project');

    const state = useProjectStore.getState();
    expect(state.projectName).toBe('Fresh Project');
    expect(state.projectPath).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.lastSaved).toBeNull();
  });

  it('adds and limits recent projects to 10 items without duplicates', () => {
    const { addRecentProject } = useProjectStore.getState();

    for (let i = 1; i <= 12; i++) {
      addRecentProject({
        id: `p-${i}`,
        name: `Project ${i}`,
        lastOpened: Date.now() + i,
      });
    }

    const state = useProjectStore.getState();
    expect(state.recentProjects.length).toBe(10);
    expect(state.recentProjects[0].name).toBe('Project 12');

    // Adding existing project moves it to front
    addRecentProject({
      id: 'p-12',
      name: 'Project 12',
      lastOpened: Date.now() + 100,
    });
    expect(useProjectStore.getState().recentProjects.length).toBe(10);
  });
});
