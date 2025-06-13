import React, { useState, useEffect, useMemo } from 'react';
import { TabDefinition, Task, TasksState, TabId, FilterSettings, FilterStatusValue, FilterPriorityValue, SortByValue, STATUS_FILTER_OPTIONS, PRIORITY_FILTER_OPTIONS, SORT_BY_OPTIONS } from '../types';
import TaskList from './TaskList';
import AddTaskForm from './AddTaskForm';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DEFAULT_FILTER_SETTINGS } from '../constants';
import ChartsDisplay from './ChartsDisplay'; // Ensured relative path


interface TaskCategoryDisplayProps {
  tabDefinition: TabDefinition;
  tasks: Task[]; 
  allTasks?: TasksState; 
  currentFilterSettings: FilterSettings;
  onFilterSettingsChange: (newSettings: Partial<FilterSettings>) => void;
  onAddTask: (taskText: string) => void; 
  onToggleTask: (taskId: string) => void; 
  onEditTask: (task: Task) => void; 
  onReorderTasksForTab: (tabId: TabId, parentListId: string | null, draggedTaskId: string, newIndex: number) => void;
  onAddSubTask: (parentId: string, taskText: string) => void; 
  onToggleTaskExpansion: (taskId: string) => void; 
  onExportToCSV: () => void; // New prop for CSV export
}

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("API_KEY environment variable not found. AI features will be disabled.");
}

interface ProgressData {
  overall: { completed: number; total: number; percentage: number };
  categories: Array<{
    id: TabId;
    title: string;
    completed: number;
    total: number;
    percentage: number;
    incompleteTaskSamples: string[];
  }>;
}

const countTasksRecursive = (taskList: Task[]): { completed: number; total: number; incompleteSamples: string[] } => {
  let completed = 0;
  let total = 0;
  const incompleteSamples: string[] = [];
  for (const task of taskList) {
    total++;
    if (task.completed) completed++;
    else if (incompleteSamples.length < 3) incompleteSamples.push(task.text);
    if (task.subTasks && task.subTasks.length > 0) {
      const subTaskCounts = countTasksRecursive(task.subTasks);
      total += subTaskCounts.total;
      completed += subTaskCounts.completed;
      subTaskCounts.incompleteSamples.forEach(sample => {
        if (incompleteSamples.length < 3) incompleteSamples.push(`(زیرمجموعه) ${sample}`);
      });
    }
  }
  return { completed, total, incompleteSamples };
};

const ProgressBar: React.FC<{ percentage: number; label: string, colorClass?: string }> = ({ percentage, label, colorClass = "bg-blue-600" }) => (
  <div className="w-full" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
      <div
        className={`h-2.5 rounded-full ${colorClass} transition-all duration-500 ease-out`}
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
    </div>
  </div>
);

// Import TAB_DEFINITIONS from constants for ProgressSummary
import { TAB_DEFINITIONS as APP_TAB_DEFINITIONS_CONST } from '../constants';

