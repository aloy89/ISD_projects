// Project data
let projectData = {
  "projects": [
    {
      "id": "tie-project",
      "name": "TIE Project", 
      "description": "Technology in Education initiative",
      "status": "Active",
      "startDate": "2025-01-01",
      "endDate": "2025-06-30",
      "tasks": [
        {
          "id": "task-1",
          "title": "Student Enrollment",
          "description": "Set up student enrollment system", 
          "status": "In Progress",
          "priority": "High",
          "assignee": "Aloysius",
          "dueDate": "2025-06-15",
          "responses": [
            {
              "timestamp": "2025-06-01T10:00:00Z",
              "text": "Working on the database setup",
              "analysis": "further work required"
            }
          ]
        },
        {
          "id": "task-2",
          "title": "WeChat Group Creation", 
          "description": "Create communication channel",
          "status": "Completed",
          "priority": "Medium", 
          "assignee": "Jac",
          "dueDate": "2025-05-01",
          "responses": [
            {
              "timestamp": "2025-04-28T14:30:00Z",
              "text": "Group is created and all students have been added. Ready to use.",
              "analysis": "task completed"
            }
          ]
        },
        {
          "id": "task-3",
          "title": "Course Work Development",
          "description": "Develop curriculum materials",
          "status": "Pending",
          "priority": "High",
          "assignee": "Rob", 
          "dueDate": "2025-07-01",
          "responses": []
        },
        {
          "id": "task-4",
          "title": "Student Engagement Strategy",
          "description": "Plan student activities and engagement",
          "status": "In Progress",
          "priority": "Medium",
          "assignee": "Qijia",
          "dueDate": "2025-06-20", 
          "responses": [
            {
              "timestamp": "2025-06-02T09:15:00Z",
              "text": "Need to add weekly survey system and also need feedback collection mechanism",
              "analysis": "additional tasks needed"
            }
          ]
        }
      ]
    }
  ]
};

// Current state
let currentProject = projectData.projects[0];
let currentTaskId = null;

// DOM Elements
const themeSelect = document.getElementById('theme-select');
const tasksContainer = document.getElementById('tasks-container');
const responseModal = document.getElementById('response-modal');
const modalTaskTitle = document.getElementById('modal-task-title');
const responseText = document.getElementById('response-text');
const charCount = document.getElementById('char-count');
const analysisPreview = document.getElementById('analysis-preview');
const analysisResult = document.getElementById('analysis-result');
const closeModal = document.getElementById('close-modal');
const cancelResponse = document.getElementById('cancel-response');
const submitResponse = document.getElementById('submit-response');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadSavedData();
    renderDashboard();
    renderTasks();
    setupEventListeners();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('projectTheme') || 'minimalist';
    setTheme(savedTheme);
    themeSelect.value = savedTheme;
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('projectTheme', theme);
}

// Data Management
function loadSavedData() {
    const savedData = localStorage.getItem('projectData');
    if (savedData) {
        try {
            projectData = JSON.parse(savedData);
            currentProject = projectData.projects[0];
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

function saveData() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
}

// Response Analysis Logic
function analyzeResponse(text) {
    const lowerText = text.toLowerCase();
    
    // Keywords for different statuses
    const completionKeywords = ['done', 'finished', 'completed', 'complete', 'ready', 'delivered', 'sent', 'submitted'];
    const additionalTaskKeywords = ['need to', 'should add', 'also need', 'next we need', 'still need', 'requires', 'must also'];
    const workInProgressKeywords = ['working on', 'in progress', 'almost done', 'need more time', 'blocked', 'waiting', 'issue'];
    
    // Check for completion keywords
    if (completionKeywords.some(keyword => lowerText.includes(keyword))) {
        return {
            status: 'Completed',
            analysis: 'task completed',
            reason: 'Response indicates task completion'
        };
    }
    
    // Check for additional task keywords
    if (additionalTaskKeywords.some(keyword => lowerText.includes(keyword))) {
        return {
            status: null, // Keep current status
            analysis: 'additional tasks needed',
            reason: 'Response indicates additional tasks are required'
        };
    }
    
    // Check for work in progress keywords
    if (workInProgressKeywords.some(keyword => lowerText.includes(keyword))) {
        return {
            status: 'In Progress',
            analysis: 'further work required',
            reason: 'Response indicates ongoing work'
        };
    }
    
    // Default case
    return {
        status: 'Needs Review',
        analysis: 'needs review',
        reason: 'Response requires manual review'
    };
}

// Task Management
function getTask(taskId) {
    return currentProject.tasks.find(task => task.id === taskId);
}

function updateTaskResponse(taskId, responseText) {
    const task = getTask(taskId);
    if (!task) return;
    
    const analysis = analyzeResponse(responseText);
    const response = {
        timestamp: new Date().toISOString(),
        text: responseText,
        analysis: analysis.analysis
    };
    
    task.responses.push(response);
    
    // Update task status if analysis suggests a change
    if (analysis.status) {
        task.status = analysis.status;
    }
    
    saveData();
    renderDashboard();
    renderTasks();
    
    return analysis;
}

// Date utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getDueDateStatus(dueDateString) {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'overdue';
    } else if (diffDays <= 7) {
        return 'soon';
    } else {
        return 'normal';
    }
}

