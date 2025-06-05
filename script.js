// Project Management Application
class ProjectManager {
    constructor() {
        this.currentUser = null;
        this.currentView = 'dashboard';
        this.currentProject = null;
        this.editingTask = null;
        this.editingProject = null;

        // Initialize data if not exists
        this.initializeData();

        // Bind event listeners
        this.bindEvents();

        // Check if user is logged in
        this.checkAuth();
    }

    // Initialize default data
    initializeData() {
        if (!localStorage.getItem('pmUsers')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    name: 'System Administrator',
                    email: 'admin@company.com'
                },
                {
                    id: 2,
                    username: 'user',
                    password: 'user123',
                    role: 'user',
                    name: 'Team Member',
                    email: 'user@company.com'
                }
            ];
            localStorage.setItem('pmUsers', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('pmProjects')) {
            const defaultProjects = [
                {
                    id: 1,
                    name: 'Website Redesign',
                    description: 'Complete overhaul of company website with modern design',
                    status: 'In Progress',
                    createdDate: '2025-06-01',
                    assignedUsers: [1, 2]
                },
                {
                    id: 2,
                    name: 'Mobile App Development',
                    description: 'Build cross-platform mobile application',
                    status: 'Planning',
                    createdDate: '2025-06-02',
                    assignedUsers: [1]
                }
            ];
            localStorage.setItem('pmProjects', JSON.stringify(defaultProjects));
        }

