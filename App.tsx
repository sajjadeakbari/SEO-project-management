import React, { useState, useEffect, useCallback } from 'react';
import { 
  TAB_DEFINITIONS as APP_TAB_DEFINITIONS_CONST, // Renamed to avoid conflict
  INITIAL_TASKS,
  DEFAULT_FILTER_SETTINGS
} from './constants';
import { 
  Task, 
  TabId, 
  TasksState, 
  TabDefinition, 
  ProjectTemplate, 
  ProjectTemplates,
  FilterSettings,
  FilterStatusValue,
  FilterPriorityValue,
  SortByValue
} from './types';
import TabsNavigation from './components/TabsNavigation';
import TaskCategoryDisplay from './components/TaskCategoryDisplay';
import EditTaskModal from './components/EditTaskModal';
import TemplatesManagerModal from './components/TemplatesManagerModal';

const generateId = (): string => `task_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;

const APP_TAB_DEFINITIONS: TabDefinition[] = APP_TAB_DEFINITIONS_CONST.map(tab =>
  tab.id === 'completed' ? { ...tab, title: 'گزارشات و خلاصه پیشرفت' } : tab
);

interface EditingTaskInfo {
  task: Task;
  tabId: TabId;
}

const mapTasksRecursive = (tasks: Task[], callback: (task: Task) => Task): Task[] => {
  return tasks.map(task => {
    let newTask = callback(task);
    if (newTask.subTasks && newTask.subTasks.length > 0) {
      newTask = { ...newTask, subTasks: mapTasksRecursive(newTask.subTasks, callback) };
    }
    return newTask;
  });
};

const validateAndInitializeTasksRecursive = (taskArray: Task[] | undefined): Task[] => {
  return (taskArray || []).map(task => ({
    id: task.id || generateId(),
    text: task.text || "وظیفه بدون عنوان",
    completed: !!task.completed,
    subTasks: task.subTasks ? validateAndInitializeTasksRecursive(task.subTasks) : [],
    isExpanded: !!task.isExpanded,
    parentId: task.parentId,
    dueDate: task.dueDate,
    priority: task.priority,
    notes: task.notes,
  })).filter(
    (task: any): task is Task =>
        typeof task === 'object' &&
        task !== null &&
        typeof task.id === 'string' &&
        typeof task.text === 'string' &&
        Array.isArray(task.subTasks)
  );
};

const processTasksForTemplateStorageRecursive = (tasks: Task[]): Task[] => {
  return tasks.map(task => {
    const processedTask = { ...task, completed: false, dueDate: undefined, notes: undefined };
    if (processedTask.dueDate === undefined) delete processedTask.dueDate;
    if (processedTask.notes === undefined) delete processedTask.notes;
    processedTask.subTasks = task.subTasks ? processTasksForTemplateStorageRecursive(task.subTasks) : [];
    return processedTask;
  });
};

const processTasksFromTemplateForProjectRecursive = (tasks: Task[], newParentId?: string): Task[] => {
  return tasks.map(task => {
    const newId = generateId();
    const processedTask = {
      ...task,
      id: newId,
      parentId: newParentId,
      completed: false,
      dueDate: undefined,
      notes: undefined,
    };
    if (processedTask.dueDate === undefined) delete processedTask.dueDate;
    if (processedTask.notes === undefined) delete processedTask.notes;
    processedTask.subTasks = task.subTasks ? processTasksFromTemplateForProjectRecursive(task.subTasks, newId) : [];
    return processedTask;
  });
};


const App: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<TabId>(APP_TAB_DEFINITIONS[0].id);
  
  const [tasks, setTasks] = useState<TasksState>(() => {
    let baseTasksState: TasksState = INITIAL_TASKS;
    try {
      const savedTasksJson = localStorage.getItem('seoProjectTasks');
      if (savedTasksJson) {
        const parsedState = JSON.parse(savedTasksJson) as TasksState;
        const mergedState = { ...INITIAL_TASKS }; 
        for (const tabIdKey in parsedState) {
          if (Object.prototype.hasOwnProperty.call(parsedState, tabIdKey)) {
            mergedState[tabIdKey as TabId] = parsedState[tabIdKey as TabId];
          }
        }
        baseTasksState = mergedState;
      }
    } catch (e) { console.error("Error reading tasks from localStorage", e); }
    const finalInitialTasksState = {} as TasksState;
    APP_TAB_DEFINITIONS.forEach(tabDef => {
      finalInitialTasksState[tabDef.id] = validateAndInitializeTasksRecursive(baseTasksState[tabDef.id]);
    });
    return finalInitialTasksState;
  });

  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplates>(() => {
    try {
      const savedTemplatesJson = localStorage.getItem('seoProjectTemplates');
      return savedTemplatesJson ? JSON.parse(savedTemplatesJson) : [];
    } catch (e) { console.error("Error reading project templates from localStorage", e); return []; }
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTaskInfo, setEditingTaskInfo] = useState<EditingTaskInfo | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);

  // Filter States
  const [applyFiltersGlobally, setApplyFiltersGlobally] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('seoApplyFiltersGlobally');
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  const [globalFilterSettings, setGlobalFilterSettings] = useState<FilterSettings>(() => {
    try {
      const saved = localStorage.getItem('seoGlobalFilterSettings');
      return saved ? JSON.parse(saved) : DEFAULT_FILTER_SETTINGS;
    } catch { return DEFAULT_FILTER_SETTINGS; }
  });

  const [perTabFilterSettings, setPerTabFilterSettings] = useState<Record<TabId, FilterSettings | undefined>>(() => {
    const baseSettings: Record<TabId, FilterSettings | undefined> = {
      start: DEFAULT_FILTER_SETTINGS,
      daily: DEFAULT_FILTER_SETTINGS,
      weekly: DEFAULT_FILTER_SETTINGS,
      monthly: DEFAULT_FILTER_SETTINGS,
      completed: undefined,
    };

    try {
      const savedJson = localStorage.getItem('seoPerTabFilterSettings');
      if (savedJson) {
        const parsedSettings = JSON.parse(savedJson) as Partial<Record<TabId, FilterSettings>>;
        const mergedSettings = { ...baseSettings };

        for (const key in parsedSettings) {
          if (Object.prototype.hasOwnProperty.call(parsedSettings, key)) {
            const tabId = key as TabId;
            if (tabId in baseSettings) { // Check if it's a valid TabId
              if (tabId !== 'completed' && parsedSettings[tabId]) {
                mergedSettings[tabId] = parsedSettings[tabId]!;
              } else if (tabId === 'completed') {
                mergedSettings[tabId] = undefined; // Ensure 'completed' tab filters are undefined
              }
              // If tabId is not 'completed' but parsedSettings[tabId] is falsy (e.g. null/undefined from bad save)
              // it will retain the DEFAULT_FILTER_SETTINGS from baseSettings.
            }
          }
        }
        return mergedSettings;
      }
      return baseSettings; // No saved settings, return base
    } catch (e) {
      console.error("Error reading or parsing per-tab filter settings from localStorage:", e);
      return baseSettings; // Fallback on error
    }
  });


  useEffect(() => {
    localStorage.setItem('seoProjectTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('seoProjectTemplates', JSON.stringify(projectTemplates));
  }, [projectTemplates]);

  useEffect(() => {
    localStorage.setItem('seoApplyFiltersGlobally', JSON.stringify(applyFiltersGlobally));
  }, [applyFiltersGlobally]);

  useEffect(() => {
    localStorage.setItem('seoGlobalFilterSettings', JSON.stringify(globalFilterSettings));
  }, [globalFilterSettings]);

  useEffect(() => {
    localStorage.setItem('seoPerTabFilterSettings', JSON.stringify(perTabFilterSettings));
  }, [perTabFilterSettings]);


  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTabId(tabId);
  }, []);

  const handleAddTask = useCallback((tabId: TabId, taskText: string) => {
    setTasks(prevTasks => {
      const currentTasksForTab = prevTasks[tabId] || [];
      const isDuplicate = currentTasksForTab.some(task => task.text === taskText);
      if (isDuplicate) {
        alert(`وظیفه "${taskText}" از قبل در دسته "${APP_TAB_DEFINITIONS.find(t=>t.id===tabId)?.label}" وجود دارد.`);
        return prevTasks;
      }
      const newTask: Task = { id: generateId(), text: taskText, completed: false, subTasks: [], isExpanded: false };
      return { ...prevTasks, [tabId]: [...currentTasksForTab, newTask] };
    });
  }, []);

  const handleAddSubTask = useCallback((tabId: TabId, parentId: string, taskText: string) => {
    setTasks(prevTasks => {
      const newSubTask: Task = { id: generateId(), text: taskText, completed: false, parentId, subTasks: [], isExpanded: false };
      const updateParent = (task: Task): Task => {
        if (task.id === parentId) {
          const parentSubTasks = task.subTasks || [];
          if (parentSubTasks.some(sub => sub.text === taskText)) {
            alert(`زیرمجموعه "${taskText}" از قبل برای این وظیفه وجود دارد.`);
            return task;
          }
          return { ...task, subTasks: [...parentSubTasks, newSubTask], isExpanded: true };
        }
        return task;
      };
      return { ...prevTasks, [tabId]: mapTasksRecursive(prevTasks[tabId] || [], updateParent) };
    });
  }, []);

  const handleToggleTask = useCallback((tabId: TabId, taskId: string) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [tabId]: mapTasksRecursive(prevTasks[tabId] || [], task => task.id === taskId ? { ...task, completed: !task.completed } : task)
    }));
  }, []);

  const handleToggleTaskExpansion = useCallback((tabId: TabId, taskId: string) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [tabId]: mapTasksRecursive(prevTasks[tabId] || [], task => task.id === taskId ? { ...task, isExpanded: !task.isExpanded } : task)
    }));
  }, []);

  const handleOpenEditModal = useCallback((taskToEdit: Task, tabId: TabId) => {
    setEditingTaskInfo({ task: taskToEdit, tabId });
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingTaskInfo(null);
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    if (!editingTaskInfo) return;
    const { tabId } = editingTaskInfo;
    setTasks(prevTasks => ({
      ...prevTasks,
      [tabId]: mapTasksRecursive(prevTasks[tabId] || [], task => task.id === updatedTask.id ? { ...task, ...updatedTask, subTasks: updatedTask.subTasks ?? task.subTasks, isExpanded: updatedTask.isExpanded ?? task.isExpanded } : task)
    }));
    handleCloseEditModal();
  }, [editingTaskInfo, handleCloseEditModal]);

  const handleReorderTask = useCallback((tabId: TabId, parentListId: string | null, draggedTaskId: string, newIndex: number) => {
    setTasks(prevTasks => {
      const newState = { ...prevTasks };
      const tasksForTab = [...(newState[tabId] || [])];
      if (parentListId === null) { // Reordering top-level tasks
        const itemToMove = tasksForTab.find(task => task.id === draggedTaskId);
        if (!itemToMove) return prevTasks;
        const listWithoutItem = tasksForTab.filter(task => task.id !== draggedTaskId);
        listWithoutItem.splice(newIndex, 0, itemToMove);
        newState[tabId] = listWithoutItem;
      } else { // Reordering sub-tasks
        const modifyParent = (tasksToSearch: Task[]): Task[] => tasksToSearch.map(task => {
          if (task.id === parentListId) {
            const currentSubTasks = [...(task.subTasks || [])];
            const itemToMove = currentSubTasks.find(sub => sub.id === draggedTaskId);
            if (!itemToMove) return task;
            const listWithoutItem = currentSubTasks.filter(sub => sub.id !== draggedTaskId);
            listWithoutItem.splice(newIndex, 0, itemToMove);
            return { ...task, subTasks: listWithoutItem };
          }
          if (task.subTasks && task.subTasks.length > 0) {
            return { ...task, subTasks: modifyParent(task.subTasks) };
          }
          return task;
        });
        newState[tabId] = modifyParent(tasksForTab);
      }
      return newState;
    });
    // Reset sort to default when manual reorder occurs
    const currentActiveTabFilters = perTabFilterSettings[tabId] || DEFAULT_FILTER_SETTINGS;
    if (applyFiltersGlobally) {
      setGlobalFilterSettings(prev => ({ ...prev, sortBy: 'default' }));
    } else {
      setPerTabFilterSettings(prev => ({ ...prev, [tabId]: { ...currentActiveTabFilters, sortBy: 'default' } }));
    }

  }, [applyFiltersGlobally, perTabFilterSettings]);

  // Template Functions
  const handleSaveCurrentProjectAsTemplate = useCallback((templateName: string) => {
    if (!templateName.trim()) { alert("لطفاً نامی برای الگو وارد کنید."); return; }
    if (projectTemplates.some(t => t.name === templateName.trim())) { alert(`الگویی با نام "${templateName.trim()}" از قبل وجود دارد.`); return; }
    const processedTasksState = {} as TasksState;
    for (const tabIdKey in tasks) {
      processedTasksState[tabIdKey as TabId] = processTasksForTemplateStorageRecursive(tasks[tabIdKey as TabId]);
    }
    const newTemplate: ProjectTemplate = { id: generateId(), name: templateName.trim(), tasksState: processedTasksState, createdAt: new Date().toISOString() };
    setProjectTemplates(prev => [...prev, newTemplate]);
    alert(`پروژه فعلی با نام "${templateName.trim()}" به عنوان الگو ذخیره شد.`);
  }, [tasks, projectTemplates]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    if (!window.confirm("آیا مطمئن هستید؟ اعمال این الگو، تمام وظایف پروژه فعلی را بازنویسی خواهد کرد.")) return;
    const templateToApply = projectTemplates.find(t => t.id === templateId);
    if (!templateToApply) { alert("الگوی مورد نظر یافت نشد."); return; }
    const newTasksState = {} as TasksState;
    APP_TAB_DEFINITIONS.forEach(tabDef => {
      newTasksState[tabDef.id] = processTasksFromTemplateForProjectRecursive(templateToApply.tasksState[tabDef.id] || []);
    });
    setTasks(newTasksState);
    setActiveTabId(APP_TAB_DEFINITIONS[0].id);
    alert(`الگوی "${templateToApply.name}" با موفقیت اعمال شد.`);
    setIsTemplatesModalOpen(false);
  }, [projectTemplates]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;
    if (!window.confirm(`آیا از حذف الگوی "${template.name}" مطمئن هستید؟`)) return;
    setProjectTemplates(prev => prev.filter(t => t.id !== templateId));
    alert(`الگوی "${template.name}" حذف شد.`);
  }, [projectTemplates]);

  // Filter change handler
  const handleFilterSettingsChange = useCallback((changedSettings: Partial<FilterSettings>) => {
    if (applyFiltersGlobally) {
      setGlobalFilterSettings(prev => ({ ...prev, ...changedSettings }));
    } else {
      setPerTabFilterSettings(prev => ({
        ...prev,
        [activeTabId]: { ...(prev[activeTabId] || DEFAULT_FILTER_SETTINGS), ...changedSettings },
      }));
    }
  }, [applyFiltersGlobally, activeTabId]);

  const toggleApplyFiltersGlobally = useCallback(() => {
    setApplyFiltersGlobally(prev => {
      const newGlobalStatus = !prev;
      if (newGlobalStatus) { // Transitioning from per-tab to global
        setGlobalFilterSettings(perTabFilterSettings[activeTabId] || DEFAULT_FILTER_SETTINGS);
      }
      // No specific action needed when transitioning from global to per-tab,
      // as per-tab settings are preserved.
      return newGlobalStatus;
    });
  }, [activeTabId, perTabFilterSettings]);

  const currentActiveFilterSettings = applyFiltersGlobally 
                                      ? globalFilterSettings 
                                      : (perTabFilterSettings[activeTabId] || DEFAULT_FILTER_SETTINGS);

  const currentTabDefinition = APP_TAB_DEFINITIONS.find(tab => tab.id === activeTabId);
  const currentTasks = tasks[activeTabId] || [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50">
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-4 sm:px-6 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 sm:h-7 sm:w-7 sm:ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">مدیریت پروژه سئو</h1>
          </div>
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="مدیریت الگوهای پروژه"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" />
            </svg>
            الگوها
          </button>
        </div>
        <p className="text-xs sm:text-sm mt-1 sm:mt-1.5 opacity-80 font-light text-center sm:text-right">چک‌لیست هوشمند وظایف و پیگیری پیشرفت شما</p>
      </header>
      
      <div className="bg-blue-50 py-2.5 px-4 border-b border-gray-300 shadow-sm">
        <label htmlFor="globalFilterToggle" className="flex items-center justify-end text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            id="globalFilterToggle"
            checked={applyFiltersGlobally}
            onChange={toggleApplyFiltersGlobally}
            className="ml-2 h-3.5 w-3.5 rounded border-gray-400 text-blue-600 focus:ring-blue-500 accent-blue-600"
          />
          اعمال فیلترها و جستجو بر همه دسته‌بندی‌ها
        </label>
      </div>

      <TabsNavigation
        tabs={APP_TAB_DEFINITIONS}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
      />

      <main className="container mx-auto p-3 sm:p-5 flex-grow w-full max-w-4xl">
        {currentTabDefinition ? (
          <TaskCategoryDisplay
            key={activeTabId + (applyFiltersGlobally ? '-global' : '-pertab')} // More robust key for re-mount
            tabDefinition={currentTabDefinition}
            tasks={currentTasks}
            allTasks={tasks} // For 'completed' tab's progress summary
            currentFilterSettings={currentActiveFilterSettings}
            onFilterSettingsChange={handleFilterSettingsChange}
            onAddTask={(taskText) => handleAddTask(activeTabId, taskText)}
            onToggleTask={(taskId) => handleToggleTask(activeTabId, taskId)}
            onEditTask={(task) => handleOpenEditModal(task, activeTabId)}
            onReorderTasksForTab={handleReorderTask}
            onAddSubTask={(parentId, taskText) => handleAddSubTask(activeTabId, parentId, taskText)}
            onToggleTaskExpansion={(taskId) => handleToggleTaskExpansion(activeTabId, taskId)}
          />
        ) : (
          <div className="text-center p-10 text-gray-600">محتوایی برای نمایش وجود ندارد. لطفا یک تب را انتخاب کنید.</div>
        )}
      </main>

      {isEditModalOpen && editingTaskInfo && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          task={editingTaskInfo.task}
          onClose={handleCloseEditModal}
          onSave={handleUpdateTask}
        />
      )}

      {isTemplatesModalOpen && (
        <TemplatesManagerModal
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          templates={projectTemplates}
          onSaveAsTemplate={handleSaveCurrentProjectAsTemplate}
          onApplyTemplate={handleApplyTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      )}

      <footer className="text-center p-4 bg-blue-100/70 backdrop-blur-sm text-gray-700 text-xs mt-auto border-t border-blue-200">
        &copy; ۲۰۲۵ | طراحی و توسعه توسط سجاد اکبری
      </footer>
    </div>
  );
};

export default App;