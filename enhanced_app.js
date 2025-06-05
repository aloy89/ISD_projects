
// Enhanced Project Management System
// Main Application JavaScript

// ========== Authentication Manager ==========
class AuthManager {
    constructor() {
        // Load users from localStorage or initialize with default admin
        this.users = JSON.parse(localStorage.getItem('users')) || [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                // Pre-hashed password for 'admin123'
                password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];

        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.token = localStorage.getItem('token') || null;
    }

    // Register a new user
    async register(username, email, password) {
        // Validate input
        if (!username || !email || !password) {
            throw new Error('All fields are required');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Check if user already exists
        if (this.users.some(u => u.email === email)) {
            throw new Error('Email already in use');
        }

        if (this.users.some(u => u.username === username)) {
            throw new Error('Username already taken');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
            username,
            email,
            password: hashedPassword,
            role: 'user', // Default role
            createdAt: new Date().toISOString()
        };

        // Add user to array
        this.users.push(newUser);

        // Save to localStorage
        this.persistUsers();

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    // Login user
    async login(email, password) {
        // Find user
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid email or password');
            }
        } catch (error) {
            // If bcrypt fails (e.g. with sample data), try direct comparison for demo purposes
            if (password !== 'admin123' || user.email !== 'admin@example.com') {
                throw new Error('Invalid email or password');
            }
        }

        // Create token (simple JWT-like token)
        const token = this.generateToken(user);

        // Set current user and token
        const { password: _, ...userWithoutPassword } = user;
        this.currentUser = userWithoutPassword;
        this.token = token;

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('token', token);

        return {
            user: userWithoutPassword,
            token
        };
    }

    // Generate token
    generateToken(user) {
        // Simple token generation (in real-world app, use proper JWT library)
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours expiry
        };