// Rendering Functions
function renderDashboard() {
    const tasks = currentProject.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('in-progress-tasks').textContent = inProgressTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    document.getElementById('progress-fill').style.width = `${completionPercentage}%`;
    document.getElementById('progress-text').textContent = `${completionPercentage}% Complete`;
}

function renderTasks() {
    tasksContainer.innerHTML = '';
    
    currentProject.tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const dueDateStatus = getDueDateStatus(task.dueDate);
    const dueDateClass = dueDateStatus === 'overdue' ? 'due-date-overdue' : 
                        dueDateStatus === 'soon' ? 'due-date-soon' : '';
    
    card.innerHTML = `
        <div class="task-header">
            <div>
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${task.description}</p>
            </div>
            <span class="task-status ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
        </div>
        <div class="task-body">
            <div class="task-meta">
                <div class="meta-item">
                    <span class="meta-label">Assignee</span>
                    <span class="meta-value">${task.assignee}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Priority</span>
                    <span class="meta-value priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Due Date</span>
                    <span class="meta-value ${dueDateClass}">${formatDate(task.dueDate)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Responses</span>
                    <span class="meta-value">${task.responses.length}</span>
                </div>
            </div>
        </div>
        <div class="task-footer">
            <span class="responses-count">${task.responses.length} response${task.responses.length !== 1 ? 's' : ''}</span>
            <button class="respond-btn" onclick="openResponseModal('${task.id}')">Respond</button>
        </div>
    `;
    
    return card;
}

// Modal Management
function openResponseModal(taskId) {
    currentTaskId = taskId;
    const task = getTask(taskId);
    if (!task) return;
    
    modalTaskTitle.textContent = `Respond to: ${task.title}`;
    responseText.value = '';
    updateCharCount();
    hideAnalysisPreview();
    
    responseModal.classList.add('show');
    responseText.focus();
}

function closeResponseModal() {
    responseModal.classList.remove('show');
    currentTaskId = null;
    responseText.value = '';
    hideAnalysisPreview();
}

function updateCharCount() {
    const count = responseText.value.length;
    charCount.textContent = count;
}

function showAnalysisPreview(analysis) {
    analysisResult.textContent = `Status: ${analysis.status || 'No change'} - ${analysis.reason}`;
    analysisPreview.style.display = 'block';
}

function hideAnalysisPreview() {
    analysisPreview.style.display = 'none';
}

function submitResponseHandler() {
    const text = responseText.value.trim();
    if (!text || !currentTaskId) return;
    
    const analysis = updateTaskResponse(currentTaskId, text);
    showAnalysisPreview(analysis);
    
    // Show confirmation for a moment, then close modal
    setTimeout(() => {
        closeResponseModal();
    }, 2000);
}

// Event Listeners
function setupEventListeners() {
    // Theme switching
    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
    
    // Modal events
    closeModal.addEventListener('click', closeResponseModal);
    cancelResponse.addEventListener('click', closeResponseModal);
    submitResponse.addEventListener('click', submitResponseHandler);
    
    // Response text events
    responseText.addEventListener('input', updateCharCount);
    responseText.addEventListener('input', debounce(() => {
        const text = responseText.value.trim();
        if (text.length > 10) {
            const analysis = analyzeResponse(text);
            showAnalysisPreview(analysis);
        } else {
            hideAnalysisPreview();
        }
    }, 500));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && responseModal.classList.contains('show')) {
            closeResponseModal();
        }
        if (e.key === 'Enter' && e.ctrlKey && responseModal.classList.contains('show')) {
            submitResponseHandler();
        }
    });
    
    // Click outside modal to close
    responseModal.addEventListener('click', (e) => {
        if (e.target === responseModal) {
            closeResponseModal();
        }
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make openResponseModal available globally
window.openResponseModal = openResponseModal;