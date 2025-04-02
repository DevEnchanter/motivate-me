// Simple version of MotivateMe app with only essential functions
document.addEventListener('DOMContentLoaded', function() {
    console.log("Starting simplified MotivateMe app...");
    
    // Constants
    const STORAGE_KEY = 'motivateMeData';
    
    // App state
    let appData = {
        tasks: [],
        streak: 0,
        lastActive: null,
        moods: [],
        reflections: [],
        completedMicroGoals: [],
        settings: {
            theme: 'light',
            username: 'Friend'
        }
    };
    
    // DOM Elements - Get elements only when needed to avoid null references
    function getElement(id) {
        return document.getElementById(id);
    }
    
    function getAllElements(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Safe event binding - only binds if element exists
    function bindEvent(elementId, event, handler) {
        const element = getElement(elementId);
        if (element) {
            element.addEventListener(event, handler);
            return true;
        }
        return false;
    }
    
    function bindQueryEvent(selector, event, handler) {
        const elements = getAllElements(selector);
        elements.forEach(el => el.addEventListener(event, handler));
        return elements.length > 0;
    }
    
    // Load/Save Data
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                appData = JSON.parse(saved);
                console.log("Data loaded successfully");
            }
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        } catch (e) {
            console.error("Error saving data:", e);
        }
    }
    
    // Simple UI Updates
    function updateUI() {
        updateTasks();
        updateStreak();
        updateMoodUI();
        updateMicroGoals();
        updateReflectionUI();
        updateQuote();
    }
    
    // Tasks
    function updateTasks() {
        const taskList = getElement('task-list');
        if (!taskList) return;
        
        taskList.innerHTML = '';
        
        appData.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <button class="task-delete"><i class="fas fa-trash"></i></button>
            `;
            
            const checkbox = li.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    task.completed = !task.completed;
                    saveData();
                    updateTasks();
                });
            }
            
            const deleteBtn = li.querySelector('.task-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    appData.tasks = appData.tasks.filter(t => t.id !== task.id);
                    saveData();
                    updateTasks();
                });
            }
            
            taskList.appendChild(li);
        });
    }
    
    function addTask() {
        const taskInput = getElement('task-input');
        if (!taskInput) return;
        
        const text = taskInput.value.trim();
        if (text === '') return;
        
        appData.tasks.push({
            id: Date.now(),
            text: text,
            completed: false,
            dateAdded: new Date().toISOString()
        });
        
        saveData();
        updateTasks();
        
        taskInput.value = '';
    }
    
    // Streak counter
    function updateStreak() {
        const streakCounter = getElement('streak-counter');
        if (!streakCounter) return;
        
        const today = new Date().toDateString();
        
        if (!appData.lastActive) {
            appData.lastActive = today;
            appData.streak = 1;
        } else if (appData.lastActive !== today) {
            appData.lastActive = today;
            appData.streak += 1;
        }
        
        streakCounter.textContent = appData.streak;
        saveData();
    }
    
    // Mood tracking
    function updateMoodUI() {
        const moodButtons = getAllElements('.mood-btn');
        const moodMessage = getElement('mood-message');
        
        // Remove active class from all buttons
        moodButtons.forEach(btn => btn.classList.remove('active'));
        
        // Find today's mood
        const today = new Date().toDateString();
        const todaysMood = appData.moods.find(m => m.date === today);
        
        if (todaysMood && moodMessage) {
            // Set active button
            const activeButton = document.querySelector(`.mood-btn[data-mood="${todaysMood.value}"]`);
            if (activeButton) activeButton.classList.add('active');
            
            // Set message
            const messages = {
                '1': "It's okay to not be okay. Your feelings are valid.",
                '2': "Neutral days are part of life too. You're doing fine.",
                '3': "That's great! Small moments of joy matter.",
                '4': "Wonderful! Remember this feeling."
            };
            
            moodMessage.textContent = messages[todaysMood.value] || '';
        }
    }
    
    function recordMood(value) {
        const today = new Date().toDateString();
        
        // Find existing mood entry for today
        const existingIndex = appData.moods.findIndex(m => m.date === today);
        
        if (existingIndex !== -1) {
            appData.moods[existingIndex].value = value;
        } else {
            appData.moods.push({
                date: today,
                value: value
            });
        }
        
        saveData();
        updateMoodUI();
    }
    
    // Micro goals
    function updateMicroGoals() {
        const microGoalsList = getElement('micro-goals-list');
        if (!microGoalsList) return;
        
        // If list is empty, generate micro goals
        if (microGoalsList.children.length === 0) {
            const goals = [
                "Drink a glass of water",
                "Look out a window for 30 seconds",
                "Take 5 deep breaths"
            ];
            
            microGoalsList.innerHTML = '';
            
            goals.forEach((goal, index) => {
                const div = document.createElement('div');
                div.className = 'micro-goal';
                
                const id = `micro-goal-${index}`;
                div.innerHTML = `
                    <input type="checkbox" id="${id}" class="micro-checkbox" data-goal="${index}">
                    <label for="${id}">${goal}</label>
                `;
                
                microGoalsList.appendChild(div);
            });
            
            // Bind events to new checkboxes
            bindQueryEvent('.micro-checkbox', 'change', (e) => {
                const today = new Date().toDateString();
                const goalText = e.target.nextElementSibling.textContent;
                
                if (e.target.checked) {
                    // Add to completed goals
                    appData.completedMicroGoals.push({
                        date: today,
                        goalText: goalText
                    });
                } else {
                    // Remove from completed goals
                    appData.completedMicroGoals = appData.completedMicroGoals.filter(
                        g => !(g.date === today && g.goalText === goalText)
                    );
                }
                
                saveData();
            });
        }
        
        // Check completed goals
        const today = new Date().toDateString();
        const checkboxes = getAllElements('.micro-checkbox');
        
        checkboxes.forEach(checkbox => {
            const goalText = checkbox.nextElementSibling.textContent;
            const isCompleted = appData.completedMicroGoals.some(
                g => g.date === today && g.goalText === goalText
            );
            
            checkbox.checked = isCompleted;
        });
    }
    
    // Reflection
    function updateReflectionUI() {
        const reflectionQuestion = getElement('reflection-question');
        if (!reflectionQuestion) return;
        
        // Simple prompts
        const prompts = [
            "What small thing caught your attention today?",
            "Did anything make you smile today, even for a second?",
            "What's one tiny thing you did today that was helpful?",
            "What's one small comfort you experienced today?"
        ];
        
        // Set a prompt if not already set
        if (!reflectionQuestion.textContent) {
            const randomIndex = Math.floor(Math.random() * prompts.length);
            reflectionQuestion.textContent = prompts[randomIndex];
        }
    }
    
    function saveReflection() {
        const question = getElement('reflection-question');
        const answer = getElement('reflection-answer');
        
        if (!question || !answer) return;
        
        const text = answer.value.trim();
        if (text === '') return;
        
        const today = new Date().toDateString();
        
        appData.reflections.push({
            date: today,
            prompt: question.textContent,
            answer: text
        });
        
        saveData();
        answer.value = '';
        
        // Show a simple alert
        alert('Your reflection has been saved.');
    }
    
    // Quotes
    function updateQuote() {
        const quoteElement = getElement('quote');
        if (!quoteElement) return;
        
        // Simple quotes list
        const quotes = [
            "The path to change starts with forgiveness for yesterday and a tiny step today.",
            "You don't have to see the whole staircase, just take the first step.",
            "Progress isn't always visible, but each small action creates change beneath the surface.",
            "Your effort doesn't need to be perfect to be valuable.",
            "Today, just do what you can. Tomorrow, try again."
        ];
        
        // Set a random quote if not already set
        if (quoteElement.textContent === '') {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            quoteElement.textContent = quotes[randomIndex];
        }
    }
    
    function newQuote() {
        const quoteElement = getElement('quote');
        if (!quoteElement) return;
        
        const quotes = [
            "The path to change starts with forgiveness for yesterday and a tiny step today.",
            "You don't have to see the whole staircase, just take the first step.",
            "Progress isn't always visible, but each small action creates change beneath the surface.",
            "Your effort doesn't need to be perfect to be valuable.",
            "Today, just do what you can. Tomorrow, try again."
        ];
        
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.textContent = quotes[randomIndex];
    }
    
    // Modal functions
    function openModal(title, content) {
        const modal = getElement('modal');
        const modalBody = getElement('modal-body');
        
        if (!modal || !modalBody) return;
        
        modalBody.innerHTML = `
            <h2>${title}</h2>
            <div class="modal-content-inner">${content}</div>
        `;
        
        modal.classList.remove('hidden');
    }
    
    function closeModal() {
        const modal = getElement('modal');
        if (modal) modal.classList.add('hidden');
    }
    
    // Journal view
    function showJournal() {
        if (appData.reflections.length === 0) {
            openModal('Your Words', '<p>Nothing here yet. When you save a reflection, your words will appear here.</p>');
            return;
        }
        
        let content = '<div class="journal-entries">';
        
        appData.reflections.forEach(reflection => {
            const date = new Date(reflection.date);
            const formattedDate = date.toLocaleDateString();
            
            content += `
                <div class="journal-entry">
                    <div class="journal-date">${formattedDate}</div>
                    <div class="journal-prompt">${reflection.prompt}</div>
                    <div class="journal-text">${reflection.answer}</div>
                </div>
            `;
        });
        
        content += '</div>';
        
        openModal('Your Words', content);
    }
    
    function showWhy() {
        const content = `
            <div class="why-section">
                <p>Taking small steps helps break negative thought patterns and builds momentum.</p>
                <p>Self-compassion is more effective than self-criticism for building motivation.</p>
                <p>Simply noticing your thoughts and feelings can help break automatic patterns.</p>
            </div>
        `;
        
        openModal('Why This Helps', content);
    }
    
    function showSettings() {
        const content = `
            <div class="settings-form">
                <div class="setting-item">
                    <label for="theme-select">App Theme</label>
                    <select id="theme-select">
                        <option value="light" ${appData.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${appData.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>
                <div class="setting-actions">
                    <button id="save-settings">Save Settings</button>
                    <button id="reset-data" class="danger-btn">Reset All Data</button>
                </div>
            </div>
        `;
        
        openModal('Settings', content);
        
        // Bind events for settings form
        bindEvent('save-settings', 'click', () => {
            const themeSelect = getElement('theme-select');
            if (themeSelect) {
                appData.settings.theme = themeSelect.value;
                saveData();
                applyTheme();
            }
            closeModal();
        });
        
        bindEvent('reset-data', 'click', () => {
            if (confirm('Are you sure you want to reset all your data?')) {
                appData = {
                    tasks: [],
                    streak: 0,
                    lastActive: null,
                    moods: [],
                    reflections: [],
                    completedMicroGoals: [],
                    settings: {
                        theme: 'light',
                        username: 'Friend'
                    }
                };
                saveData();
                updateUI();
                closeModal();
            }
        });
    }
    
    // Apply theme
    function applyTheme() {
        if (appData.settings.theme === 'dark') {
            document.documentElement.style.setProperty('--background-color', '#1a1a2e');
            document.documentElement.style.setProperty('--card-color', '#16213e');
            document.documentElement.style.setProperty('--text-color', '#e6e6e6');
            document.documentElement.style.setProperty('--text-muted', '#a0a0a0');
            document.documentElement.style.setProperty('--border-color', '#2a2a4a');
        } else {
            document.documentElement.style.setProperty('--background-color', '#f8f9fe');
            document.documentElement.style.setProperty('--card-color', '#ffffff');
            document.documentElement.style.setProperty('--text-color', '#2d3436');
            document.documentElement.style.setProperty('--text-muted', '#636e72');
            document.documentElement.style.setProperty('--border-color', '#dfe6e9');
        }
    }
    
    // Section toggling
    function setupToggleButtons() {
        const toggles = [
            { toggle: 'toggle-emergency', content: 'emergency-content' },
            { toggle: 'toggle-tasks', content: 'tasks-content' },
            { toggle: 'toggle-reflection', content: 'reflection-content' }
        ];
        
        toggles.forEach(item => {
            const toggleBtn = getElement(item.toggle);
            const contentEl = getElement(item.content);
            
            if (toggleBtn && contentEl) {
                toggleBtn.addEventListener('click', () => {
                    const isVisible = contentEl.style.display !== 'none';
                    contentEl.style.display = isVisible ? 'none' : 'block';
                    toggleBtn.innerHTML = isVisible ? 
                        '<i class="fas fa-chevron-down"></i>' : 
                        '<i class="fas fa-chevron-up"></i>';
                });
            }
        });
    }
    
    // Initialize everything
    function init() {
        console.log("Initializing MotivateMe app with simplified code...");
        
        // Load saved data
        loadData();
        
        // Apply theme
        applyTheme();
        
        // Set up UI
        updateUI();
        
        // Bind events
        bindEvent('add-task-btn', 'click', addTask);
        bindEvent('task-input', 'keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        bindQueryEvent('.mood-btn', 'click', (e) => {
            recordMood(e.currentTarget.dataset.mood);
        });
        
        bindEvent('refresh-micro-goals', 'click', () => {
            const goalsList = getElement('micro-goals-list');
            if (goalsList) goalsList.innerHTML = '';
            updateMicroGoals();
        });
        
        bindEvent('save-reflection-btn', 'click', saveReflection);
        bindEvent('new-quote-btn', 'click', newQuote);
        
        // Modal
        bindEvent('show-journal', 'click', showJournal);
        bindEvent('show-why', 'click', showWhy);
        bindEvent('show-settings', 'click', showSettings);
        bindEvent('close-modal', 'click', closeModal);
        
        // Section toggles
        setupToggleButtons();
        
        console.log("Simplified MotivateMe app initialized successfully!");
    }
    
    // Start the app
    init();
}); 