const ProgressSummary: React.FC<{ 
    allTasks: TasksState, 
    onGenerateAnalysis: (progressData: ProgressData) => void, 
    isAnalysisLoading: boolean, 
    analysisResult: string | null, 
    analysisError: string | null,
    onExportToCSV: () => void; // Added prop for export
}> = ({ allTasks, onGenerateAnalysis, isAnalysisLoading, analysisResult, analysisError, onExportToCSV }) => {
    const progressData = useMemo<ProgressData>(() => {
      let overallTotalTasks = 0;
      let overallCompletedTasks = 0;
      const categoryProgress: ProgressData['categories'] = [];
      
      for (const tabId of Object.keys(allTasks) as TabId[]) {
        if (tabId === 'completed') continue; 
        const tasksForCategory = allTasks[tabId] || [];
        const { completed, total, incompleteSamples } = countTasksRecursive(tasksForCategory);
        overallTotalTasks += total;
        overallCompletedTasks += completed;
        
        const tabInfo = APP_TAB_DEFINITIONS_CONST.find(t => t.id === tabId);

        categoryProgress.push({
          id: tabId,
          title: tabInfo?.label || tabId.charAt(0).toUpperCase() + tabId.slice(1), 
          completed: completed,
          total: total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          incompleteTaskSamples: incompleteSamples,
        });
      }
      
      return {
        overall: {
          completed: overallCompletedTasks,
          total: overallTotalTasks,
          percentage: overallTotalTasks > 0 ? Math.round((overallCompletedTasks / overallTotalTasks) * 100) : 0,
        },
        categories: categoryProgress,
      };
    }, [allTasks]);

    return (
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg border border-gray-200 mb-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">📊 خلاصه پیشرفت پروژه</h3>
            <button
                onClick={onExportToCSV}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3.5 rounded-md text-xs transition-colors duration-150 ease-in-out shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                title="خروجی تمام وظایف به CSV"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                خروجی CSV
            </button>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1 text-sm font-medium text-gray-700">
            <span>پیشرفت کلی</span>
            <span>{progressData.overall.completed} / {progressData.overall.total} ({progressData.overall.percentage}%)</span>
          </div>
          <ProgressBar percentage={progressData.overall.percentage} label="پیشرفت کلی پروژه" colorClass="bg-green-500" />
        </div>
        <div className="space-y-4 mb-6">
          {progressData.categories.map(cat => (
            <div key={cat.id}>
              <div className="flex justify-between items-center mb-1 text-xs sm:text-sm font-medium text-gray-600">
                <span>{cat.title}</span>
                <span>{cat.completed} / {cat.total} ({cat.percentage}%)</span>
              </div>
              <ProgressBar percentage={cat.percentage} label={`پیشرفت ${cat.title}`} />
            </div>
          ))}
        </div>
        {!apiKey && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-700 text-center">
            ⚠️ کلید API برای Gemini تنظیم نشده است. قابلیت تحلیل هوشمند غیرفعال می‌باشد.
          </div>
        )}
        {apiKey && (
          <div className="mt-6 text-center">
            <button
              onClick={() => onGenerateAnalysis(progressData)}
              disabled={isAnalysisLoading || !apiKey}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isAnalysisLoading ? (<> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> در حال تحلیل... </>) : (<> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zm0 4.03a3.978 3.978 0 00-3.303 1.545l.98.867A2.978 2.978 0 0110 6.03V2zm0 12.03a3.978 3.978 0 003.303-1.545l-.98-.867A2.978 2.978 0 0110 14.03v4zm0-6a2 2 0 100-4 2 2 0 000 4zm-6.03.697A3.978 3.978 0 002 10V6.03l1.545.98.867-.867A3.978 3.978 0 002 10zm12.06 0A3.978 3.978 0 0018 10V6.03l-1.545.98-.867-.867A3.978 3.978 0 0018 10zM6.03 10a3.978 3.978 0 001.545 3.303l.867-.98A2.978 2.978 0 016.03 10H2zm12.06 0a3.978 3.978 0 00-1.545 3.303l-.867-.98A2.978 2.978 0 0114.03 10h4z" clipRule="evenodd" /> </svg> دریافت تحلیل و پیشنهاد هوشمند </>)}
            </button>
            {analysisError && <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">{analysisError}</p>}
            {analysisResult && !isAnalysisLoading && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md text-sm text-indigo-800 text-right prose prose-sm max-w-none animate-fadeIn" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }} />
            )}
          </div>
        )}
      </div>
    );
};