        return btoa(JSON.stringify(payload));
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }

    // Check if user is authenticated
    isAuthenticated() {
        if (!this.token) return false;

        try {
            const payload = JSON.parse(atob(this.token));
            // Check if token is expired
            if (payload.exp < Date.now()) {
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Check if user is admin
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    // Update user role
    updateUserRole(userId, newRole) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.role = newRole;
        this.persistUsers();

        // If updating current user, update current user info
        if (user.id === this.currentUser.id) {
            this.currentUser.role = newRole;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    // Get all users (admin only)
    getAllUsers() {
        if (!this.isAuthenticated()) {
            return [];
        }

        return this.users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    // Save users to localStorage
    persistUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Check password strength
    checkPasswordStrength(password) {
        if (!password) return { score: 0, message: '' };

        let score = 0;
        let message = '';

        // Length check
        if (password.length < 6) {
            score = 0;
            message = 'Too short';
        } else if (password.length < 8) {
            score = 1;
            message = 'Weak';
        } else if (password.length < 10) {
            score += 2;
            message = 'Medium';
        } else {
            score += 3;
            message = 'Strong';
        }

        // Complexity checks
        if (password.match(/[A-Z]/)) score += 1;
        if (password.match(/[a-z]/)) score += 1;
        if (password.match(/[0-9]/)) score += 1;
        if (password.match(/[^A-Za-z0-9]/)) score += 1;

        // Final score and message
        if (score < 3) {
            message = 'Weak';
        } else if (score < 6) {
            message = 'Medium';
        } else {
            message = 'Strong';
        }

        // Normalize score to 0-100
        const normalizedScore = Math.min(100, Math.round((score / 8) * 100));

        return {
            score: normalizedScore,
            message
        };
    }
}

// ========== Project Manager ==========
class ProjectManager {
    constructor(authManager) {
        this.auth = authManager;
        this.projects = JSON.parse(localStorage.getItem('projects')) || [];

        // Initialize with sample data if no projects exist
        if (this.projects.length === 0) {
            this.loadSampleData();
        }

        this.currentViewingTask = null;
        this.currentRespondingTask = null;
        this.currentEditingProject = null;
        this.currentEditingTask = null;
    }

    // Load sample project data
    loadSampleData() {
        this.projects = [
            {
                id: 1,
                name: "TIE - Teaching Innovation and Excellence",
                description: "Teaching Innovation and Excellence Project focused on improving educational outcomes",
                createdBy: "admin",
                assignedUsers: ["admin"],
                createdAt: new Date().toISOString(),
                tasks: [
                    {
                        id: 1,
                        name: "Student Enrollment",
                        description: "Complete student enrollment process for the new semester",
                        status: "In Progress",
                        assignee: "admin",
                        dueDate: "2025-06-15",
                        priority: "High",
                        projectId: 1,
                        createdBy: "admin",
                        notes: [
                            {
                                date: "2025-05-25",
                                content: "Started contacting prospective students",
                                author: "admin"
                            }
                        ]
                    },
                    {
                        id: 2,
                        name: "WeChat Group Creation",
                        description: "Create WeChat groups for new student cohorts",
                        status: "Completed",
                        assignee: "admin",
                        dueDate: "2025-06-01",
                        priority: "Medium",
                        projectId: 1,
                        createdBy: "admin",
                        notes: [
                            {
                                date: "2025-05-20",
                                content: "Created 3 WeChat groups for different sections",
                                author: "admin"
                            },
                            {
                                date: "2025-05-28",
                                content: "Added all student contacts to the groups",
                                author: "admin"
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: "Student Engagement Initiatives",
                        description: "Design new engagement activities for the upcoming term",
                        status: "Pending",
                        assignee: "admin",
                        dueDate: "2025-06-20",
                        priority: "Medium",
                        projectId: 1,
                        createdBy: "admin",
                        notes: []
                    }
                ]
            }
        ];
        this.persistProjects();
    }

    // Get projects based on user role
    getProjects(filter = 'all') {
        if (!this.auth.isAuthenticated()) {
            return [];
        }

        let filteredProjects = [...this.projects];

        // If not admin, filter to show only assigned projects
        if (!this.auth.isAdmin()) {
            filteredProjects = filteredProjects.filter(project => 
                project.assignedUsers.includes(this.auth.currentUser.username)
            );
        }

        // Apply additional filters
        if (filter === 'my') {
            filteredProjects = filteredProjects.filter(project => 
                project.createdBy === this.auth.currentUser.username ||
                project.tasks.some(task => task.assignee === this.auth.currentUser.username)
            );
        } else if (filter === 'active') {
            filteredProjects = filteredProjects.filter(project => 
                project.tasks.some(task => task.status !== 'Completed')
            );
        }

        return filteredProjects;
    }

    // Create a new project
    createProject(projectData) {
        if (!this.auth.isAuthenticated()) {
            throw new Error('You must be logged in to create a project');
        }

        const newProject = {
            id: this.projects.length > 0 ? Math.max(...this.projects.map(p => p.id)) + 1 : 1,
            name: projectData.name,
            description: projectData.description || '',
            createdBy: this.auth.currentUser.username,
            assignedUsers: projectData.assignedUsers || [this.auth.currentUser.username],
            createdAt: new Date().toISOString(),
            tasks: []
        };

        this.projects.push(newProject);
        this.persistProjects();

        return newProject;
    }

    // Update an existing project
    updateProject(projectId, projectData) {
        const project = this.projects.find(p => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Only creator or admin can update a project
        if (project.createdBy !== this.auth.currentUser.username && !this.auth.isAdmin()) {
            throw new Error('You do not have permission to update this project');
        }

        project.name = projectData.name;
        project.description = projectData.description || '';
        project.assignedUsers = projectData.assignedUsers || project.assignedUsers;

        this.persistProjects();

        return project;
    }

    // Delete a project
    deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);

        if (projectIndex === -1) {
            throw new Error('Project not found');
        }

        const project = this.projects[projectIndex];

        // Only creator or admin can delete a project
        if (project.createdBy !== this.auth.currentUser.username && !this.auth.isAdmin()) {
            throw new Error('You do not have permission to delete this project');
        }

        this.projects.splice(projectIndex, 1);
        this.persistProjects();
    }

    // Create a new task
    createTask(taskData) {
        const project = this.projects.find(p => p.id === taskData.projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check if user is assigned to the project or is admin
        if (!project.assignedUsers.includes(this.auth.currentUser.username) && !this.auth.isAdmin()) {
            throw new Error('You do not have permission to add tasks to this project');
        }

        const newTask = {
            id: project.tasks.length > 0 ? 
                Math.max(...project.tasks.map(t => t.id)) + 1 : 1,
            name: taskData.name,
            description: taskData.description || '',
            status: 'Pending',
            assignee: taskData.assignee,
            dueDate: taskData.dueDate,
            priority: taskData.priority || 'Medium',
            projectId: project.id,
            createdBy: this.auth.currentUser.username,
            notes: []
        };

        project.tasks.push(newTask);
        this.persistProjects();

        return newTask;
    }

    // Update an existing task
    updateTask(projectId, taskId, taskData) {
        const project = this.projects.find(p => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        const task = project.tasks.find(t => t.id === taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions - task creator, task assignee, or admin can update
        if (task.createdBy !== this.auth.currentUser.username && 
            task.assignee !== this.auth.currentUser.username && 
            !this.auth.isAdmin()) {
            throw new Error('You do not have permission to update this task');
        }

        // Update task fields
        task.name = taskData.name || task.name;
        task.description = taskData.description || task.description;
        task.assignee = taskData.assignee || task.assignee;
        task.dueDate = taskData.dueDate || task.dueDate;
        task.priority = taskData.priority || task.priority;
        if (taskData.status) task.status = taskData.status;

        this.persistProjects();

        return task;
    }

    // Delete a task
    deleteTask(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        const taskIndex = project.tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        const task = project.tasks[taskIndex];

        // Check permissions - only task creator or admin can delete
        if (task.createdBy !== this.auth.currentUser.username && !this.auth.isAdmin()) {
            throw new Error('You do not have permission to delete this task');
        }

        project.tasks.splice(taskIndex, 1);
        this.persistProjects();
    }

    // Add a note to a task
    addTaskNote(projectId, taskId, noteContent) {
        const project = this.projects.find(p => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        const task = project.tasks.find(t => t.id === taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Create the note
        const note = {
            date: new Date().toISOString().split('T')[0],
            content: noteContent,
            author: this.auth.currentUser.username
        };

        task.notes.push(note);

        // Analyze note to potentially update status
        const analysisResult = this.analyzeResponse(noteContent);
        if (analysisResult.newStatus) {
            task.status = analysisResult.newStatus;
        }

        this.persistProjects();

        return {
            task,
            analysis: analysisResult
        };
    }

    // Analyze task response for keywords
    analyzeResponse(text) {
        const lowerText = text.toLowerCase();

        // Completion keywords
        const completionKeywords = ['done', 'finished', 'completed', 'ready', 'delivered', 'sent', 'submitted', 'complete'];
        const progressKeywords = ['working on', 'in progress', 'almost done', 'need more time', 'blocked', 'waiting', 'started', 'begun'];
        const needsKeywords = ['need to', 'should add', 'also need', 'next we need', 'still need', 'requires', 'must also', 'planning to'];

        if (completionKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: 'Completed',
                message: '✅ Task status updated to "Completed" based on your response. Great work!'
            };
        } else if (progressKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: 'In Progress',
                message: '🔄 Task status updated to "In Progress" based on your response. Keep it up!'
            };
        } else if (needsKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: null,
                message: '📋 Your response suggests additional work may be needed. Consider creating new tasks if required.'
            };
        } else {
            return {
                newStatus: null,
                message: '📝 Response recorded successfully. No automatic status change detected.'
            };
        }
    }

    // Get all tasks for a specific user
    getUserTasks() {
        if (!this.auth.isAuthenticated()) {
            return [];
        }

        const username = this.auth.currentUser.username;
        const tasks = [];

        this.projects.forEach(project => {
            // Only include tasks from projects the user is assigned to
            if (this.auth.isAdmin() || project.assignedUsers.includes(username)) {
                const projectTasks = project.tasks.filter(task => 
                    this.auth.isAdmin() || task.assignee === username
                ).map(task => ({
                    ...task,
                    projectName: project.name
                }));

                tasks.push(...projectTasks);
            }
        });

        return tasks;
    }

    // Get task statistics
    getTaskStatistics() {
        if (!this.auth.isAuthenticated()) {
            return {};
        }

        const tasks = this.getUserTasks();

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const pending = tasks.filter(t => t.status === 'Pending').length;

        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        // Tasks due soon (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const dueSoon = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return task.status !== 'Completed' && 
                   dueDate >= today && 
                   dueDate <= nextWeek;
        }).length;

        // Overdue tasks
        const overdue = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return task.status !== 'Completed' && dueDate < today;
        }).length;

        return {
            total,
            completed,
            inProgress,
            pending,
            completionRate,
            dueSoon,
            overdue
        };
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Save projects to localStorage
    persistProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }
}

// ========== UI Manager ==========
class UIManager {
    constructor(authManager, projectManager) {
        this.auth = authManager;
        this.projectManager = projectManager;

        this.initializeElements();
        this.initializeEventListeners();
    }

    // Initialize UI elements
    initializeElements() {
        // Auth elements
        this.authSection = document.getElementById('auth-section');
        this.loginPage = document.getElementById('login-page');
        this.registerPage = document.getElementById('register-page');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginEmail = document.getElementById('login-email');
        this.loginPassword = document.getElementById('login-password');
        this.registerUsername = document.getElementById('register-username');
        this.registerEmail = document.getElementById('register-email');
        this.registerPassword = document.getElementById('register-password');
        this.strengthBar = document.getElementById('strength-bar');
        this.strengthText = document.getElementById('strength-text');

        // Main app elements
        this.mainApp = document.getElementById('main-app');
        this.userAvatar = document.getElementById('user-avatar');
        this.userDropdown = document.getElementById('user-dropdown');
        this.userName = document.getElementById('user-name');
        this.userRole = document.getElementById('user-role');
        this.userInitials = document.getElementById('user-initials');
        this.projectsContainer = document.getElementById('projects-container');
        this.projectFilter = document.getElementById('project-filter');

        // Buttons
        this.logoutBtn = document.getElementById('logout-btn');
        this.adminPanelBtn = document.getElementById('admin-panel');
        this.viewProfileBtn = document.getElementById('view-profile');
        this.createProjectBtn = document.getElementById('create-project-btn');
        this.createTaskBtn = document.getElementById('create-task-btn');

        // Modals
        this.taskViewModal = document.getElementById('task-view-modal');
        this.taskResponseModal = document.getElementById('task-response-modal');
        this.projectModal = document.getElementById('project-modal');
        this.taskModal = document.getElementById('task-modal');
        this.adminModal = document.getElementById('admin-modal');

        // Form elements
        this.projectForm = document.getElementById('project-form');
        this.projectName = document.getElementById('project-name');
        this.projectDescription = document.getElementById('project-description');
        this.projectUsers = document.getElementById('project-users');

        this.taskForm = document.getElementById('task-form');
        this.taskName = document.getElementById('task-name');
        this.taskDescription = document.getElementById('task-description');
        this.taskProject = document.getElementById('task-project');
        this.taskAssignee = document.getElementById('task-assignee');
        this.taskDueDate = document.getElementById('task-due-date');
        this.taskPriority = document.getElementById('task-priority');

        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Auth navigation
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.loginPage.classList.add('hidden');
            this.registerPage.classList.remove('hidden');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.registerPage.classList.add('hidden');
            this.loginPage.classList.remove('hidden');
        });

        // Login form
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password strength check
        this.registerPassword.addEventListener('input', () => {
            this.updatePasswordStrength();
        });

        // User dropdown
        this.userAvatar.addEventListener('click', () => {
            this.userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.userAvatar.contains(e.target) && !this.userDropdown.contains(e.target)) {
                this.userDropdown.classList.add('hidden');
            }
        });

        // Logout button
        this.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Admin panel button
        this.adminPanelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openAdminPanel();
        });

        // Project filter
        this.projectFilter.addEventListener('change', () => {
            this.renderProjects();
        });

        // Create project button
        this.createProjectBtn.addEventListener('click', () => {
            this.openProjectModal();
        });

        // Create task button
        this.createTaskBtn.addEventListener('click', () => {
            this.openTaskModal();
        });

        // Project form submission
        this.projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProjectFormSubmit();
        });

        // Task form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskFormSubmit();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.closeAllModals();
                }
            });
        });

        // Cancel buttons
        document.getElementById('cancel-project').addEventListener('click', () => {
            this.closeModal(this.projectModal);
        });

        document.getElementById('cancel-task').addEventListener('click', () => {
            this.closeModal(this.taskModal);
        });

        document.getElementById('cancel-response').addEventListener('click', () => {
            this.closeModal(this.taskResponseModal);
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Tab navigation in admin panel
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchAdminTab(tabName);
            });
        });
    }

    // Handle login form submission
    async handleLogin() {
        try {
            const email = this.loginEmail.value;
            const password = this.loginPassword.value;

            await this.auth.login(email, password);
            this.showToast('Login successful!', 'success');
            this.initializeApp();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // Handle register form submission
    async handleRegister() {
        try {
            const username = this.registerUsername.value;
            const email = this.registerEmail.value;
            const password = this.registerPassword.value;

            await this.auth.register(username, email, password);
            this.showToast('Registration successful! Please log in.', 'success');

            // Reset and switch to login form
            this.registerForm.reset();
            this.registerPage.classList.add('hidden');
            this.loginPage.classList.remove('hidden');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // Handle logout
    handleLogout() {
        this.auth.logout();
        this.showAuthUI();
        this.showToast('You have been logged out.', 'info');
    }

    // Update password strength indicator
    updatePasswordStrength() {
        const password = this.registerPassword.value;
        const { score, message } = this.auth.checkPasswordStrength(password);

        this.strengthBar.style.width = `${score}%`;
        this.strengthText.textContent = message;

        // Update color based on strength
        if (score < 33) {
            this.strengthBar.style.backgroundColor = '#ff4757';
        } else if (score < 66) {
            this.strengthBar.style.backgroundColor = '#ffa502';
        } else {
            this.strengthBar.style.backgroundColor = '#2ed573';
        }
    }

    // Initialize app after successful authentication
    initializeApp() {
        this.showAppUI();
        this.updateUserInfo();
        this.renderProjects();

        // Toggle admin-only elements
        this.toggleAdminElements();
    }

    // Update user information in the UI
    updateUserInfo() {
        const { username, role } = this.auth.currentUser;

        this.userName.textContent = username;
        this.userRole.textContent = role === 'admin' ? 'Administrator' : 'User';

        // Set user initials for avatar
        const initials = username.charAt(0).toUpperCase();
        this.userInitials.textContent = initials;
    }

    // Show/hide elements based on user role
    toggleAdminElements() {
        const isAdmin = this.auth.isAdmin();
        const adminElements = document.querySelectorAll('.admin-only');

        adminElements.forEach(element => {
            if (isAdmin) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    }

    // Render projects based on current filter
    renderProjects() {
        const filter = this.projectFilter.value;
        const projects = this.projectManager.getProjects(filter);

        this.projectsContainer.innerHTML = '';

        if (projects.length === 0) {
            this.projectsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No projects found</h3>
                    <p>Get started by creating a new project</p>
                    ${this.auth.isAdmin() ? 
                        `<button class="btn btn--primary" id="empty-create-project">
                            <span>+</span> Create Project
                        </button>` : ''}
                </div>
            `;

            const createBtn = document.getElementById('empty-create-project');
            if (createBtn) {
                createBtn.addEventListener('click', () => this.openProjectModal());
            }

            return;
        }

        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            this.projectsContainer.appendChild(projectElement);
        });
    }

    // Create a project card element
    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project-card';

        // Get task statistics
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Create task items HTML
        const tasksHtml = project.tasks.map(task => {
            let statusClass = '';
            switch (task.status) {
                case 'Completed':
                    statusClass = 'status-completed';
                    break;
                case 'In Progress':
                    statusClass = 'status-in-progress';
                    break;
                default:
                    statusClass = 'status-pending';
            }

            return `
                <div class="task-item">
                    <div class="task-header">
                        <h5 class="task-name">${task.name}</h5>
                        <div class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</div>
                    </div>
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <div class="task-meta-label">Status</div>
                            <span class="status-badge ${statusClass}">${task.status}</span>
                        </div>
                        <div class="task-meta-item">
                            <div class="task-meta-label">Due Date</div>
                            <div>${this.projectManager.formatDate(task.dueDate)}</div>
                        </div>
                        <div class="task-meta-item">
                            <div class="task-meta-label">Assigned To</div>
                            <div>${task.assignee}</div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn--sm btn--secondary" data-action="view" data-project-id="${project.id}" data-task-id="${task.id}">View</button>
                        <button class="btn btn--sm btn--primary" data-action="respond" data-project-id="${project.id}" data-task-id="${task.id}">Respond</button>
                    </div>
                </div>
            `;
        }).join('');

        // Create project card HTML
        div.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.name}</h3>
                <div class="project-actions">
                    ${this.auth.isAdmin() || project.createdBy === this.auth.currentUser.username ? `
                        <button class="btn-icon" data-action="edit-project" data-project-id="${project.id}">
                            <span>✏️</span>
                        </button>
                        <button class="btn-icon" data-action="delete-project" data-project-id="${project.id}">
                            <span>🗑️</span>
                        </button>
                    ` : ''}
                    <button class="btn-icon" data-action="add-task" data-project-id="${project.id}">
                        <span>+</span>
                    </button>
                </div>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-meta">
                <div class="project-progress">
                    <div class="progress-label">Progress: ${progressPercent}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="project-info">
                    <div class="info-item">
                        <span class="info-label">Created by:</span>
                        <span class="info-value">${project.createdBy}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Team:</span>
                        <span class="info-value">${project.assignedUsers.join(', ')}</span>
                    </div>
                </div>
            </div>
            <div class="tasks-list">
                ${tasksHtml}
            </div>
        `;

        // Add event listeners to buttons
        div.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const projectId = parseInt(target.dataset.projectId);
            const taskId = target.dataset.taskId ? parseInt(target.dataset.taskId) : null;

            switch (action) {
                case 'view':
                    this.viewTask(projectId, taskId);
                    break;
                case 'respond':
                    this.respondToTask(projectId, taskId);
                    break;
                case 'edit-project':
                    this.editProject(projectId);
                    break;
                case 'delete-project':
                    this.confirmDeleteProject(projectId);
                    break;
                case 'add-task':
                    this.openTaskModal(projectId);
                    break;
            }
        });

        return div;
    }

    // Open project creation/editing modal
    openProjectModal(projectId = null) {
        const title = document.getElementById('project-modal-title');

        if (projectId) {
            // Edit mode
            const project = this.projectManager.projects.find(p => p.id === projectId);
            if (!project) return;

            title.textContent = 'Edit Project';
            this.projectName.value = project.name;
            this.projectDescription.value = project.description;
            this.currentEditingProject = projectId;
        } else {
            // Create mode
            title.textContent = 'Create New Project';
            this.projectForm.reset();
            this.currentEditingProject = null;
        }

        // Populate user checkboxes
        this.populateUserCheckboxes(projectId);

        this.showModal(this.projectModal);
    }

    // Populate user checkboxes for project assignment
    populateUserCheckboxes(projectId = null) {
        const users = this.auth.getAllUsers();
        const project = projectId ? 
            this.projectManager.projects.find(p => p.id === projectId) : null;

        this.projectUsers.innerHTML = '';

        users.forEach(user => {
            const isChecked = project ? 
                project.assignedUsers.includes(user.username) : 
                user.username === this.auth.currentUser.username;

            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="user-${user.id}" name="assigned-users" 
                    value="${user.username}" ${isChecked ? 'checked' : ''}>
                <label for="user-${user.id}">${user.username} (${user.role})</label>
            `;

            this.projectUsers.appendChild(checkbox);
        });
    }

    // Open task creation/editing modal
    openTaskModal(projectId = null, taskId = null) {
        const title = document.getElementById('task-modal-title');

        // Populate project dropdown
        this.populateProjectDropdown();

        // Populate user dropdown
        this.populateUserDropdown();

        if (taskId) {
            // Edit mode
            const project = this.projectManager.projects.find(p => p.id === projectId);
            if (!project) return;

            const task = project.tasks.find(t => t.id === taskId);
            if (!task) return;

            title.textContent = 'Edit Task';
            this.taskName.value = task.name;
            this.taskDescription.value = task.description;
            this.taskProject.value = task.projectId;
            this.taskAssignee.value = task.assignee;
            this.taskDueDate.value = task.dueDate;
            this.taskPriority.value = task.priority;

            this.currentEditingTask = {
                projectId,
                taskId
            };
        } else {
            // Create mode
            title.textContent = 'Create New Task';
            this.taskForm.reset();

            // Set today as the default due date
            const today = new Date().toISOString().split('T')[0];
            this.taskDueDate.value = today;

            // Pre-select the project if provided
            if (projectId) {
                this.taskProject.value = projectId;
            }

            // Pre-select the current user as assignee
            this.taskAssignee.value = this.auth.currentUser.username;

            this.currentEditingTask = null;
        }

        this.showModal(this.taskModal);
    }

    // Populate project dropdown for task form
    populateProjectDropdown() {
        // Get projects the user has access to
        const projects = this.auth.isAdmin() ? 
            this.projectManager.projects : 
            this.projectManager.projects.filter(p => 
                p.assignedUsers.includes(this.auth.currentUser.username)
            );

        this.taskProject.innerHTML = '';

        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            this.taskProject.appendChild(option);
        });
    }

    // Populate user dropdown for task assignment
    populateUserDropdown() {
        const users = this.auth.getAllUsers();

        this.taskAssignee.innerHTML = '';

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.username;
            this.taskAssignee.appendChild(option);
        });
    }

    // Handle project form submission
    handleProjectFormSubmit() {
        try {
            // Get selected users
            const assignedUsers = Array.from(
                document.querySelectorAll('input[name="assigned-users"]:checked')
            ).map(input => input.value);

            const projectData = {
                name: this.projectName.value,
                description: this.projectDescription.value,
                assignedUsers
            };

            if (this.currentEditingProject) {
                // Update existing project
                this.projectManager.updateProject(this.currentEditingProject, projectData);
                this.showToast('Project updated successfully!', 'success');
            } else {
                // Create new project
                this.projectManager.createProject(projectData);
                this.showToast('Project created successfully!', 'success');
            }

            this.closeModal(this.projectModal);
            this.renderProjects();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // Handle task form submission
    handleTaskFormSubmit() {
        try {
            const taskData = {
                name: this.taskName.value,
                description: this.taskDescription.value,
                projectId: parseInt(this.taskProject.value),
                assignee: this.taskAssignee.value,
                dueDate: this.taskDueDate.value,
                priority: this.taskPriority.value
            };

            if (this.currentEditingTask) {
                // Update existing task
                const { projectId, taskId } = this.currentEditingTask;
                this.projectManager.updateTask(projectId, taskId, taskData);
                this.showToast('Task updated successfully!', 'success');
            } else {
                // Create new task
                this.projectManager.createTask(taskData);
                this.showToast('Task created successfully!', 'success');
            }

            this.closeModal(this.taskModal);
            this.renderProjects();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // View task details
    viewTask(projectId, taskId) {
        const project = this.projectManager.projects.find(p => p.id === projectId);
        if (!project) return;

        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Set current viewing task
        this.projectManager.currentViewingTask = { projectId, taskId };

        // Populate modal
        document.getElementById('view-task-name').textContent = task.name;
        document.getElementById('view-task-description').textContent = task.description;

        // Set status with appropriate class
        const statusElement = document.getElementById('view-task-status');
        statusElement.textContent = task.status;
        statusElement.className = 'status-badge';

        switch (task.status) {
            case 'Completed':
                statusElement.classList.add('status-completed');
                break;
            case 'In Progress':
                statusElement.classList.add('status-in-progress');
                break;
            default:
                statusElement.classList.add('status-pending');
        }

        document.getElementById('view-task-due-date').textContent = 
            this.projectManager.formatDate(task.dueDate);
        document.getElementById('view-task-assigned').textContent = task.assignee;

        // Populate notes
        const notesContainer = document.getElementById('view-task-notes');

        if (task.notes && task.notes.length > 0) {
            notesContainer.innerHTML = task.notes.map(note => `
                <div class="note-item">
                    <div class="note-meta">
                        ${this.projectManager.formatDate(note.date)} - ${note.author}
                    </div>
                    <div class="note-content">${note.content}</div>
                </div>
            `).join('');
        } else {
            notesContainer.innerHTML = '<div class="no-notes">No notes available</div>';
        }

        this.showModal(this.taskViewModal);
    }

    // Respond to task
    respondToTask(projectId, taskId) {
        const project = this.projectManager.projects.find(p => p.id === projectId);
        if (!project) return;

        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Set current responding task
        this.projectManager.currentRespondingTask = { projectId, taskId };

        // Populate modal
        document.getElementById('response-task-name').textContent = `Respond to: ${task.name}`;

        // Clear previous response and hide analysis
        const responseTextarea = document.getElementById('task-response');
        responseTextarea.value = '';
        document.getElementById('analysis-result').classList.add('hidden');

        // Set up submit response handler
        document.getElementById('submit-response').onclick = () => this.submitTaskResponse();

        this.showModal(this.taskResponseModal);
    }

    // Submit task response
    submitTaskResponse() {
        const responseTextarea = document.getElementById('task-response');
        const response = responseTextarea.value.trim();

        if (!response) {
            this.showToast('Please enter a response before submitting.', 'error');
            return;
        }

        try {
            const { projectId, taskId } = this.projectManager.currentRespondingTask;

            // Add note to task
            const result = this.projectManager.addTaskNote(projectId, taskId, response);

            // Show analysis result
            document.getElementById('analysis-text').textContent = result.analysis.message;
            document.getElementById('analysis-result').classList.remove('hidden');

            // Clear the textarea
            responseTextarea.value = '';

            // Update UI after a short delay
            setTimeout(() => {
                this.closeModal(this.taskResponseModal);
                this.renderProjects();
            }, 2000);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // Edit project
    editProject(projectId) {
        this.openProjectModal(projectId);
    }

    // Confirm project deletion
    confirmDeleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? All tasks will be permanently deleted.')) {
            try {
                this.projectManager.deleteProject(projectId);
                this.showToast('Project deleted successfully!', 'success');
                this.renderProjects();
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        }
    }

    // Open admin panel
    openAdminPanel() {
        if (!this.auth.isAdmin()) {
            this.showToast('You do not have permission to access the admin panel.', 'error');
            return;
        }

        // Populate admin panel data
        this.populateAdminUsers();
        this.populateAdminProjects();
        this.populateAdminAnalytics();

        this.showModal(this.adminModal);
    }

    // Populate admin panel users tab
    populateAdminUsers() {
        const users = this.auth.getAllUsers();
        const usersContainer = document.querySelector('.users-list');

        usersContainer.innerHTML = `
            <div class="admin-table">
                <div class="table-header">
                    <div class="header-cell">Username</div>
                    <div class="header-cell">Email</div>
                    <div class="header-cell">Role</div>
                    <div class="header-cell">Created At</div>
                    <div class="header-cell">Actions</div>
                </div>
                <div class="table-body">
                    ${users.map(user => `
                        <div class="table-row">
                            <div class="table-cell">${user.username}</div>
                            <div class="table-cell">${user.email}</div>
                            <div class="table-cell">${user.role}</div>
                            <div class="table-cell">${this.projectManager.formatDate(user.createdAt)}</div>
                            <div class="table-cell">
                                ${user.username !== this.auth.currentUser.username ? `
                                    <button class="btn btn--sm btn--${user.role === 'admin' ? 'secondary' : 'primary'}" 
                                        data-action="toggle-role" data-user-id="${user.id}" data-current-role="${user.role}">
                                        ${user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                    </button>
                                ` : '<em>Current User</em>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners to role toggle buttons
        usersContainer.querySelectorAll('[data-action="toggle-role"]').forEach(button => {
            button.addEventListener('click', () => {
                const userId = parseInt(button.dataset.userId);
                const currentRole = button.dataset.currentRole;
                const newRole = currentRole === 'admin' ? 'user' : 'admin';

                try {
                    this.auth.updateUserRole(userId, newRole);
                    this.showToast(`User role updated to ${newRole}!`, 'success');
                    this.populateAdminUsers(); // Refresh user list
                } catch (error) {
                    this.showToast(error.message, 'error');
                }
            });
        });
    }

    // Populate admin panel projects tab
    populateAdminProjects() {
        const projects = this.projectManager.projects;
        const projectsContainer = document.querySelector('.projects-list');

        projectsContainer.innerHTML = `
            <div class="admin-table">
                <div class="table-header">
                    <div class="header-cell">Name</div>
                    <div class="header-cell">Created By</div>
                    <div class="header-cell">Users</div>
                    <div class="header-cell">Tasks</div>
                    <div class="header-cell">Actions</div>
                </div>
                <div class="table-body">
                    ${projects.map(project => {
                        const totalTasks = project.tasks.length;
                        const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;

                        return `
                            <div class="table-row">
                                <div class="table-cell">${project.name}</div>
                                <div class="table-cell">${project.createdBy}</div>
                                <div class="table-cell">${project.assignedUsers.join(', ')}</div>
                                <div class="table-cell">${completedTasks}/${totalTasks} completed</div>
                                <div class="table-cell">
                                    <button class="btn btn--sm btn--secondary" 
                                        data-action="admin-edit-project" data-project-id="${project.id}">
                                        Edit
                                    </button>
                                    <button class="btn btn--sm btn--danger" 
                                        data-action="admin-delete-project" data-project-id="${project.id}">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Add event listeners to buttons
        projectsContainer.querySelectorAll('[data-action="admin-edit-project"]').forEach(button => {
            button.addEventListener('click', () => {
                const projectId = parseInt(button.dataset.projectId);
                this.closeModal(this.adminModal);
                this.openProjectModal(projectId);
            });
        });

        projectsContainer.querySelectorAll('[data-action="admin-delete-project"]').forEach(button => {
            button.addEventListener('click', () => {
                const projectId = parseInt(button.dataset.projectId);
                if (confirm('Are you sure you want to delete this project? All tasks will be permanently deleted.')) {
                    try {
                        this.projectManager.deleteProject(projectId);
                        this.showToast('Project deleted successfully!', 'success');
                        this.populateAdminProjects(); // Refresh project list
                        this.renderProjects(); // Update main UI
                    } catch (error) {
                        this.showToast(error.message, 'error');
                    }
                }
            });
        });
    }

    // Populate admin panel analytics tab
    populateAdminAnalytics() {
        const analyticsContainer = document.querySelector('.analytics-dashboard');

        // Get statistics
        const projectCount = this.projectManager.projects.length;
        const userCount = this.auth.getAllUsers().length;

        let totalTasks = 0;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let pendingTasks = 0;

        this.projectManager.projects.forEach(project => {
            totalTasks += project.tasks.length;
            completedTasks += project.tasks.filter(t => t.status === 'Completed').length;
            inProgressTasks += project.tasks.filter(t => t.status === 'In Progress').length;
            pendingTasks += project.tasks.filter(t => t.status === 'Pending').length;
        });

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-title">Projects</div>
                    <div class="analytics-value">${projectCount}</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-title">Users</div>
                    <div class="analytics-value">${userCount}</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-title">Total Tasks</div>
                    <div class="analytics-value">${totalTasks}</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-title">Completion Rate</div>
                    <div class="analytics-value">${completionRate}%</div>
                </div>
            </div>

            <div class="analytics-row">
                <div class="analytics-chart">
                    <h4>Task Status Distribution</h4>
                    <div class="chart-container">
                        <div class="bar-chart">
                            <div class="chart-bar">
                                <div class="bar-label">Completed</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%; background-color: #2ed573;">
                                        ${completedTasks}
                                    </div>
                                </div>
                            </div>
                            <div class="chart-bar">
                                <div class="bar-label">In Progress</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%; background-color: #1e90ff;">
                                        ${inProgressTasks}
                                    </div>
                                </div>
                            </div>
                            <div class="chart-bar">
                                <div class="bar-label">Pending</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0}%; background-color: #ff6b81;">
                                        ${pendingTasks}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Switch tabs in admin panel
    switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    // Show authentication UI
    showAuthUI() {
        this.authSection.classList.remove('hidden');
        this.mainApp.classList.add('hidden');
        this.loginPage.classList.remove('hidden');
        this.registerPage.classList.add('hidden');
    }

    // Show main application UI
    showAppUI() {
        this.authSection.classList.add('hidden');
        this.mainApp.classList.remove('hidden');
    }

    // Show modal
    showModal(modal) {
        modal.classList.add('active');
    }

    // Close modal
    closeModal(modal) {
        modal.classList.remove('active');
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal);
        });
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add close button listener
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('toast--fade-out');
            setTimeout(() => {
                this.toastContainer.removeChild(toast);
            }, 300);
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast--fade-out');
                setTimeout(() => {
                    if (toast.parentElement) {
                        this.toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);

        this.toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);
    }
}

// ========== Application Initialization ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication system
    const auth = new AuthManager();

    // Initialize project management system
    const projectManager = new ProjectManager(auth);

    // Initialize UI
    const ui = new UIManager(auth, projectManager);

    // Check if user is already logged in
    if (auth.isAuthenticated()) {
        ui.initializeApp();
    } else {
        ui.showAuthUI();
    }

    // Expose instances for debugging
    window.app = {
        auth,
        projectManager,
        ui
    };
});
