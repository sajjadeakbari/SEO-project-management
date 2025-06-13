import React, { useState } from 'react';

interface AddTaskFormProps {
  onAddTask: (taskText: string) => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() !== '') {
      onAddTask(newTaskText.trim());
      setNewTaskText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-2.5 flex-col sm:flex-row">
      <input
        type="text"
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        placeholder="افزودن کار جدید..."
        className="flex-grow p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow duration-150 ease-in-out shadow-sm hover:shadow-md"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white font-medium border-none py-3 px-[18px] rounded-lg cursor-pointer text-sm transition-all duration-150 ease-in-out shadow-sm hover:shadow-md active:bg-green-700 transform active:scale-95"
      >
        افزودن
      </button>
    </form>
  );
};

export default AddTaskForm;
