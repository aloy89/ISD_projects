// Project Management Application
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.currentTask = null;
        this.teamMembers = ["Aloysius", "Jac", "Rob", "Qijia", "Tony", "Karina"];
        this.taskStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
        this.priorities = ["Low", "Medium", "High"];
        this.projectStatuses = ["Active", "On Hold", "Completed", "Cancelled"];
        this.currentView = 'dashboard';
        
        this.init();
    }

    init() {
        this.loadData();
        this.initializeEventListeners();
        this.populateDropdowns();
        this.showView('dashboard');
        this.updateDashboard();
    }

    loadData() {
        const savedData = localStorage.getItem('projectManagerData');
        if (savedData) {
            this.projects = JSON.parse(savedData);
        } else {
            // Initialize with sample data
            this.initializeSampleData();
        }
    }

    saveData() {
        localStorage.setItem('projectManagerData', JSON.stringify(this.projects));
    }

    initializeSampleData() {
        const sampleProject = {
            id: 'tie-project-1',
            name: 'TIE',
            description: 'Technology in Education project',
            created: '2025-06-03',
            status: 'Active',
            startDate: '2025-06-01',
            endDate: '2025-12-31',
            tasks: [
                {
                    id: 'task-1',
                    name: 'Student Enrollment',
                    status: 'In Progress',
                    currentStatus: 'Out of the 24 students currently enrolled only one decided to withdraw.',
                    nextSteps: '',
                    dueDate: '2025-06-15',
                    personInCharge: 'Aloysius',
                    priority: 'High',
                    notes: [
                        {id: 'note-1', text: 'Initial enrollment complete', author: 'System', timestamp: '2025-06-03T10:00:00Z'}
                    ],
                    created: '2025-06-03'
                },
                {
                    id: 'task-2',
                    name: 'Wechat group',
                    status: 'Completed',
                    currentStatus: 'created for students to interact with each other and the professors',
                    nextSteps: '',
                    dueDate: '',
                    personInCharge: '',
                    priority: 'Medium',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-3',
                    name: 'Engage students',
                    status: 'In Progress',
                    currentStatus: 'Refer them to online courses to bring students from various backgrounds up to speed on different topics',
                    nextSteps: '',
                    dueDate: '2025-06-20',
                    personInCharge: '',
                    priority: 'High',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-4',
                    name: 'Planning for Orientation camp',
                    status: 'Pending',
                    currentStatus: '',
                    nextSteps: '',
                    dueDate: '2025-06-15',
                    personInCharge: '',
                    priority: 'Medium',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-5',
                    name: 'Course work design and Prototyping',
                    status: 'Pending',
                    currentStatus: '',
                    nextSteps: '',
                    dueDate: '2025-06-30',
                    personInCharge: 'Jac',
                    priority: 'High',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-6',
                    name: 'Course work on marine tech',
                    status: 'Pending',
                    currentStatus: '',
                    nextSteps: '',
                    dueDate: '2025-07-15',
                    personInCharge: 'Rob',
                    priority: 'Medium',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-7',
                    name: 'Course work on health tech',
                    status: 'Pending',
                    currentStatus: '',
                    nextSteps: '',
                    dueDate: '2025-07-15',
                    personInCharge: 'Qijia',
                    priority: 'Medium',
                    notes: [],
                    created: '2025-06-03'
                },
                {
                    id: 'task-8',
                    name: 'Coaches check In points',
                    status: 'Pending',
                    currentStatus: '',
                    nextSteps: '',
                    dueDate: '',
                    personInCharge: 'Aloysius',
                    priority: 'Low',
                    notes: [],
                    created: '2025-06-03'
                }
            ]
        };
        
        this.projects = [sampleProject];
        this.saveData();
    }

    generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // Project buttons
        document.getElementById('newProjectBtn').addEventListener('click', () => this.showProjectModal());
        document.getElementById('newProjectBtn2').addEventListener('click', () => this.showProjectModal());
        document.getElementById('backToProjects').addEventListener('click', () => this.showView('projects'));
        document.getElementById('editProjectBtn').addEventListener('click', () => this.showProjectModal(this.currentProject));

        // Project modal
        document.getElementById('closeProjectModal').addEventListener('click', () => this.hideProjectModal());
        document.getElementById('cancelProjectBtn').addEventListener('click', () => this.hideProjectModal());
        document.getElementById('projectForm').addEventListener('submit', (e) => this.handleProjectSubmit(e));

        // Task modal
        document.getElementById('newTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('closeTaskModal').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Task detail modal
        document.getElementById('closeTaskDetailModal').addEventListener('click', () => this.hideTaskDetailModal());
        document.getElementById('editTaskBtn').addEventListener('click', () => this.editCurrentTask());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.deleteCurrentTask());

        // Notes
        document.getElementById('addNoteBtn').addEventListener('click', () => this.showAddNoteForm());
        document.getElementById('cancelNoteBtn').addEventListener('click', () => this.hideAddNoteForm());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Filters
        document.getElementById('projectStatusFilter').addEventListener('change', (e) => this.filterProjects(e.target.value));
        document.getElementById('taskStatusFilter').addEventListener('change', (e) => this.filterTasks());
        document.getElementById('taskAssigneeFilter').addEventListener('change', (e) => this.filterTasks());

        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // Confirmation modal
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideConfirmModal());

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    populateDropdowns() {
        // Team members dropdown
        const teamDropdowns = ['taskPersonInCharge', 'taskAssigneeFilter'];
        teamDropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                // Clear existing options except first
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                this.teamMembers.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member;
                    option.textContent = member;
                    select.appendChild(option);
                });
            }
        });
    }

    showView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`${viewName}View`).classList.add('active');
        this.currentView = viewName;

        // Update view content
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'projects':
                this.updateProjectsList();
                break;
            case 'search':
                this.clearSearch();
                break;
        }
    }

    updateDashboard() {
        // Calculate stats
        const totalProjects = this.projects.length;
        const allTasks = this.projects.flatMap(p => p.tasks);
        const activeTasks = allTasks.filter(t => t.status !== 'Completed').length;
        const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
        const overdueTasks = allTasks.filter(t => this.isOverdue(t)).length;

        // Update stats
        document.getElementById('totalProjects').textContent = totalProjects;
        document.getElementById('activeTasks').textContent = activeTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;

        // Update recent projects
        const recentProjects = this.projects.slice(0, 3);
        this.renderProjectCards(recentProjects, 'recentProjects');

        // Update upcoming tasks
        const upcomingTasks = allTasks
            .filter(t => t.dueDate && new Date(t.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
        this.renderUpcomingTasks(upcomingTasks);
    }

    updateProjectsList() {
        this.renderProjectCards(this.projects, 'projectsList');
    }

    renderProjectCards(projects, containerId) {
        const container = document.getElementById(containerId);
        
        if (projects.length === 0) {
            container.innerHTML = '<p class="text-secondary">No projects found.</p>';
            return;
        }

        container.innerHTML = projects.map(project => {
            const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

            return `
                <div class="project-card" onclick="app.showProjectDetail('${project.id}')">
                    <div class="project-card-header">
                        <h3>${this.escapeHtml(project.name)}</h3>
                        <span class="status status--${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                    </div>
                    <p class="project-card-description">${this.escapeHtml(project.description || 'No description')}</p>
                    <div class="project-card-footer">
                        <div class="project-stats">${completedTasks}/${totalTasks} tasks completed</div>
                        <div class="progress-bar" style="width: 100px;">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderUpcomingTasks(tasks) {
        const container = document.getElementById('upcomingTasks');
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="text-secondary">No upcoming deadlines.</p>';
            return;
        }

        container.innerHTML = tasks.map(task => {
            const project = this.projects.find(p => p.tasks.some(t => t.id === task.id));
            const isOverdue = this.isOverdue(task);
            
            return `
                <div class="task-list-item" onclick="app.showTaskDetail('${project.id}', '${task.id}')">
                    <div class="task-list-info">
                        <h4 class="task-list-title">${this.escapeHtml(task.name)}</h4>
                        <p class="task-list-project">${this.escapeHtml(project.name)}</p>
                    </div>
                    <div class="task-list-meta">
                        <span class="status status--${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">${this.formatDate(task.dueDate)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    showProjectDetail(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        this.currentProject = project;
        
        // Update project info
        document.getElementById('projectTitle').textContent = project.name;
        document.getElementById('projectDescription').textContent = project.description || 'No description';
        document.getElementById('projectStatus').className = `status status--${project.status.toLowerCase().replace(' ', '-')}`;
        document.getElementById('projectStatus').textContent = project.status;
        
        const dateRange = `${this.formatDate(project.startDate)} - ${this.formatDate(project.endDate)}`;
        document.getElementById('projectDates').textContent = dateRange;
        
        // Update progress
        const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
        const totalTasks = project.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
        document.getElementById('projectProgress').style.width = `${progress}%`;

        // Reset filters
        document.getElementById('taskStatusFilter').value = '';
        document.getElementById('taskAssigneeFilter').value = '';

        // Render tasks
        this.renderTasks(project.tasks);
        
        this.showView('projectDetail');
    }

    renderTasks(tasks) {
        const container = document.getElementById('tasksList');
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="text-secondary">No tasks found.</p>';
            return;
        }

        container.innerHTML = tasks.map(task => {
            const isOverdue = this.isOverdue(task);
            
            return `
                <div class="task-item" onclick="app.showTaskDetail('${this.currentProject.id}', '${task.id}')">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'Completed' ? 'checked' : ''} 
                           onclick="app.toggleTaskComplete(event, '${task.id}')">
                    <div class="task-content">
                        <h4 class="task-title">${this.escapeHtml(task.name)}</h4>
                        <div class="task-meta">
                            <span class="status status--${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                            <span class="priority priority--${task.priority.toLowerCase()}">${task.priority}</span>
                            ${task.personInCharge ? `<span class="task-assignee">${this.escapeHtml(task.personInCharge)}</span>` : ''}
                            ${task.dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">Due: ${this.formatDate(task.dueDate)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleTaskComplete(event, taskId) {
        event.stopPropagation();
        
        const task = this.currentProject.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.status = event.target.checked ? 'Completed' : 'Pending';
        this.saveData();
        this.renderTasks(this.filterCurrentTasks());
        this.updateDashboard();
    }

    filterCurrentTasks() {
        if (!this.currentProject) return [];

        const statusFilter = document.getElementById('taskStatusFilter').value;
        const assigneeFilter = document.getElementById('taskAssigneeFilter').value;

        let filteredTasks = this.currentProject.tasks;

        if (statusFilter) {
            filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
        }

        if (assigneeFilter) {
            filteredTasks = filteredTasks.filter(t => t.personInCharge === assigneeFilter);
        }

        return filteredTasks;
    }

    showTaskDetail(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        this.currentProject = project;
        this.currentTask = task;

        // Update task detail info
        document.getElementById('taskDetailTitle').textContent = task.name;
        document.getElementById('taskDetailStatus').className = `status status--${task.status.toLowerCase().replace(' ', '-')}`;
        document.getElementById('taskDetailStatus').textContent = task.status;
        document.getElementById('taskDetailPriority').className = `priority priority--${task.priority.toLowerCase()}`;
        document.getElementById('taskDetailPriority').textContent = task.priority;
        document.getElementById('taskDetailAssignee').textContent = task.personInCharge || 'Unassigned';
        document.getElementById('taskDetailDueDate').textContent = task.dueDate ? `Due: ${this.formatDate(task.dueDate)}` : 'No due date';
        document.getElementById('taskDetailCurrentStatus').textContent = task.currentStatus || 'No current status';
        document.getElementById('taskDetailNextSteps').textContent = task.nextSteps || 'No next steps defined';

        // Render notes
        this.renderNotes(task.notes);

        // Hide add note form
        this.hideAddNoteForm();

        document.getElementById('taskDetailModal').classList.add('active');
    }

    renderNotes(notes) {
        const container = document.getElementById('taskNotesList');
        
        if (notes.length === 0) {
            container.innerHTML = '<p class="text-secondary">No notes yet.</p>';
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-item">
                <div class="note-header">
                    <span>${this.escapeHtml(note.author)}</span>
                    <div class="note-actions">
                        <span>${this.formatDateTime(note.timestamp)}</span>
                        <button class="note-action" onclick="app.deleteNote('${note.id}')">Delete</button>
                    </div>
                </div>
                <p class="note-text">${this.escapeHtml(note.text)}</p>
            </div>
        `).join('');
    }

    showProjectModal(project = null) {
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        
        if (project) {
            document.getElementById('projectModalTitle').textContent = 'Edit Project';
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('projectStatusSelect').value = project.status;
            document.getElementById('projectStartDate').value = project.startDate || '';
            document.getElementById('projectEndDate').value = project.endDate || '';
            form.dataset.projectId = project.id;
        } else {
            document.getElementById('projectModalTitle').textContent = 'New Project';
            form.reset();
            delete form.dataset.projectId;
        }

        modal.classList.add('active');
        document.getElementById('projectName').focus();
    }

    hideProjectModal() {
        document.getElementById('projectModal').classList.remove('active');
    }

    handleProjectSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const projectData = {
            name: document.getElementById('projectName').value.trim(),
            description: document.getElementById('projectDescription').value.trim(),
            status: document.getElementById('projectStatusSelect').value,
            startDate: document.getElementById('projectStartDate').value,
            endDate: document.getElementById('projectEndDate').value
        };

        if (!projectData.name) {
            alert('Project name is required.');
            return;
        }

        if (form.dataset.projectId) {
            // Edit existing project
            const project = this.projects.find(p => p.id === form.dataset.projectId);
            Object.assign(project, projectData);
        } else {
            // Create new project
            const newProject = {
                id: this.generateId(),
                created: new Date().toISOString().split('T')[0],
                tasks: [],
                ...projectData
            };
            this.projects.push(newProject);
        }

        this.saveData();
        this.hideProjectModal();
        this.updateProjectsList();
        this.updateDashboard();
        
        if (this.currentView === 'projectDetail' && this.currentProject) {
            this.showProjectDetail(this.currentProject.id);
        }
    }

    showTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (task) {
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskCurrentStatus').value = task.currentStatus || '';
            document.getElementById('taskNextSteps').value = task.nextSteps || '';
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskPersonInCharge').value = task.personInCharge || '';
            document.getElementById('taskDueDate').value = task.dueDate || '';
            form.dataset.taskId = task.id;
        } else {
            document.getElementById('taskModalTitle').textContent = 'New Task';
            form.reset();
            document.getElementById('taskStatus').value = 'Pending';
            document.getElementById('taskPriority').value = 'Medium';
            delete form.dataset.taskId;
        }

        modal.classList.add('active');
        document.getElementById('taskName').focus();
    }

    hideTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
    }

    handleTaskSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const taskData = {
            name: document.getElementById('taskName').value.trim(),
            currentStatus: document.getElementById('taskCurrentStatus').value.trim(),
            nextSteps: document.getElementById('taskNextSteps').value.trim(),
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            personInCharge: document.getElementById('taskPersonInCharge').value,
            dueDate: document.getElementById('taskDueDate').value
        };

        if (!taskData.name) {
            alert('Task name is required.');
            return;
        }

        if (form.dataset.taskId) {
            // Edit existing task
            const task = this.currentProject.tasks.find(t => t.id === form.dataset.taskId);
            Object.assign(task, taskData);
        } else {
            // Create new task
            const newTask = {
                id: this.generateId(),
                created: new Date().toISOString().split('T')[0],
                notes: [],
                ...taskData
            };
            this.currentProject.tasks.push(newTask);
        }

        this.saveData();
        this.hideTaskModal();
        this.renderTasks(this.filterCurrentTasks());
        this.updateDashboard();
    }

    editCurrentTask() {
        this.hideTaskDetailModal();
        this.showTaskModal(this.currentTask);
    }

    deleteCurrentTask() {
        this.showConfirmModal(
            'Delete Task',
            'Are you sure you want to delete this task? This action cannot be undone.',
            () => {
                const taskIndex = this.currentProject.tasks.findIndex(t => t.id === this.currentTask.id);
                if (taskIndex > -1) {
                    this.currentProject.tasks.splice(taskIndex, 1);
                    this.saveData();
                    this.hideTaskDetailModal();
                    this.renderTasks(this.filterCurrentTasks());
                    this.updateDashboard();
                }
            }
        );
    }

    hideTaskDetailModal() {
        document.getElementById('taskDetailModal').classList.remove('active');
    }

    showAddNoteForm() {
        document.getElementById('addNoteForm').style.display = 'block';
        document.getElementById('newNoteText').focus();
    }

    hideAddNoteForm() {
        document.getElementById('addNoteForm').style.display = 'none';
        document.getElementById('newNoteText').value = '';
    }

    saveNote() {
        const noteText = document.getElementById('newNoteText').value.trim();
        if (!noteText) {
            alert('Please enter a note.');
            return;
        }

        const newNote = {
            id: this.generateId(),
            text: noteText,
            author: 'User',
            timestamp: new Date().toISOString()
        };

        this.currentTask.notes.push(newNote);
        this.saveData();
        this.hideAddNoteForm();
        this.renderNotes(this.currentTask.notes);
    }

    deleteNote(noteId) {
        this.showConfirmModal(
            'Delete Note',
            'Are you sure you want to delete this note?',
            () => {
                const noteIndex = this.currentTask.notes.findIndex(n => n.id === noteId);
                if (noteIndex > -1) {
                    this.currentTask.notes.splice(noteIndex, 1);
                    this.saveData();
                    this.renderNotes(this.currentTask.notes);
                }
            }
        );
    }

    handleSearch(query) {
        if (!query.trim()) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = [];
        const searchTerm = query.toLowerCase();

        // Search projects
        this.projects.forEach(project => {
            if (project.name.toLowerCase().includes(searchTerm) || 
                (project.description && project.description.toLowerCase().includes(searchTerm))) {
                results.push({
                    type: 'project',
                    item: project,
                    title: project.name,
                    description: project.description || ''
                });
            }

            // Search tasks
            project.tasks.forEach(task => {
                if (task.name.toLowerCase().includes(searchTerm) ||
                    (task.currentStatus && task.currentStatus.toLowerCase().includes(searchTerm)) ||
                    (task.nextSteps && task.nextSteps.toLowerCase().includes(searchTerm))) {
                    results.push({
                        type: 'task',
                        item: task,
                        project: project,
                        title: task.name,
                        description: task.currentStatus || task.nextSteps || ''
                    });
                }
            });
        });

        this.renderSearchResults(results);
    }

    renderSearchResults(results) {
        const container = document.getElementById('searchResults');
        
        if (results.length === 0) {
            container.innerHTML = '<p class="text-secondary">No results found.</p>';
            return;
        }

        container.innerHTML = results.map(result => `
            <div class="search-result" onclick="app.openSearchResult('${result.type}', '${result.item.id}', '${result.project ? result.project.id : ''}')" >
                <div class="search-result-header">
                    <h4 class="search-result-title">${this.escapeHtml(result.title)}</h4>
                    <span class="search-result-type">${result.type}</span>
                </div>
                <p class="search-result-description">${this.escapeHtml(result.description)}</p>
                ${result.project ? `<p class="search-result-description">Project: ${this.escapeHtml(result.project.name)}</p>` : ''}
            </div>
        `).join('');
    }

    openSearchResult(type, itemId, projectId) {
        if (type === 'project') {
            this.showProjectDetail(itemId);
        } else if (type === 'task') {
            this.showTaskDetail(projectId, itemId);
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    filterProjects(status) {
        const filteredProjects = status ? 
            this.projects.filter(p => p.status === status) : 
            this.projects;
        this.renderProjectCards(filteredProjects, 'projectsList');
    }

    filterTasks() {
        if (!this.currentProject) return;
        this.renderTasks(this.filterCurrentTasks());
    }

    exportData() {
        const dataStr = JSON.stringify(this.projects, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `project-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert('Data exported successfully!');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid data format');
                }
                
                this.showConfirmModal(
                    'Import Data',
                    'This will replace all existing data. Are you sure you want to continue?',
                    () => {
                        this.projects = importedData;
                        this.saveData();
                        this.updateDashboard();
                        this.updateProjectsList();
                        alert('Data imported successfully!');
                    }
                );
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const confirmBtn = document.getElementById('confirmAction');
        confirmBtn.onclick = () => {
            onConfirm();
            this.hideConfirmModal();
        };
        
        document.getElementById('confirmModal').classList.add('active');
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
    }

    // Utility functions
    isOverdue(task) {
        if (!task.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today && task.status !== 'Completed';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const app = new ProjectManager();