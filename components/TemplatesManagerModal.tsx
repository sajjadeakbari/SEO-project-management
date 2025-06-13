import React, { useState, useCallback, useEffect } from 'react';
import { ProjectTemplate, ProjectTemplates } from '../types';

interface TemplatesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ProjectTemplates;
  onSaveAsTemplate: (templateName: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

const TemplatesManagerModal: React.FC<TemplatesManagerModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveAsTemplate,
  onApplyTemplate,
  onDeleteTemplate,
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTemplateName.trim()) {
      onSaveAsTemplate(newTemplateName.trim());
      setNewTemplateName(''); // Reset after saving
    } else {
      alert("لطفاً نامی برای الگو وارد کنید.");
    }
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

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-manager-modal-title"
    >
      <div className="bg-white p-5 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
          <h2 id="templates-manager-modal-title" className="text-lg sm:text-xl font-semibold text-gray-800">
            مدیریت الگوهای پروژه
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            aria-label="بستن مودال"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save Current Project as Template Section */}
        <div className="mb-6">
          <h3 className="text-md sm:text-lg font-medium text-gray-700 mb-3">ذخیره پروژه فعلی به عنوان الگو</h3>
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2.5 items-stretch">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="نام الگو جدید..."
              className="flex-grow p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow duration-150 ease-in-out shadow-sm"
              aria-label="نام الگوی جدید"
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-150 ease-in-out shadow-sm hover:shadow-md active:bg-green-700 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1H8a2 2 0 00-2 2v10a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1zm0 4H8v10h4V6z" clipRule="evenodd" />
              </svg>
              ذخیره الگو
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            توجه: با ذخیره الگو، ساختار وظایف، متن و اولویت‌ها ذخیره می‌شوند. وضعیت تکمیل، تاریخ‌های سررسید و یادداشت‌ها ذخیره نخواهند شد و هنگام اعمال الگو بازنشانی می‌شوند.
          </p>
        </div>

        {/* Existing Templates Section */}
        <div className="flex-grow overflow-y-auto pr-1">
          <h3 className="text-md sm:text-lg font-medium text-gray-700 mb-3">الگوهای ذخیره‌شده</h3>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-md">هیچ الگویی ذخیره نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {templates.slice().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((template) => (
                <li key={template.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3.5 transition-colors duration-150 ease-in-out">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ایجاد شده در: {formatDate(template.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 mt-2.5 sm:mt-0 flex-shrink-0">
                      <button
                        onClick={() => onApplyTemplate(template.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3.5 rounded-md text-xs transition-colors duration-150 ease-in-out shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1.5"
                        title={`اعمال الگوی ${template.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        اعمال
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(template.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-3.5 rounded-md text-xs transition-colors duration-150 ease-in-out shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 flex items-center gap-1.5"
                        title={`حذف الگوی ${template.name}`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                         </svg>
                        حذف
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesManagerModal;