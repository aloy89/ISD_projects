// Project Management Application
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentViewingTask = null;
        this.currentRespondingTask = null;
        this.init();
    }

    init() {
        this.loadSampleData();
        this.bindEvents();
        this.render();
    }

    // Load sample data based on the provided JSON
    loadSampleData() {
        this.projects = [
            {
                "id": 1,
                "name": "TIE",
                "description": "Teaching Innovation and Excellence Project",
                "tasks": [
                    {
                        "id": 1,
                        "name": "Student Enrollment",
                        "description": "Complete student enrollment process for the new semester",
                        "status": "In Progress",
                        "dueDate": "2025-06-15",
                        "assignee": "Aloysius",
                        "notes": [
                            {
                                "date": "2025-05-25",
                                "content": "Started contacting prospective students",
                                "author": "Aloysius"
                            }
                        ]
                    },
                    {
                        "id": 2,
                        "name": "WeChat Group Creation",
                        "description": "Create WeChat groups for new student cohorts",
                        "status": "Completed",
                        "dueDate": "2025-06-01",
                        "assignee": "Jac",
                        "notes": [
                            {
                                "date": "2025-05-20",
                                "content": "Created 3 WeChat groups for different sections",
                                "author": "Jac"
                            },
                            {
                                "date": "2025-05-28",
                                "content": "Added all student contacts to the groups",
                                "author": "Jac"
                            }
                        ]
                    },
                    {
                        "id": 3,
                        "name": "Student Engagement Initiatives",
                        "description": "Design new engagement activities for the upcoming term",
                        "status": "Pending",
                        "dueDate": "2025-06-20",
                        "assignee": "Rob",
                        "notes": []
                    },
                    {
                        "id": 4,
                        "name": "Course Work Development",
                        "description": "Develop course materials and assignments",
                        "status": "In Progress",
                        "dueDate": "2025-06-25",
                        "assignee": "Qijia",
                        "notes": [
                            {
                                "date": "2025-05-30",
                                "content": "Started developing syllabus for the course",
                                "author": "Qijia"
                            }
                        ]
                    }
                ]
            }
        ];
    }

    // Bind event listeners
    bindEvents() {
        // Modal close events
        document.getElementById('close-view-modal').addEventListener('click', () => this.closeModal('task-view-modal'));
        document.getElementById('close-response-modal').addEventListener('click', () => this.closeModal('task-response-modal'));
        document.getElementById('cancel-response').addEventListener('click', () => this.closeModal('task-response-modal'));

        // Task response submission
        document.getElementById('submit-response').addEventListener('click', () => this.submitTaskResponse());

        // Close modals when clicking overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAllModals();
                }
            });
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
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
        div.className = 'project-card';
        
        const tasksHtml = project.tasks.map(task => `
            <div class="task-item">
                <div class="task-header">
                    <h5 class="task-name">${task.name}</h5>
                </div>
                <div class="task-meta">
                    <div class="task-meta-item">
                        <div class="task-meta-label">Status</div>
                        <span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                    </div>
                    <div class="task-meta-item">
                        <div class="task-meta-label">Due Date</div>
                        <div>${this.formatDate(task.dueDate)}</div>
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
        `).join('');

        div.innerHTML = `
            <h3 class="project-title">${project.name}</h3>
            <p class="project-description">${project.description}</p>
            <div class="tasks-list">
                ${tasksHtml}
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
                }
            }
        });

        return div;
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
            document.getElementById('view-task-status').className = `status-badge status-${task.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('view-task-due-date').textContent = this.formatDate(task.dueDate);
            document.getElementById('view-task-assigned').textContent = task.assignee;
            
            // Populate notes
            const notesContainer = document.getElementById('view-task-notes');
            if (task.notes && task.notes.length > 0) {
                notesContainer.innerHTML = task.notes.map(note => `
                    <div class="note-item">
                        <div class="note-meta">${this.formatDate(note.date)} - ${note.author}</div>
                        <div class="note-content">${note.content}</div>
                    </div>
                `).join('');
            } else {
                notesContainer.innerHTML = '<div class="no-notes">No notes available</div>';
            }
            
            this.showModal('task-view-modal');
        }
    }

    // Respond to task
    respondToTask(projectId, taskId) {
        const project = this.projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.currentRespondingTask = { projectId, taskId };
            document.getElementById('response-task-name').textContent = `Respond to: ${task.name}`;
            
            // Clear previous response and hide analysis
            const responseTextarea = document.getElementById('task-response');
            responseTextarea.value = '';
            document.getElementById('analysis-result').classList.add('hidden');
            
            this.showModal('task-response-modal');
        }
    }

    // Submit task response
    submitTaskResponse() {
        const responseTextarea = document.getElementById('task-response');
        const response = responseTextarea.value.trim();
        
        if (!response) {
            alert('Please enter a response before submitting.');
            return;
        }

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
                date: new Date().toISOString().split('T')[0],
                author: 'User',
                content: response
            };
            task.notes.push(note);

            // Show analysis result
            document.getElementById('analysis-text').textContent = analysis.message;
            document.getElementById('analysis-result').classList.remove('hidden');

            // Clear the textarea
            responseTextarea.value = '';

            // Update UI and close modal after showing analysis
            setTimeout(() => {
                this.closeModal('task-response-modal');
                this.render();
            }, 2000);
        }
    }

    // Analyze response text for keywords
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

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        
        // Focus on first input if available
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    // Close specific modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        
        // Reset current states
        if (modalId === 'task-view-modal') {
            this.currentViewingTask = null;
        } else if (modalId === 'task-response-modal') {
            this.currentRespondingTask = null;
            // Clear form when closing
            document.getElementById('task-response').value = '';
            document.getElementById('analysis-result').classList.add('hidden');
        }
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Reset current states
        this.currentViewingTask = null;
        this.currentRespondingTask = null;
        
        // Clear forms
        document.getElementById('task-response').value = '';
        document.getElementById('analysis-result').classList.add('hidden');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ProjectManager();
});