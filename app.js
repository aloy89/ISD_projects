// Project Management Application
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentEditingProject = null;
        this.currentEditingTask = null;
        this.currentViewingTask = null;
        this.currentRespondingTask = null;
        this.nextProjectId = 1;
        this.nextTaskId = 1;
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.render();
    }

    // Load initial data
    loadData() {
        const savedData = localStorage.getItem('projectManagerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.projects = data.projects || [];
            this.nextProjectId = data.nextProjectId || 1;
            this.nextTaskId = data.nextTaskId || 1;
        } else {
            // Load sample data
            this.loadSampleData();
        }
    }

    loadSampleData() {
        const sampleData = {
            "projects": [
                {
                    "id": 1,
                    "name": "TIE Project",
                    "description": "Teaching Innovation and Enhancement Project",
                    "startDate": "2025-01-15",
                    "endDate": "2025-06-30",
                    "status": "Active",
                    "progress": 45,
                    "tasks": [
                        {
                            "id": 1,
                            "name": "Student Enrollment",
                            "description": "Manage student enrollment process and requirements",
                            "status": "In Progress",
                            "dueDate": "2025-02-15",
                            "assignedPerson": "Aloysius",
                            "priority": "High",
                            "notes": [
                                {
                                    "timestamp": "2025-01-20T10:00:00Z",
                                    "author": "Aloysius",
                                    "content": "Started enrollment process, need to finalize requirements"
                                }
                            ]
                        },
                        {
                            "id": 2,
                            "name": "WeChat Group Creation",
                            "description": "Set up communication channels for students",
                            "status": "Completed",
                            "dueDate": "2025-01-25",
                            "assignedPerson": "Jac",
                            "priority": "Medium",
                            "notes": [
                                {
                                    "timestamp": "2025-01-22T14:30:00Z",
                                    "author": "Jac",
                                    "content": "WeChat group created and students added"
                                }
                            ]
                        },
                        {
                            "id": 3,
                            "name": "Student Engagement Initiatives",
                            "description": "Develop activities to increase student participation",
                            "status": "Pending",
                            "dueDate": "2025-03-01",
                            "assignedPerson": "Rob",
                            "priority": "Medium",
                            "notes": []
                        },
                        {
                            "id": 4,
                            "name": "Course Work Development",
                            "description": "Create curriculum and learning materials",
                            "status": "In Progress",
                            "dueDate": "2025-04-15",
                            "assignedPerson": "Qijia",
                            "priority": "High",
                            "notes": [
                                {
                                    "timestamp": "2025-01-25T09:15:00Z",
                                    "author": "Qijia",
                                    "content": "Working on module 1 content"
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        this.projects = sampleData.projects;
        this.nextProjectId = 2;
        this.nextTaskId = 5;
        this.saveData();
    }

    // Save data to localStorage
    saveData() {
        const data = {
            projects: this.projects,
            nextProjectId: this.nextProjectId,
            nextTaskId: this.nextTaskId
        };
        localStorage.setItem('projectManagerData', JSON.stringify(data));
    }

    // Bind event listeners
    bindEvents() {
        // Project modal events
        document.getElementById('new-project-btn').addEventListener('click', () => this.openProjectModal());
        document.getElementById('project-form').addEventListener('submit', (e) => this.handleProjectSubmit(e));

        // Task modal events
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Modal close events
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Progress slider
        document.getElementById('project-progress').addEventListener('input', (e) => {
            document.getElementById('progress-value').textContent = e.target.value + '%';
        });

        // Export/Import
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.openImportModal());
        document.getElementById('confirm-import').addEventListener('click', () => this.importData());

        // Task response
        document.getElementById('submit-response').addEventListener('click', () => this.submitTaskResponse());

        // Overlay click to close modals
        document.getElementById('modal-overlay').addEventListener('click', () => this.closeModals());
    }

    // Render the entire application
    render() {
        this.renderProjects();
    }

    // Render projects
    renderProjects() {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        this.projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    // Create project element
    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = `project-card status-${project.status.toLowerCase().replace(' ', '-')}`;
        
        const tasksHtml = project.tasks.map(task => `
            <div class="task-item">
                <div class="task-header">
                    <h5 class="task-name">${task.name}</h5>
                </div>
                <div class="task-meta">
                    <div>
                        <span class="task-status ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                    </div>
                    <div>Due: ${this.formatDate(task.dueDate)}</div>
                    <div>Assigned: ${task.assignedPerson}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn--sm btn--secondary" data-action="view" data-project-id="${project.id}" data-task-id="${task.id}">View</button>
                    <button class="btn btn--sm btn--primary" data-action="respond" data-project-id="${project.id}" data-task-id="${task.id}">Respond</button>
                </div>
            </div>
        `).join('');

        div.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description}</p>
            </div>
            <div class="project-meta">
                <div class="meta-item">
                    <div class="meta-label">Status</div>
                    <div>${project.status}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Progress</div>
                    <div>${project.progress}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Start Date</div>
                    <div>${this.formatDate(project.startDate)}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">End Date</div>
                    <div>${this.formatDate(project.endDate)}</div>
                </div>
            </div>
            <div class="tasks-section">
                <div class="tasks-header">
                    <h4>Tasks (${project.tasks.length})</h4>
                    <button class="btn btn--sm btn--secondary" data-action="add-task" data-project-id="${project.id}">Add Task</button>
                </div>
                <div class="tasks-list">
                    ${tasksHtml}
                </div>
            </div>
        `;

        // Add event listeners to buttons
        div.addEventListener('click', (e) => {
            if (e.target.matches('button[data-action]')) {
                const action = e.target.dataset.action;
                const projectId = parseInt(e.target.dataset.projectId);
                const taskId = parseInt(e.target.dataset.taskId);

                switch (action) {
                    case 'view':
                        this.viewTask(projectId, taskId);
                        break;
                    case 'respond':
                        this.respondToTask(projectId, taskId);
                        break;
                    case 'add-task':
                        this.openTaskModal(projectId);
                        break;
                }
            }
        });

        return div;
    }

    // Format date for display
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    // Open project modal
    openProjectModal(projectId = null) {
        this.currentEditingProject = projectId;
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const title = document.getElementById('project-modal-title');

        if (projectId) {
            const project = this.projects.find(p => p.id === projectId);
            title.textContent = 'Edit Project';
            this.populateProjectForm(project);
        } else {
            title.textContent = 'Create New Project';
            form.reset();
            document.getElementById('progress-value').textContent = '0%';
        }

        this.showModal(modal);
    }

    // Populate project form
    populateProjectForm(project) {
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-start-date').value = project.startDate;
        document.getElementById('project-end-date').value = project.endDate;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-progress').value = project.progress;
        document.getElementById('progress-value').textContent = project.progress + '%';
    }

    // Handle project form submission
    handleProjectSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            startDate: document.getElementById('project-start-date').value,
            endDate: document.getElementById('project-end-date').value,
            status: document.getElementById('project-status').value,
            progress: parseInt(document.getElementById('project-progress').value)
        };

        if (this.currentEditingProject) {
            this.updateProject(this.currentEditingProject, formData);
        } else {
            this.createProject(formData);
        }

        this.closeModals();
        this.render();
    }

    // Create new project
    createProject(data) {
        const project = {
            id: this.nextProjectId++,
            ...data,
            tasks: []
        };
        this.projects.push(project);
        this.saveData();
    }

    // Update existing project
    updateProject(id, data) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            Object.assign(project, data);
            this.saveData();
        }
    }

    // Open task modal
    openTaskModal(projectId, taskId = null) {
        this.currentEditingTask = taskId;
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = document.getElementById('task-modal-title');

        document.getElementById('task-project-id').value = projectId;

        if (taskId) {
            const project = this.projects.find(p => p.id === projectId);
            const task = project.tasks.find(t => t.id === taskId);
            title.textContent = 'Edit Task';
            this.populateTaskForm(task);
        } else {
            title.textContent = 'Create New Task';
            form.reset();
            document.getElementById('task-project-id').value = projectId;
        }

        this.showModal(modal);
    }

    // Populate task form
    populateTaskForm(task) {
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-due-date').value = task.dueDate;
        document.getElementById('task-assigned').value = task.assignedPerson;
    }

    // Handle task form submission
    handleTaskSubmit(e) {
        e.preventDefault();
        
        const projectId = parseInt(document.getElementById('task-project-id').value);
        const formData = {
            name: document.getElementById('task-name').value,
            description: document.getElementById('task-description').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            assignedPerson: document.getElementById('task-assigned').value
        };

        if (this.currentEditingTask) {
            this.updateTask(projectId, this.currentEditingTask, formData);
        } else {
            this.createTask(projectId, formData);
        }

        this.closeModals();
        this.render();
    }

    // Create new task
    createTask(projectId, data) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            const task = {
                id: this.nextTaskId++,
                ...data,
                notes: []
            };
            project.tasks.push(task);
            this.saveData();
        }
    }

    // Update existing task
    updateTask(projectId, taskId, data) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            const task = project.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, data);
                this.saveData();
            }
        }
    }

    // View task details
    viewTask(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.currentViewingTask = { projectId, taskId };
            
            // Populate view modal
            document.getElementById('view-task-name').textContent = task.name;
            document.getElementById('view-task-description').textContent = task.description;
            document.getElementById('view-task-status').textContent = task.status;
            document.getElementById('view-task-status').className = `status task-status ${task.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('view-task-priority').textContent = task.priority;
            document.getElementById('view-task-priority').className = `priority-badge ${task.priority.toLowerCase()}`;
            document.getElementById('view-task-due-date').textContent = this.formatDate(task.dueDate);
            document.getElementById('view-task-assigned').textContent = task.assignedPerson;
            
            // Populate notes
            const notesContainer = document.getElementById('view-task-notes');
            if (task.notes && task.notes.length > 0) {
                notesContainer.innerHTML = task.notes.map(note => `
                    <div class="note-item">
                        <div class="note-meta">${new Date(note.timestamp).toLocaleString()} - ${note.author}</div>
                        <div class="note-content">${note.content}</div>
                    </div>
                `).join('');
            } else {
                notesContainer.innerHTML = '<div class="no-notes">No notes available</div>';
            }
            
            this.showModal(document.getElementById('task-view-modal'));
        }
    }

    // Respond to task
    respondToTask(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.currentRespondingTask = { projectId, taskId };
            document.getElementById('response-task-name').textContent = `Respond to: ${task.name}`;
            document.getElementById('task-response').value = '';
            document.getElementById('analysis-result').classList.add('hidden');
            
            this.showModal(document.getElementById('task-response-modal'));
        }
    }

    // Submit task response
    submitTaskResponse() {
        const response = document.getElementById('task-response').value.trim();
        if (!response) return;

        const { projectId, taskId } = this.currentRespondingTask;
        const project = this.projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);

        if (task) {
            // Analyze response
            const analysis = this.analyzeResponse(response);
            
            // Update task status if needed
            if (analysis.newStatus) {
                task.status = analysis.newStatus;
            }

            // Add response as note
            const note = {
                timestamp: new Date().toISOString(),
                author: 'User',
                content: response
            };
            task.notes.push(note);

            // Show analysis result
            document.getElementById('analysis-text').textContent = analysis.message;
            document.getElementById('analysis-result').classList.remove('hidden');

            // Save and update UI
            this.saveData();
            
            // Close modal after 2 seconds
            setTimeout(() => {
                this.closeModals();
                this.render();
            }, 2000);
        }
    }

    // Analyze response text for keywords
    analyzeResponse(text) {
        const lowerText = text.toLowerCase();
        
        // Completion keywords
        const completionKeywords = ['done', 'finished', 'completed', 'ready', 'delivered', 'sent', 'submitted'];
        const progressKeywords = ['working on', 'in progress', 'almost done', 'need more time', 'blocked', 'waiting'];
        const needsKeywords = ['need to', 'should add', 'also need', 'next we need', 'still need', 'requires', 'must also'];
        
        if (completionKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: 'Completed',
                message: 'Task status updated to Completed based on your response.'
            };
        } else if (progressKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: 'In Progress',
                message: 'Task status updated to In Progress based on your response.'
            };
        } else if (needsKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                newStatus: null,
                message: 'Response suggests additional work needed. Consider creating new tasks.'
            };
        } else {
            return {
                newStatus: null,
                message: 'Response recorded. No automatic status change detected.'
            };
        }
    }

    // Export data
    exportData() {
        const data = {
            projects: this.projects,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `project-manager-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Open import modal
    openImportModal() {
        document.getElementById('import-data').value = '';
        this.showModal(document.getElementById('import-modal'));
    }

    // Import data
    importData() {
        try {
            const importText = document.getElementById('import-data').value.trim();
            if (!importText) return;

            const data = JSON.parse(importText);
            
            if (data.projects && Array.isArray(data.projects)) {
                this.projects = data.projects;
                
                // Update ID counters
                let maxProjectId = 0;
                let maxTaskId = 0;
                
                this.projects.forEach(project => {
                    if (project.id > maxProjectId) maxProjectId = project.id;
                    project.tasks.forEach(task => {
                        if (task.id > maxTaskId) maxTaskId = task.id;
                    });
                });
                
                this.nextProjectId = maxProjectId + 1;
                this.nextTaskId = maxTaskId + 1;
                
                this.saveData();
                this.render();
                this.closeModals();
                
                alert('Data imported successfully!');
            } else {
                alert('Invalid data format. Please check your JSON structure.');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    }

    // Show modal
    showModal(modal) {
        document.getElementById('modal-overlay').classList.add('active');
        modal.classList.add('active');
    }

    // Close all modals
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modal-overlay').classList.remove('active');
        
        // Reset current editing states
        this.currentEditingProject = null;
        this.currentEditingTask = null;
        this.currentViewingTask = null;
        this.currentRespondingTask = null;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ProjectManager();
});