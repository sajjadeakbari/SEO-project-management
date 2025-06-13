import React from 'react';
import { Task, TabId } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  tabId: TabId; // Added for context
  onToggleTask: (taskId: string) => void; // Will be (tabId, taskId) from App, TaskItem will adapt
  onEditTask: (task: Task) => void; // Will be (task, tabId) from App, TaskItem will adapt
  onReorder: (draggedTaskId: string, newIndex: number) => void; // App's onReorder now takes (tabId, parentListId, draggedId, newIdx)
  
  // Props for sub-task functionality, to be passed down to TaskItem
  onAddSubTask?: (tabId: TabId, parentId: string, text: string) => void;
  onToggleExpansion?: (tabId: TabId, taskId: string) => void;
  depth?: number; // For visual indentation of nested TaskLists
}

const TaskList: React.FC<TaskListProps> = ({ 
    tasks, 
    tabId, 
    onToggleTask, 
    onEditTask, 
    onReorder,
    onAddSubTask, // Will be undefined for top-level TaskList
    onToggleExpansion, // Will be undefined for top-level TaskList
    depth = 0 
}) => {

  const handleDragOver = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    const draggedTaskData = e.dataTransfer.getData('application/json');
    if (!draggedTaskData) return;

    // parentListId here refers to the ID of the list these tasks belong to.
    // For top-level tasks, it's null. For sub-tasks, it's the ID of their direct parent task.
    const { taskId: draggedTaskId /*, parentListId: draggedItemParentListId */ } = JSON.parse(draggedTaskData);
    
    let newIndex = tasks.length; 

    const listItems = Array.from((e.currentTarget as HTMLUListElement).children).filter(child => child.tagName === 'LI' || (child.firstChild && (child.firstChild as HTMLElement).tagName === 'LI')) as HTMLLIElement[];
    
    // Find the actual <li> element, which might be a direct child or nested if TaskItem wraps itself in a fragment/div for subtasks
    const findLiTarget = (element: Element | null): HTMLLIElement | null => {
        if (!element) return null;
        if (element.tagName === 'LI' && (element as HTMLLIElement).dataset.taskId) return element as HTMLLIElement;
        // Check if the drop is on the ul but not on any specific li (e.g., empty space)
        if (element === e.currentTarget && listItems.length > 0) {
            // Check if dropped below all items
            const lastItemRect = listItems[listItems.length - 1].getBoundingClientRect();
            if (e.clientY > lastItemRect.bottom) return null; // implies end of list
        }
        return findLiTarget(element.parentElement);
    }
    
    // Start search from e.target
    let dropTargetLi : HTMLLIElement | null = null;
    if (e.target instanceof HTMLElement) {
      if ((e.target as HTMLElement).tagName === 'LI' && (e.target as HTMLLIElement).dataset.taskId) {
        dropTargetLi = e.target as HTMLLIElement;
      } else {
        // Try to find if dropped on a child of an LI that is part of this list
        dropTargetLi = (e.target as HTMLElement).closest(`ul[data-list-depth="${depth}"] > li[data-task-id]`) as HTMLLIElement | null;
      }
    }


    if (dropTargetLi && dropTargetLi.dataset.taskId) {
      const targetTaskId = dropTargetLi.dataset.taskId;
      // Ensure target task is in the current list, not a sub-task's sub-task from a nested TaskList's event
      const targetTaskIndex = tasks.findIndex(t => t.id === targetTaskId);

      if (targetTaskIndex !== -1) {
        const rect = dropTargetLi.getBoundingClientRect();
        const isDropInUpperHalf = e.clientY < rect.top + rect.height / 2;
        newIndex = isDropInUpperHalf ? targetTaskIndex : targetTaskIndex + 1;
      }
    } else if (tasks.length === 0) {
        newIndex = 0;
    }
    // If not dropped on any specific item (e.g., empty space at bottom), newIndex remains tasks.length

    onReorder(draggedTaskId, newIndex);
  };

  if (tasks.length === 0 && depth === 0) { // Show empty state only for top-level empty lists
    return (
        <ul 
            onDragOver={handleDragOver} 
            onDrop={handleDrop} 
            className="list-none p-0 space-y-2.5 min-h-[50px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center"
            data-list-depth={depth}
        >
            <p className="text-gray-500 text-center py-6 text-sm">لیست خالی است. وظیفه‌ای را اینجا بکشید یا یک مورد جدید اضافه کنید.</p>
        </ul>
    );
  }
  if (tasks.length === 0 && depth > 0) { // For empty sub-task lists, render nothing or a very minimal placeholder
    return null; // Or a very subtle drop zone indicator if desired
  }


  return (
    <ul 
        className={`list-none p-0 ${depth === 0 ? 'space-y-2.5' : ''}`} // No space-y for sub-task lists as TaskItem handles margin
        onDragOver={handleDragOver} 
        onDrop={handleDrop}
        data-list-depth={depth} // For more specific targeting if needed
    >
      {tasks.map((task) => (
        <TaskItem 
            key={task.id} 
            task={task}
            tabId={tabId}
            onToggle={onToggleTask as any} // Cast because App.tsx handles full signature
            onEdit={onEditTask as any}   // Cast because App.tsx handles full signature
            onReorder={onReorder as any} // This onReorder is for the parent list of these tasks
            // Props for sub-task management, passed down if they exist
            onAddSubTask={onAddSubTask!} // These will be defined when TaskItem renders its own TaskList
            onToggleExpansion={onToggleExpansion!}
            depth={depth}
        />
      ))}
    </ul>
  );
};

export default TaskList;