        if (!localStorage.getItem('pmTasks')) {
            const defaultTasks = [
                {
                    id: 1,
                    projectId: 1,
                    title: 'Design Homepage Mockups',
                    description: 'Create initial design concepts for homepage',
                    status: 'Completed',
                    priority: 'High',
                    dueDate: '2025-06-10',
                    assignedUser: 2,
                    notes: 'Mockups approved by stakeholders',
                    responses: []
                },
                {
                    id: 2,
                    projectId: 1,
                    title: 'Implement Frontend',
                    description: 'Code the approved designs using React',
                    status: 'In Progress',
                    priority: 'High',
                    dueDate: '2025-06-20',
                    assignedUser: 2,
                    notes: 'Using latest React version',
                    responses: []
                },
                {
                    id: 3,
                    projectId: 2,
                    title: 'Market Research',
                    description: 'Research competitor mobile apps',
                    status: 'Not Started',
                    priority: 'Medium',
                    dueDate: '2025-06-15',
                    assignedUser: 1,
                    notes: 'Focus on iOS and Android platforms',
                    responses: []
                }
            ];
            localStorage.setItem('pmTasks', JSON.stringify(defaultTasks));
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('pmTheme') || 'modern';
        document.body.setAttribute('data-theme', savedTheme);
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = savedTheme;
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Theme selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => this.changeTheme(e.target.value));
        }

        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // New project buttons
        const newProjectBtns = document.querySelectorAll('#new-project-btn, #new-project-btn-2');
        newProjectBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showProjectModal());
        });

        // New task button
        const newTaskBtn = document.getElementById('new-task-btn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => this.showTaskModal());
        }

        // Back to projects
        const backBtn = document.getElementById('back-to-projects');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.switchView('projects'));
        }

        // Modal close buttons
        const modalCloses = document.querySelectorAll('.modal-close');
        modalCloses.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Project form
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectSubmit(e));
        }

        // Task form
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        }

        // Response form
        const responseForm = document.getElementById('response-form');
        if (responseForm) {
            responseForm.addEventListener('submit', (e) => this.handleResponseSubmit(e));
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    // Authentication
    checkAuth() {
        const userData = localStorage.getItem('pmCurrentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('pmUsers') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('pmCurrentUser', JSON.stringify(user));
            this.showApp();
        } else {
            this.showError('Invalid username or password');
        }
    }

    logout() {
        localStorage.removeItem('pmCurrentUser');
        this.currentUser = null;
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // Update user info
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && this.currentUser) {
            userNameEl.textContent = this.currentUser.name;
        }

        this.switchView('dashboard');
    }

    showError(message) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 3000);
        }
    }

    // Theme management
    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('pmTheme', theme);
    }

    // View management
    switchView(view) {
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.view === view) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update views
        const views = document.querySelectorAll('.view');
        views.forEach(v => v.classList.remove('active'));

        const targetView = document.getElementById(`${view}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        this.currentView = view;

        // Load view content
        switch (view) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'tasks':
                this.loadAllTasks();
                break;
        }
    }

    // Dashboard
    loadDashboard() {
        const projects = this.getProjects();
        const tasks = this.getTasks();

        // Update stats
        document.getElementById('total-projects').textContent = projects.length;
        document.getElementById('active-tasks').textContent = tasks.filter(t => t.status !== 'Completed').length;
        document.getElementById('completed-tasks').textContent = tasks.filter(t => t.status === 'Completed').length;

        // Show recent projects
        this.renderProjects(projects.slice(0, 3), 'projects-list');
    }

    // Projects
    loadProjects() {
        const projects = this.getProjects();
        this.renderProjects(projects, 'all-projects-list');
    }

    renderProjects(projects, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = projects.map(project => `
            <div class="project-card" onclick="app.showProjectDetail(${project.id})">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-meta">
                    <span class="project-status status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                    <span class="project-date">${new Date(project.createdDate).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    showProjectDetail(projectId) {
        const project = this.getProjects().find(p => p.id === projectId);
        if (!project) return;

        this.currentProject = project;

        // Update project detail view
        document.getElementById('project-title').textContent = project.name;

        // Show project detail view
        const views = document.querySelectorAll('.view');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById('project-detail-view').classList.add('active');

        this.loadProjectTasks(projectId);
    }

    loadProjectTasks(projectId) {
        const tasks = this.getTasks().filter(t => t.projectId === projectId);
        this.renderTasks(tasks, 'project-tasks');
    }

    // Tasks
    loadAllTasks() {
        const tasks = this.getTasks();
        this.renderTasks(tasks, 'all-tasks-list');
    }

    renderTasks(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const users = this.getUsers();

        container.innerHTML = tasks.map(task => {
            const assignedUser = users.find(u => u.id === task.assignedUser);
            return `
                <div class="task-card">
                    <div class="task-header">
                        <h4 class="task-title">${task.title}</h4>
                    </div>
                    <p class="task-description">${task.description}</p>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                        <span class="project-status status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                        <span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span class="task-assignee">Assigned: ${assignedUser ? assignedUser.name : 'Unassigned'}</span>
                    </div>
                    ${task.notes ? `<p class="task-notes"><strong>Notes:</strong> ${task.notes}</p>` : ''}
                    <div class="task-actions">
                        <button class="btn btn-primary btn-small" onclick="app.showResponseModal(${task.id})">
                            View & Respond
                        </button>
                        <button class="btn btn-outline btn-small" onclick="app.editTask(${task.id})">
                            Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Modal management
    showProjectModal(projectId = null) {
        this.editingProject = projectId;
        const modal = document.getElementById('project-modal');
        const title = document.getElementById('project-modal-title');

        if (projectId) {
            const project = this.getProjects().find(p => p.id === projectId);
            title.textContent = 'Edit Project';

            // Populate form
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-status').value = project.status;
        } else {
            title.textContent = 'Create New Project';
            document.getElementById('project-form').reset();
        }

        modal.classList.remove('hidden');
    }

    showTaskModal(taskId = null) {
        this.editingTask = taskId;
        const modal = document.getElementById('task-modal');
        const title = document.getElementById('task-modal-title');

        if (taskId) {
            const task = this.getTasks().find(t => t.id === taskId);
            title.textContent = 'Edit Task';

            // Populate form
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-notes').value = task.notes;
        } else {
            title.textContent = 'Create New Task';
            document.getElementById('task-form').reset();
        }

        modal.classList.remove('hidden');
    }

    showResponseModal(taskId) {
        const task = this.getTasks().find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('response-modal');

        // Populate task info
        document.getElementById('response-task-title').textContent = task.title;
        document.getElementById('response-task-description').textContent = task.description;

        // Clear previous response
        document.getElementById('task-response').value = '';
        document.getElementById('analysis-result').classList.add('hidden');

        // Show previous responses
        this.renderPreviousResponses(task.responses);

        // Store current task ID
        modal.dataset.taskId = taskId;
        modal.classList.remove('hidden');
    }

    renderPreviousResponses(responses) {
        const container = document.getElementById('responses-list');
        if (responses && responses.length > 0) {
            container.innerHTML = responses.map(response => `
                <div class="response-item">
                    <div class="response-date">${new Date(response.date).toLocaleString()}</div>
                    <div class="response-text">${response.text}</div>
                    ${response.analysis ? `<div class="response-analysis">Analysis: ${response.analysis}</div>` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No previous responses.</p>';
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    }

    editTask(taskId) {
        this.showTaskModal(taskId);
    }

    // Form handlers
    handleProjectSubmit(e) {
        e.preventDefault();

        const projectData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            status: document.getElementById('project-status').value,
        };

        if (this.editingProject) {
            this.updateProject(this.editingProject, projectData);
        } else {
            this.createProject(projectData);
        }

        this.closeModals();
        this.refreshCurrentView();
    }

    handleTaskSubmit(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            notes: document.getElementById('task-notes').value,
            projectId: this.currentProject ? this.currentProject.id : 1,
            assignedUser: this.currentUser.id
        };

        if (this.editingTask) {
            this.updateTask(this.editingTask, taskData);
        } else {
            this.createTask(taskData);
        }

        this.closeModals();
        this.refreshCurrentView();
    }

    handleResponseSubmit(e) {
        e.preventDefault();

        const modal = document.getElementById('response-modal');
        const taskId = parseInt(modal.dataset.taskId);
        const responseText = document.getElementById('task-response').value;

        if (!responseText.trim()) return;

        const analysis = this.analyzeResponse(responseText);

        // Show analysis result
        const analysisResult = document.getElementById('analysis-result');
        const analysisText = document.getElementById('analysis-text');

        analysisResult.className = `analysis-result analysis-${analysis.type}`;
        analysisText.textContent = analysis.message;
        analysisResult.classList.remove('hidden');

        // Save response
        this.addTaskResponse(taskId, responseText, analysis);

        // Update task status if completed
        if (analysis.type === 'completed') {
            this.updateTask(taskId, { status: 'Completed' });
        }
    }

    // Text analysis
    analyzeResponse(text) {
        const lowerText = text.toLowerCase();

        const completedKeywords = ['done', 'finished', 'completed', 'ready', 'success', 'accomplished'];
        const needsWorkKeywords = ['need', 'problem', 'issue', 'stuck', 'blocked', 'help', 'difficult'];
        const additionalTasksKeywords = ['also need', 'should add', 'create another', 'new task', 'additional'];

        if (completedKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                type: 'completed',
                message: '✅ Task appears to be completed! Status will be updated automatically.'
            };
        }

        if (needsWorkKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                type: 'needs-work',
                message: '⚠️ Task needs additional work or attention. Consider updating the status or adding notes.'
            };
        }

        if (additionalTasksKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                type: 'additional-tasks',
                message: '📋 Response suggests additional tasks may be needed. Consider creating new tasks.'
            };
        }

        return {
            type: 'general',
            message: '💬 Response recorded. Task status remains unchanged.'
        };
    }

    // Data management
    getUsers() {
        return JSON.parse(localStorage.getItem('pmUsers') || '[]');
    }

    getProjects() {
        const projects = JSON.parse(localStorage.getItem('pmProjects') || '[]');
        if (this.currentUser.role === 'user') {
            return projects.filter(p => p.assignedUsers.includes(this.currentUser.id));
        }
        return projects;
    }

    getTasks() {
        const tasks = JSON.parse(localStorage.getItem('pmTasks') || '[]');
        if (this.currentUser.role === 'user') {
            return tasks.filter(t => t.assignedUser === this.currentUser.id);
        }
        return tasks;
    }

    createProject(projectData) {
        const projects = JSON.parse(localStorage.getItem('pmProjects') || '[]');
        const newProject = {
            id: Date.now(),
            ...projectData,
            createdDate: new Date().toISOString().split('T')[0],
            assignedUsers: [this.currentUser.id]
        };
        projects.push(newProject);
        localStorage.setItem('pmProjects', JSON.stringify(projects));
    }

    updateProject(projectId, projectData) {
        const projects = JSON.parse(localStorage.getItem('pmProjects') || '[]');
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...projectData };
            localStorage.setItem('pmProjects', JSON.stringify(projects));
        }
    }

    createTask(taskData) {
        const tasks = JSON.parse(localStorage.getItem('pmTasks') || '[]');
        const newTask = {
            id: Date.now(),
            ...taskData,
            responses: []
        };
        tasks.push(newTask);
        localStorage.setItem('pmTasks', JSON.stringify(tasks));
    }

    updateTask(taskId, taskData) {
        const tasks = JSON.parse(localStorage.getItem('pmTasks') || '[]');
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            localStorage.setItem('pmTasks', JSON.stringify(tasks));
        }
    }

    addTaskResponse(taskId, responseText, analysis) {
        const tasks = JSON.parse(localStorage.getItem('pmTasks') || '[]');
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (!task.responses) task.responses = [];
            task.responses.push({
                text: responseText,
                analysis: analysis.message,
                date: new Date().toISOString(),
                user: this.currentUser.name
            });
            localStorage.setItem('pmTasks', JSON.stringify(tasks));

            // Refresh the previous responses display
            this.renderPreviousResponses(task.responses);
        }
    }

    refreshCurrentView() {
        this.switchView(this.currentView);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProjectManager();
});