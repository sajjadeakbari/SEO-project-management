
import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js/auto';
import { TasksState, Task, TabId } from '../types';
import { TAB_DEFINITIONS } from '../constants'; // For category labels

// Register Chart.js components
Chart.register(...registerables);

interface ChartsDisplayProps {
  tasksState: TasksState;
}

const countTasksRecursive = (taskList: Task[]): { completed: number; total: number } => {
  let completed = 0;
  let total = 0;
  for (const task of taskList) {
    total++;
    if (task.completed) completed++;
    if (task.subTasks && task.subTasks.length > 0) {
      const subTaskCounts = countTasksRecursive(task.subTasks);
      total += subTaskCounts.total;
      completed += subTaskCounts.completed;
    }
  }
  return { completed, total };
};

const ChartsDisplay: React.FC<ChartsDisplayProps> = ({ tasksState }) => {
  const overallProgressChartRef = useRef<HTMLCanvasElement>(null);
  const categoryProgressChartRef = useRef<HTMLCanvasElement>(null);
  const overallChartInstanceRef = useRef<Chart | null>(null);
  const categoryChartInstanceRef = useRef<Chart | null>(null);

  const chartData = useMemo(() => {
    let overallTotalTasks = 0;
    let overallCompletedTasks = 0;
    const categoryStats: Array<{ id: TabId; label: string; completed: number; total: number; percentage: number }> = [];

    const relevantTabs = TAB_DEFINITIONS.filter(tab => tab.id !== 'completed');

    relevantTabs.forEach(tabDef => {
      const tasksForCategory = tasksState[tabDef.id] || [];
      const { completed, total } = countTasksRecursive(tasksForCategory);
      
      overallTotalTasks += total;
      overallCompletedTasks += completed;
      
      categoryStats.push({
        id: tabDef.id,
        label: tabDef.label,
        completed: completed,
        total: total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    });

    return {
      overall: {
        completed: overallCompletedTasks,
        total: overallTotalTasks,
        percentage: overallTotalTasks > 0 ? Math.round((overallCompletedTasks / overallTotalTasks) * 100) : 0,
      },
      categories: categoryStats,
    };
  }, [tasksState]);

  // Overall Progress Doughnut Chart
  useEffect(() => {
    if (overallProgressChartRef.current && chartData.overall.total > 0) {
      if (overallChartInstanceRef.current) {
        overallChartInstanceRef.current.destroy();
      }
      const ctx = overallProgressChartRef.current.getContext('2d');
      if (ctx) {
        overallChartInstanceRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['تکمیل شده', 'باقی‌مانده'],
            datasets: [{
              label: 'پیشرفت کلی',
              data: [chartData.overall.completed, chartData.overall.total - chartData.overall.completed],
              backgroundColor: ['rgb(75, 192, 192)', 'rgb(229, 231, 235)'], // Green-ish, Light Gray
              borderColor: ['rgb(75, 192, 192)', 'rgb(209, 213, 219)'],
              borderWidth: 1,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { family: 'Vazirmatn', size: 12 },
                  padding: 15,
                }
              },
              title: {
                display: true,
                text: `پیشرفت کلی: ${chartData.overall.percentage}%`,
                font: { size: 16, family: 'Vazirmatn', weight: '600' },
                padding: { top: 10, bottom: 20 },
                color: '#374151' // text-gray-700
              },
              tooltip: {
                titleFont: { family: 'Vazirmatn' },
                bodyFont: { family: 'Vazirmatn' },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed;
                        }
                        const percentage = chartData.overall.total > 0 ? ((context.parsed / chartData.overall.total) * 100).toFixed(1) : 0;
                        label += ` (${percentage}%)`;
                        return label;
                    }
                }
              }
            },
            cutout: '60%',
          }
        });
      }
    } else if (overallChartInstanceRef.current) {
        overallChartInstanceRef.current.destroy(); // Destroy if no data
        overallChartInstanceRef.current = null;
    }
    return () => {
      overallChartInstanceRef.current?.destroy();
      overallChartInstanceRef.current = null;
    };
  }, [chartData.overall]);

  // Category Progress Bar Chart
  useEffect(() => {
    if (categoryProgressChartRef.current && chartData.categories.length > 0 && chartData.overall.total > 0) {
      if (categoryChartInstanceRef.current) {
        categoryChartInstanceRef.current.destroy();
      }
      const ctx = categoryProgressChartRef.current.getContext('2d');
      if (ctx) {
        categoryChartInstanceRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.categories.map(cat => cat.label),
            datasets: [{
              label: 'درصد تکمیل',
              data: chartData.categories.map(cat => cat.percentage),
              backgroundColor: [
                'rgba(59, 130, 246, 0.7)',  // blue-500
                'rgba(16, 185, 129, 0.7)', // emerald-500
                'rgba(245, 158, 11, 0.7)',  // amber-500
                'rgba(239, 68, 68, 0.7)',   // red-500
                'rgba(139, 92, 246, 0.7)'  // violet-500
              ],
              borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
                'rgb(139, 92, 246)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart can be nice for category names
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'درصد تکمیل', font: { family: 'Vazirmatn', size: 12 }, color: '#4b5563' }, // text-gray-600
                ticks: { font: { family: 'Vazirmatn' }, callback: value => value + '%' }
              },
              y: {
                ticks: { font: { family: 'Vazirmatn', size: 11 } },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'پیشرفت بر اساس دسته‌بندی',
                font: { size: 16, family: 'Vazirmatn', weight: '600' },
                padding: { top: 10, bottom: 20 },
                color: '#374151' // text-gray-700
              },
              tooltip: {
                titleFont: { family: 'Vazirmatn' },
                bodyFont: { family: 'Vazirmatn' },
                 callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.x !== null) {
                           label += context.parsed.x + '%';
                        }
                        const category = chartData.categories[context.dataIndex];
                        if(category) {
                            label += ` (${category.completed}/${category.total} وظیفه)`;
                        }
                        return label;
                    }
                }
              }
            }
          }
        });
      }
    } else if (categoryChartInstanceRef.current) {
        categoryChartInstanceRef.current.destroy(); // Destroy if no data
        categoryChartInstanceRef.current = null;
    }
    return () => {
      categoryChartInstanceRef.current?.destroy();
      categoryChartInstanceRef.current = null;
    };
  }, [chartData.categories, chartData.overall.total]);


  if (chartData.overall.total === 0) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fadeIn" aria-labelledby="charts-display-title">
        <h3 id="charts-display-title" className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">نمودارهای پیشرفت</h3>
        <div className="text-center text-gray-500 py-10">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7c0-1.1.9-2 2-2h2.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l1.414-1.414A1 1 0 0116.414 5H19a2 2 0 012 2v10a2 2 0 01-2 2H9z"></path></svg>
          <p className="text-base">هنوز هیچ وظیفه‌ای برای نمایش در نمودارها وجود ندارد.</p>
          <p className="text-sm mt-1">پس از افزودن وظایف، نمودارهای پیشرفت در اینجا نمایش داده خواهند شد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fadeIn" aria-labelledby="charts-display-title">
      <h3 id="charts-display-title" className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 text-center">نمودارهای پیشرفت پروژه</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Overall Progress Chart Section */}
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg shadow-md border border-slate-200">
          <div className="relative h-64 sm:h-72 w-full mx-auto">
            <canvas ref={overallProgressChartRef} aria-label="نمودار دایره‌ای پیشرفت کلی پروژه"></canvas>
          </div>
        </div>

        {/* Category Progress Chart Section */}
        <div className="md:col-span-3 bg-slate-50 p-4 rounded-lg shadow-md border border-slate-200">
          <div className="relative h-72 sm:h-80 w-full">
            <canvas ref={categoryProgressChartRef} aria-label="نمودار میله‌ای پیشرفت وظایف بر اساس دسته‌بندی"></canvas>
          </div>
        </div>
      </div>
       <p className="text-xs text-gray-500 mt-6 text-center">
            توجه: نمودارها پیشرفت وظایف در دسته‌بندی‌های اصلی پروژه (به جز تب گزارشات) را نمایش می‌دهند و شامل زیرمجموعه‌ها نیز می‌شوند.
        </p>
    </div>
  );
};

export default ChartsDisplay;
