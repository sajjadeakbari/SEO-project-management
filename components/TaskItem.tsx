import React, { useState } from 'react';
import { Task, TabId } from '../types';
import TaskList from './TaskList'; // To render sub-tasks

interface TaskItemProps {
  task: Task;
  tabId: TabId;
  onToggle: (tabId: TabId, taskId: string) => void;
  onEdit: (task: Task, tabId: TabId) => void;
  onAddSubTask: (tabId: TabId, parentId: string, text: string) => void;
  onToggleExpansion: (tabId: TabId, taskId: string) => void;
  onReorder: (tabId: TabId, parentListId: string | null, draggedTaskId: string, newIndex: number) => void;
  // depth is used for visual indentation of sub-tasks
  depth?: number; 
}

const PriorityBadge: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
  if (!priority) return null;
  let bgColor = 'bg-gray-400';
  let textColor = 'text-gray-800';
  let label = 'نامشخص';

  switch (priority) {
    case 'low': bgColor = 'bg-green-200'; textColor = 'text-green-800'; label = 'کم'; break;
    case 'medium': bgColor = 'bg-yellow-200'; textColor = 'text-yellow-800'; label = 'متوسط'; break;
    case 'high': bgColor = 'bg-red-200'; textColor = 'text-red-800'; label = 'زیاد'; break;
  }
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>{label}</span>;
};

const TaskItem: React.FC<TaskItemProps> = ({ task, tabId, onToggle, onEdit, onAddSubTask, onToggleExpansion, onReorder, depth = 0 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showAddSubTaskForm, setShowAddSubTaskForm] = useState(false);
  const [newSubTaskText, setNewSubTaskText] = useState('');

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task, tabId);
  };

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    setIsDragging(true);
    // Pass parentId if this task is a sub-task, or null if it's a top-level task for reordering context.
    // The `task.parentId` refers to *this task's* parent.
    // The `onReorder`'s `parentListId` refers to the list these items are in.
    // So for a top-level task, parentListId is null. For a sub-task, parentListId is task.parentId.
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, parentListId: task.parentId || null }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleToggleExpansionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subTasks && task.subTasks.length > 0) {
      onToggleExpansion(tabId, task.id);
    }
  };

  const handleAddSubTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddSubTaskForm(true);
  };

  const handleSubTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newSubTaskText.trim()) {
      onAddSubTask(tabId, task.id, newSubTaskText.trim());
      setNewSubTaskText('');
      setShowAddSubTaskForm(false);
    }
  };

  const subTaskCount = task.subTasks?.length || 0;
  const completedSubTaskCount = task.subTasks?.filter(st => st.completed).length || 0;

  const indentationStyle = { paddingRight: `${depth * 20}px` }; // Use paddingRight for RTL

  return (
    <>
      <li
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        data-task-id={task.id}
        className={`bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-150 ease-in-out group
                    ${isDragging ? 'opacity-50 border-2 border-dashed border-blue-400 cursor-grabbing shadow-xl scale-105' : 'cursor-grab'}
                    ${depth > 0 ? 'mt-1.5' : ''}`} // Add margin top for subtasks for better separation
        style={indentationStyle}
        aria-labelledby={`task-text-${task.id}`}
        aria-expanded={task.subTasks && task.subTasks.length > 0 ? task.isExpanded : undefined}
      >
        <div className={`py-3 px-3.5 flex items-start`}>
          {subTaskCount > 0 && (
            <button
              onClick={handleToggleExpansionClick}
              className="p-1 text-gray-500 hover:text-blue-600 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 shrink-0 ml-2"
              aria-label={task.isExpanded ? "بستن زیرمجموعه‌ها" : "باز کردن زیرمجموعه‌ها"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${task.isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
           {(depth > 0 && subTaskCount === 0) && <span className="w-5 h-5 inline-block ml-2 shrink-0"></span> /* Placeholder for alignment */}


          <input
            type="checkbox"
            id={`task-checkbox-${task.id}`}
            checked={task.completed}
            onChange={() => onToggle(tabId, task.id)}
            className="h-5 w-5 text-blue-600 border-gray-400 rounded focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:outline-none accent-blue-600 mr-3 shrink-0 mt-0.5"
            aria-controls={`task-text-${task.id}`}
          />
          <div className="flex-1 pl-2">
            <label htmlFor={`task-checkbox-${task.id}`} className="flex-1 cursor-pointer group/label">
              <span
                id={`task-text-${task.id}`}
                className={`text-sm ${task.completed ? 'line-through text-gray-400 group-hover/label:text-gray-500' : 'text-gray-700 group-hover/label:text-gray-800'}`}
              >
                {task.text}
              </span>
            </label>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {task.priority && <PriorityBadge priority={task.priority} />}
              {formattedDueDate && (
                <span className="text-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                  {formattedDueDate}
                </span>
              )}
              {task.notes && (
                <span className="text-gray-500 flex items-center" title={task.notes}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.929 2.929A1 1 0 014.343 2H10a1 1 0 011 1v4a1 1 0 01-1 1H4.343A1 1 0 013 7.657V4.343A1 1 0 012.929 2.929zM1 10a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1zm0 5a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1z" /></svg>
                  یادداشت
                </span>
              )}
              {subTaskCount > 0 && (
                <span className="text-blue-600 font-medium"> ({completedSubTaskCount}/{subTaskCount} زیرمجموعه)</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0 ml-1">
            <button
              onClick={handleAddSubTaskClick}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-label={`افزودن زیرمجموعه به ${task.text}`}
              title="افزودن زیرمجموعه"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleEditClick}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`ویرایش وظیفه ${task.text}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
          </div>
        </div>
        {showAddSubTaskForm && (
          <form onSubmit={handleSubTaskFormSubmit} className="px-3.5 pb-3 ml-12 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubTaskText}
                onChange={(e) => setNewSubTaskText(e.target.value)}
                placeholder="متن زیرمجموعه جدید..."
                className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-md text-sm">ذخیره</button>
              <button type="button" onClick={() => { setShowAddSubTaskForm(false); setNewSubTaskText(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm">لغو</button>
            </div>
          </form>
        )}
      </li>
      {task.isExpanded && task.subTasks && task.subTasks.length > 0 && (
        <div className="animate-fadeIn"> {/* Apply animation to the sub-task list container */}
          <TaskList
            tasks={task.subTasks}
            tabId={tabId} // Pass tabId down for context
            onToggleTask={(subTaskId) => onToggle(tabId, subTaskId)}
            onEditTask={(subTask) => onEdit(subTask, tabId)}
            // For reordering sub-tasks, the parentListId is the current task's ID
            onReorder={(draggedSubTaskId, newIndex) => onReorder(tabId, task.id, draggedSubTaskId, newIndex)}
            // Pass down handlers for sub-sub-tasks
            onAddSubTask={onAddSubTask}
            onToggleExpansion={onToggleExpansion}
            depth={depth + 1}
          />
        </div>
      )}
    </>
  );
};

export default TaskItem;