const TaskCategoryDisplay: React.FC<TaskCategoryDisplayProps> = ({
  tabDefinition,
  tasks, 
  allTasks,
  currentFilterSettings,
  onFilterSettingsChange,
  onAddTask, 
  onToggleTask, 
  onEditTask,
  onReorderTasksForTab,
  onAddSubTask, 
  onToggleTaskExpansion,
  onExportToCSV,
}) => {
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { status: filterStatus, priority: filterPriority, sortBy, sortDirection, searchTerm } = currentFilterSettings;

  const handleSuggestTasks = async () => {
    if (!ai) { setSuggestionError("سرویس هوش مصنوعی در دسترس نیست."); return; }
    setIsLoadingSuggestion(true); setSuggestionError(null);
    try {
      const prompt = `Suggest 2-3 concise, actionable SEO tasks in Persian, appropriate for the '${tabDefinition.label}' phase of an SEO project. These tasks should be unique and not trivial. Respond *only* with a valid JSON array of strings, where each string is a task in Persian. For example: ["وظیفه اول", "وظیفه دوم", "وظیفه سوم"]`;
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17", contents: prompt, config: { responseMimeType: "application/json" }
      });
      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      const suggestedTaskTexts: string[] = JSON.parse(jsonStr);
      suggestedTaskTexts.forEach(taskText => { if (taskText?.trim()) onAddTask(taskText.trim()); });
    } catch (error: any) {
      console.error("Error suggesting tasks:", error);
      setSuggestionError(`خطا در دریافت پیشنهاد: ${error.message || 'لطفاً دوباره تلاش کنید.'}`);
    } finally { setIsLoadingSuggestion(false); }
  };

  const handleGenerateAnalysis = async (progressData: ProgressData) => {
    if (!ai) { setAnalysisError("سرویس هوش مصنوعی در دسترس نیست."); return; }
    setIsAnalysisLoading(true); setAnalysisError(null); setAnalysisResult(null);
    let promptContext = `You are an expert SEO project analyst. Analyze the following project progress for a Persian-speaking audience and provide actionable insights. The project is divided into categories:\n\n`;
    promptContext += `Overall Progress: ${progressData.overall.completed}/${progressData.overall.total} tasks completed (${progressData.overall.percentage}%).\n\n`;
    progressData.categories.forEach(cat => {
        const tabInfo = APP_TAB_DEFINITIONS_CONST.find(t => t.id === cat.id);
        const categoryTitle = tabInfo?.label || cat.id;
        promptContext += `Category: ${categoryTitle}\n  - Progress: ${cat.completed}/${cat.total} tasks completed (${cat.percentage}%).\n`;
        if(cat.incompleteTaskSamples.length > 0) promptContext += `  - Some pending tasks: ${cat.incompleteTaskSamples.join(', ')}\n`;
        promptContext += "\n";
    });
    promptContext += `Based on this data, provide:\n1. A brief, encouraging analysis (Persian).\n2. Identify 1-2 strengths (Persian).\n3. Identify 1-2 weaknesses (Persian).\n4. Offer 2-3 concise, actionable recommendations (Persian).\n\nFormat clearly. Use simple language. Ensure entire response is in Persian.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-04-17", contents: promptContext });
        setAnalysisResult(response.text);
    } catch (error: any) {
      console.error("Error generating analysis:", error);
      setAnalysisError(`خطا در دریافت تحلیل: ${error.message || 'لطفاً دوباره تلاش کنید.'}`);
    } finally { setIsAnalysisLoading(false); }
  };

  const processedTasks = useMemo(() => {
    let tempTasks = [...tasks]; 
    
    const filterRecursively = (taskList: Task[]): Task[] => {
        return taskList.map(task => {
            let matchesSearch = true;
            if (searchTerm.trim() !== '') {
                const lowercasedSearchTerm = searchTerm.toLowerCase();
                matchesSearch = task.text.toLowerCase().includes(lowercasedSearchTerm) ||
                                (task.notes && task.notes.toLowerCase().includes(lowercasedSearchTerm));
            }

            let filteredSubTasks = task.subTasks ? filterRecursively(task.subTasks) : [];
            
            if (searchTerm.trim() !== '' && !matchesSearch && filteredSubTasks.length === 0) {
                return null;
            }

            let matchesStatus = true;
            if (filterStatus !== 'all') {
                matchesStatus = filterStatus === 'completed' ? task.completed : !task.completed;
            }

            let matchesPriority = true;
            if (filterPriority !== 'all') {
                matchesPriority = filterPriority === 'none' ? !task.priority : task.priority === filterPriority;
            }

            if ( (matchesSearch && matchesStatus && matchesPriority) || (searchTerm.trim() !== '' && filteredSubTasks.length > 0) ) {
                 return {...task, subTasks: filteredSubTasks };
            }
            if ( (filterStatus !== 'all' && !matchesStatus) || (filterPriority !== 'all' && !matchesPriority) ) {
                if (searchTerm.trim() === '' || (searchTerm.trim() !== '' && filteredSubTasks.length === 0)) {
                    return null;
                }
            }
            return {...task, subTasks: filteredSubTasks }; 

        }).filter(task => task !== null) as Task[];
    };

    if (filterStatus !== 'all' || filterPriority !== 'all' || searchTerm.trim() !== '') {
        tempTasks = filterRecursively(tempTasks);
    }


    if (sortBy !== 'default') {
      const sortRecursively = (taskList: Task[]): Task[] => {
        let sortedList = [...taskList];
        sortedList.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'dueDate':
              if (!a.dueDate && !b.dueDate) comparison = 0;
              else if (!a.dueDate) comparison = 1; else if (!b.dueDate) comparison = -1;
              else comparison = a.dueDate.localeCompare(b.dueDate);
              break;
            case 'priority':
              const priorityOrder: Record<Task['priority'] | 'none', number> = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
              comparison = priorityOrder[b.priority || 'none'] - priorityOrder[a.priority || 'none']; 
              break;
            case 'text': comparison = a.text.localeCompare(b.text, 'fa'); break;
          }
          if (comparison === 0 && tasks) { 
             const originalTasksForTab = allTasks ? allTasks[tabDefinition.id] : []; // Fallback to an empty array if allTasks is undefined
             const originalIndexA = originalTasksForTab.findIndex(t => t.id === a.id);
             const originalIndexB = originalTasksForTab.findIndex(t => t.id === b.id);
             comparison = originalIndexA - originalIndexB;
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        return sortedList.map(task => ({
          ...task,
          subTasks: task.subTasks ? sortRecursively(task.subTasks) : []
        }));
      };
      tempTasks = sortRecursively(tempTasks);
    }
    return tempTasks;
  }, [tasks, filterStatus, filterPriority, sortBy, sortDirection, searchTerm, allTasks, tabDefinition.id]);

  const handleClearFiltersAndSearch = () => {
    onFilterSettingsChange(DEFAULT_FILTER_SETTINGS);
  };
  
  const handleClearSearch = () => onFilterSettingsChange({ searchTerm: '' });

  const handleTaskReorderForThisTab = (draggedTaskId: string, newIndex: number) => {
    onReorderTasksForTab(tabDefinition.id, null, draggedTaskId, newIndex);
  };

  const showAiTaskSuggestionButton = tabDefinition.id !== 'completed';
  const showProgressSummaryAndCharts = tabDefinition.id === 'completed' && allTasks;
  const showAddTaskForm = tabDefinition.id !== 'completed';
  const showFilterSortSearchControls = tabDefinition.id !== 'completed';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">
          {tabDefinition.title}
        </h2>
        {showAiTaskSuggestionButton && apiKey && (
          <button
            onClick={handleSuggestTasks}
            disabled={isLoadingSuggestion || !apiKey}
            className="w-full justify-center sm:w-auto bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-fuchsia-300 text-white font-medium py-2 px-4 rounded-lg text-xs sm:text-sm transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 flex items-center gap-2"
          >
            {isLoadingSuggestion ? ( <> <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> در حال دریافت پیشنهاد... </> ) : ( <> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v1H3a1 1 0 100 2h1v1H3a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9h1a1 1 0 100-2h-1V6h1a1 1 0 000-2h-1V3a1 1 0 00-1-1H5zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /> </svg> پیشنهاد کار با هوش مصنوعی ✨ </> )}
          </button>
        )}
      </div>
      {showAiTaskSuggestionButton && !apiKey && (
         <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-700 text-center">
            ⚠️ کلید API برای Gemini تنظیم نشده است. قابلیت پیشنهاد کار با هوش مصنوعی غیرفعال می‌باشد.
          </div>
      )}
      {suggestionError && <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">{suggestionError}</p>}
      
      {showProgressSummaryAndCharts && allTasks && (
        <>
            <ProgressSummary 
                allTasks={allTasks} 
                onGenerateAnalysis={handleGenerateAnalysis}
                isAnalysisLoading={isAnalysisLoading}
                analysisResult={analysisResult}
                analysisError={analysisError}
                onExportToCSV={onExportToCSV}
            />
            <ChartsDisplay tasksState={allTasks} />
        </>
      )}

      {showFilterSortSearchControls && (
        <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow space-y-4">
          <div>
            <label htmlFor={`search-tasks-${tabDefinition.id}`} className="block text-xs font-medium text-slate-600 mb-1">جستجوی وظایف (شامل زیرمجموعه‌ها):</label>
            <div className="relative">
              <input type="search" id={`search-tasks-${tabDefinition.id}`} value={searchTerm} onChange={(e) => onFilterSettingsChange({ searchTerm: e.target.value })} placeholder="جستجو در متن و یادداشت‌های وظایف و زیرمجموعه‌ها..." className="w-full p-2.5 pr-8 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white" />
              {searchTerm && (<button onClick={handleClearSearch} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700" aria-label="پاک کردن جستجو" title="پاک کردن جستجو"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button> )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 sr-only">فیلتر و مرتب‌سازی وظایف:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div> <label htmlFor={`filter-status-${tabDefinition.id}`} className="block text-xs font-medium text-slate-600 mb-1">وضعیت:</label> <select id={`filter-status-${tabDefinition.id}`} value={filterStatus} onChange={(e) => onFilterSettingsChange({ status: e.target.value as FilterStatusValue })} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"> {STATUS_FILTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> </div>
              <div> <label htmlFor={`filter-priority-${tabDefinition.id}`} className="block text-xs font-medium text-slate-600 mb-1">اولویت:</label> <select id={`filter-priority-${tabDefinition.id}`} value={filterPriority} onChange={(e) => onFilterSettingsChange({ priority: e.target.value as FilterPriorityValue })} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"> {PRIORITY_FILTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> </div>
              <div className="flex items-end gap-2"> <div className="flex-grow"> <label htmlFor={`sort-by-${tabDefinition.id}`} className="block text-xs font-medium text-slate-600 mb-1">مرتب‌سازی:</label> <select id={`sort-by-${tabDefinition.id}`} value={sortBy} onChange={(e) => onFilterSettingsChange({ sortBy: e.target.value as SortByValue })} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"> {SORT_BY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> </div> <button onClick={() => onFilterSettingsChange({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' })} className="p-2 border border-slate-300 rounded-md shadow-sm hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-600" aria-label={sortDirection === 'asc' ? "مرتب‌سازی نزولی" : "مرتب‌سازی صعودی"} title={sortDirection === 'asc' ? "مرتب‌سازی نزولی" : "مرتب‌سازی صعودی"}> {sortDirection === 'asc' ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg> )} </button> </div>
              <button onClick={handleClearFiltersAndSearch} className="w-full sm:w-auto lg:col-start-4 p-2 border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shadow-sm text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"> پاک کردن همه </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                توجه: فیلترها و جستجو بر روی وظایف و زیرمجموعه‌های آن‌ها اعمال می‌شوند. مرتب‌سازی بر روی ساختار درختی اعمال می‌شود.
            </p>
          </div>
        </div>
      )}

      <TaskList 
        tasks={processedTasks} 
        tabId={tabDefinition.id}
        onToggleTask={onToggleTask} 
        onEditTask={onEditTask}
        onReorder={handleTaskReorderForThisTab} 
        onAddSubTask={(parentId, text) => onAddSubTask(parentId, text)} 
        onToggleExpansion={onToggleTaskExpansion} 
      />
      {showAddTaskForm && <AddTaskForm onAddTask={onAddTask} />}
    </div>
  );
};

export default TaskCategoryDisplay;