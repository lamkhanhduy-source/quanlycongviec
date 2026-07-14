        // --- Core Application State ---
        let tasks = [];
        let activeStatusFilter = 'all';
        let activeCategoryFilter = 'all';

        // --- DOM Elements Selector ---
        const taskForm = document.getElementById('task-form');
        const taskInput = document.getElementById('task-input');
        const taskCategory = document.getElementById('task-category');
        const taskPriority = document.getElementById('task-priority');
        const taskDueDate = document.getElementById('task-due-date');
        const taskSort = document.getElementById('task-sort');

        const tasksContainer = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');
        const filteredCount = document.getElementById('filtered-count');

        // Stats Elements
        const progressBarFill = document.getElementById('progress-bar-fill');
        const progressPercentageBadge = document.getElementById('progress-percentage-badge');
        const progressTextCompleted = document.getElementById('progress-text-completed');
        const progressEncouragement = document.getElementById('progress-encouragement');
        const statsPending = document.getElementById('stats-pending');
        const statsHigh = document.getElementById('stats-high');

        // Modal Elements
        const editModal = document.getElementById('edit-modal');
        const editForm = document.getElementById('edit-form');
        const editTaskId = document.getElementById('edit-task-id');
        const editTaskInput = document.getElementById('edit-task-input');
        const editTaskCategory = document.getElementById('edit-task-category');
        const editTaskPriority = document.getElementById('edit-task-priority');
        const editTaskDueDate = document.getElementById('edit-task-due-date');

        // Default Welcome Tasks (if localStorage is empty)
        const defaultTasks = [
            {
                id: 'default-1',
                title: '💡 Read the welcome guide & customize your views',
                category: 'Personal',
                priority: 'Low',
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: Date.now() - 3000
            },
            {
                id: 'default-2',
                title: '🎯 Design your key priorities for the week',
                category: 'Work',
                priority: 'High',
                dueDate: new Date().toISOString().split('T')[0],
                completed: true,
                createdAt: Date.now() - 2000
            },
            {
                id: 'default-3',
                title: '📚 Study daily goals & progress trackers',
                category: 'Study',
                priority: 'Medium',
                dueDate: '',
                completed: false,
                createdAt: Date.now() - 1000
            }
        ];

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            loadTasksFromLocalStorage();
            initializeFilterEvents();
            taskSort.addEventListener('change', renderTasks);
            
            // Set today's date as default placeholder in Due Date picker
            const todayStr = new Date().toISOString().split('T')[0];
            taskDueDate.setAttribute('min', todayStr);
        });

        // --- LOCAL STORAGE INTEGRATION ---

        /**
         * Safely serializes and saves the active tasks array into client side storage.
         */
        function saveTasksToLocalStorage() {
            try {
                localStorage.setItem('dotoday_tasks', JSON.stringify(tasks));
                updateDashboardMetrics();
            } catch (error) {
                console.error("Error writing configurations to localStorage", error);
            }
        }

        /**
         * Safely restores user task payload. Standard fallback to pre-built tasks is run on initial boot.
         */
        function loadTasksFromLocalStorage() {
            try {
                const rawTasks = localStorage.getItem('dotoday_tasks');
                if (rawTasks !== null) {
                    tasks = JSON.parse(rawTasks);
                } else {
                    // Seed initial onboarding content if user database is clean
                    tasks = [...defaultTasks];
                    saveTasksToLocalStorage();
                }
            } catch (error) {
                console.error("Failed parsing persistent state. Corrupted structure corrected.", error);
                tasks = [...defaultTasks];
            }
            renderTasks();
        }

        // --- TASK CRUD SYSTEM ---

        // Create Task
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newTask = {
                id: 'task_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
                title: taskInput.value.trim(),
                category: taskCategory.value,
                priority: taskPriority.value,
                dueDate: taskDueDate.value,
                completed: false,
                createdAt: Date.now()
            };

            tasks.unshift(newTask);
            saveTasksToLocalStorage();
            renderTasks();

            // Reset Input Controls
            taskForm.reset();
        });

        // Delete Task
        function deleteTask(id) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasksToLocalStorage();
            renderTasks();
        }

        // Toggle Task Completion State
        function toggleTaskStatus(id) {
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            });
            saveTasksToLocalStorage();
            renderTasks();
        }

        // Edit Modal Trigger
        function openEditModal(id) {
            const taskToEdit = tasks.find(task => task.id === id);
            if (!taskToEdit) return;

            editTaskId.value = taskToEdit.id;
            editTaskInput.value = taskToEdit.title;
            editTaskCategory.value = taskToEdit.category;
            editTaskPriority.value = taskToEdit.priority;
            editTaskDueDate.value = taskToEdit.dueDate;

            editModal.classList.remove('hidden');
        }

        function closeEditModal() {
            editModal.classList.add('hidden');
        }

        // Update task action
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = editTaskId.value;
            
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return {
                        ...task,
                        title: editTaskInput.value.trim(),
                        category: editTaskCategory.value,
                        priority: editTaskPriority.value,
                        dueDate: editTaskDueDate.value
                    };
                }
                return task;
            });

            saveTasksToLocalStorage();
            closeEditModal();
            renderTasks();
        });

        // --- DISPLAY & RENDERING ---

        /**
         * Renders sorted and filtered elements to the list view.
         */
        function renderTasks() {
            let processedTasks = [...tasks];

            // Filter Application
            if (activeStatusFilter !== 'all') {
                const filterStatus = activeStatusFilter === 'completed';
                processedTasks = processedTasks.filter(task => task.completed === filterStatus);
            }
            if (activeCategoryFilter !== 'all') {
                processedTasks = processedTasks.filter(task => task.category === activeCategoryFilter);
            }

            // Sorting Engine
            const sortMode = taskSort.value;
            processedTasks.sort((a, b) => {
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                
                if (sortMode === 'priority-high') {
                    return priorityWeight[b.priority] - priorityWeight[a.priority];
                }
                if (sortMode === 'priority-low') {
                    return priorityWeight[a.priority] - priorityWeight[b.priority];
                }
                if (sortMode === 'date-asc') {
                    return a.createdAt - b.createdAt;
                }
                if (sortMode === 'date-desc') {
                    return b.createdAt - a.createdAt;
                }
                if (sortMode === 'due-date') {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                return 0;
            });

            // Update DOM
            tasksContainer.innerHTML = '';
            filteredCount.innerText = `${processedTasks.length} ${processedTasks.length === 1 ? 'item' : 'items'}`;

            if (processedTasks.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                processedTasks.forEach(task => {
                    tasksContainer.appendChild(createTaskCard(task));
                });
            }

            updateDashboardMetrics();
        }

        /**
         * Dynamically produces highly-optimized HTML structure for task nodes
         */
        function createTaskCard(task) {
            const card = document.createElement('div');
            card.className = `p-4 bg-white rounded-xl border transition-all duration-200 flex items-start gap-3 shadow-sm hover:shadow-md ${
                task.completed ? 'border-slate-100 opacity-75' : 'border-slate-100 hover:border-slate-200'
            }`;

            // Priority badge templates
            const priorityColors = {
                High: 'bg-rose-50 text-rose-600 border-rose-100',
                Medium: 'bg-amber-50 text-amber-600 border-amber-100',
                Low: 'bg-emerald-50 text-emerald-600 border-emerald-100'
            };
            const pBadge = priorityColors[task.priority] || priorityColors['Medium'];

            // Due Date formulation
            let dueDateHTML = '';
            if (task.dueDate) {
                const opt = { month: 'short', day: 'numeric' };
                const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, opt);
                dueDateHTML = `<span class="flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>`;
            }

            card.innerHTML = `
                <div class="pt-0.5">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                        onclick="toggleTaskStatus('${task.id}')"
                        class="task-checkbox h-5 w-5 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-500">
                </div>
                <div class="flex-1 min-w-0">
                    <span class="block text-sm font-semibold text-slate-800 break-words leading-relaxed ${task.completed ? 'line-through text-slate-400' : ''}">
                        ${escapeHTML(task.title)}
                    </span>
                    <div class="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-400 font-medium">
                        <span class="flex items-center gap-1"><i class="fa-regular fa-folder"></i> ${task.category}</span>
                        ${dueDateHTML}
                        <span class="px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider ${pBadge}">${task.priority}</span>
                    </div>
                </div>
                <div class="flex items-center gap-1 action-buttons">
                    <button onclick="openEditModal('${task.id}')" class="p-1.5 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors" title="Edit Task">
                        <i class="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button onclick="deleteTask('${task.id}')" class="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors" title="Delete Task">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            `;
            return card;
        }

        // --- PROGRESS & STATS CALCULATOR ---
        
        function updateDashboardMetrics() {
            const total = tasks.length;
            const completed = tasks.filter(task => task.completed).length;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            // Progress Elements
            progressBarFill.style.width = `${progress}%`;
            progressPercentageBadge.innerText = `${progress}% Done`;
            progressTextCompleted.innerText = `${completed} of ${total} tasks completed`;

            // Encouragement dynamic helper text
            let phrase = 'Add some ideas to get started!';
            if (total > 0) {
                if (progress === 100) phrase = '🎉 Outstanding work! All tasks done!';
                else if (progress >= 70) phrase = 'Almost there! Exceptional progress!';
                else if (progress >= 30) phrase = 'Doing great! Keep the momentum up!';
                else phrase = 'Step by step, you got this!';
            }
            progressEncouragement.innerText = phrase;

            // Stats Panels update
            statsPending.innerText = tasks.filter(task => !task.completed).length;
            statsHigh.innerText = tasks.filter(task => task.priority === 'High' && !task.completed).length;
        }

        // --- EVENT HANDLERS FOR FILTERS ---

        function initializeFilterEvents() {
            // Status Filters Setup
            document.querySelectorAll('#status-filters button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('#status-filters button').forEach(b => {
                        b.className = "filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all";
                    });
                    btn.className = "filter-btn active-filter px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white transition-all";
                    activeStatusFilter = btn.getAttribute('data-filter');
                    renderTasks();
                });
            });

            // Category Filters Setup
            document.querySelectorAll('#category-filters button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('#category-filters button').forEach(b => {
                        b.className = "cat-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all";
                    });
                    btn.className = "cat-filter-btn active-filter px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white transition-all";
                    activeCategoryFilter = btn.getAttribute('data-cat');
                    renderTasks();
                });
            });
        }

        // --- EXPORT PDF FEATURE ---

        function exportToPDF() {
            const printDateContainer = document.getElementById('print-date');
            if (printDateContainer) {
                printDateContainer.innerText = `Generated on: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            }

            const element = document.getElementById('printable-area');
            const opt = {
                margin:       10,
                filename:     `DoToday_Task_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Temporary CSS override for cleanly styling inside PDF sandbox
            document.body.classList.add('printing');
            html2pdf().from(element).set(opt).save().then(() => {
                document.body.classList.remove('printing');
            });
        }

        // Helper function to escape user HTML string inputs
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }