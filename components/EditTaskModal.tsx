import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, task, onClose, onSave }) => {
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Task['priority'] | ''>('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (task) {
      setEditText(task.text);
      setEditDueDate(task.dueDate || '');
      setEditPriority(task.priority || '');
      setEditNotes(task.notes || '');
    } else {
      // Reset form if task is null (e.g., modal closed and re-opened quickly)
      setEditText('');
      setEditDueDate('');
      setEditPriority('');
      setEditNotes('');
    }
  }, [task]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      text: editText.trim(),
      dueDate: editDueDate || undefined, // Store as undefined if empty
      priority: editPriority === '' ? undefined : editPriority, // Store as undefined if ''
      notes: editNotes.trim() || undefined, // Store as undefined if empty
    };
    onSave(updatedTask);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);


  if (!isOpen || !task) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-out scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 id="edit-task-modal-title" className="text-xl font-semibold text-gray-800">ویرایش وظیفه</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            aria-label="بستن مودال"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="taskText" className="block text-sm font-medium text-gray-700 mb-1">متن وظیفه:</label>
            <input
              type="text"
              id="taskText"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">تاریخ سررسید:</label>
            <input
              type="date"
              id="dueDate"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">اولویت:</label>
            <select
              id="priority"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Task['priority'] | '')}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="">بدون اولویت</option>
              <option value="low">کم</option>
              <option value="medium">متوسط</option>
              <option value="high">زیاد</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">یادداشت‌ها:</label>
            <textarea
              id="notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
              placeholder="یادداشت‌های اضافی در مورد این وظیفه..."
            />
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
