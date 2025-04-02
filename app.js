// DOM Elements - With safeguards against missing elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const streakCounter = document.getElementById('streak-counter');
const moodButtons = document.querySelectorAll('.mood-btn');
const moodMessage = document.getElementById('mood-message');
const reflectionQuestion = document.getElementById('reflection-question');
const reflectionAnswer = document.getElementById('reflection-answer');
const saveReflectionBtn = document.getElementById('save-reflection-btn');
const quoteElement = document.getElementById('quote');
const newQuoteBtn = document.getElementById('new-quote-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');
const showJournalBtn = document.getElementById('show-journal');
const showWhyBtn = document.getElementById('show-why');
const showSettingsBtn = document.getElementById('show-settings');

// New elements for emergency help
const emergencyBtns = document.querySelectorAll('.emergency-btn');
const emergencyDisplay = document.getElementById('emergency-display');
const toggleEmergency = document.getElementById('toggle-emergency');
const emergencyContent = document.getElementById('emergency-content');

// New elements for micro goals
const microGoals = document.querySelectorAll('.micro-checkbox');
const refreshMicroGoalsBtn = document.getElementById('refresh-micro-goals');
const microGoalsList = document.getElementById('micro-goals-list');

// New elements for toggling sections
const toggleTasks = document.getElementById('toggle-tasks');
const tasksContent = document.getElementById('tasks-content');
const toggleReflection = document.getElementById('toggle-reflection');
const reflectionContent = document.getElementById('reflection-content');

// App Data
let appData = {
    tasks: [],
    streak: 0,
    lastActive: null,
    moods: [],
    reflections: [],
    completedMicroGoals: [],
    settings: {
        reminderTime: '20:00',
        theme: 'light',
        username: 'Friend',
        emergencyContact: '',
        motivationReason: ''
    }
};

// Load data from localStorage
function loadAppData() {
    try {
        const savedData = localStorage.getItem('motivateMeData');
        if (savedData) {
            appData = JSON.parse(savedData);
            renderTasks();
            updateStreak();
            updateMoodUI();
            updateMicroGoalsUI();
        }
    } catch (error) {
        console.error('Error loading app data:', error);
        // If there's an error, reset to defaults
        appData = {
            tasks: [],
            streak: 0,
            lastActive: null,
            moods: [],
            reflections: [],
            completedMicroGoals: [],
            settings: {
                reminderTime: '20:00',
                theme: 'light',
                username: 'Friend',
                emergencyContact: '',
                motivationReason: ''
            }
        };
    }
}

// Save data to localStorage
function saveAppData() {
    try {
        localStorage.setItem('motivateMeData', JSON.stringify(appData));
    } catch (error) {
        console.error('Error saving app data:', error);
        showQuietAlert('There was an issue saving your data.', 'warning');
    }
}

// Check and update streak
function updateStreak() {
    if (!streakCounter) return;
    
    const today = new Date().toDateString();
    
    if (!appData.lastActive) {
        appData.lastActive = today;
        appData.streak = 1;
    } else {
        const lastActiveDate = new Date(appData.lastActive);
        const currentDate = new Date(today);
        
        const timeDiff = currentDate.getTime() - lastActiveDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        if (dayDiff === 1) {
            appData.streak += 1;
            appData.lastActive = today;
        } else if (dayDiff > 1) {
            appData.streak = 1;
            appData.lastActive = today;
        }
    }
    
    streakCounter.textContent = appData.streak;
    saveAppData();
}

// Task Functions
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dateAdded: new Date().toISOString()
    };
    
    appData.tasks.push(task);
    saveAppData();
    renderTasks();
    
    taskInput.value = '';
    taskInput.focus();
}

function toggleTaskComplete(taskId) {
    const task = appData.tasks.find(t => t.id === parseInt(taskId));
    if (task) {
        task.completed = !task.completed;
        
        if (task.completed) {
            // Show encouragement for completing a task
            showQuietAlert('Great job! Remember: any progress is good progress.', 'success');
        }
        
        saveAppData();
        renderTasks();
    }
}

function deleteTask(taskId) {
    appData.tasks = appData.tasks.filter(t => t.id !== parseInt(taskId));
    saveAppData();
    renderTasks();
}

function renderTasks() {
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
        safeAddEventListener(checkbox, 'change', () => toggleTaskComplete(task.id));
        
        const deleteBtn = li.querySelector('.task-delete');
        safeAddEventListener(deleteBtn, 'click', () => deleteTask(task.id));
        
        taskList.appendChild(li);
    });
}

// Mood Tracking
function trackMood(moodValue) {
    const today = new Date().toDateString();
    const moodEntry = {
        date: today,
        value: moodValue
    };
    
    // Check if we already have a mood for today
    const existingMoodIndex = appData.moods.findIndex(m => m.date === today);
    
    if (existingMoodIndex !== -1) {
        appData.moods[existingMoodIndex] = moodEntry;
    } else {
        appData.moods.push(moodEntry);
    }
    
    saveAppData();
    updateMoodUI();
    
    // Display a validation message based on mood
    const messages = {
        '1': "It's okay to not be okay. Your feelings are valid.",
        '2': "Neutral days are part of life too. You're doing fine.",
        '3': "That's great! Small moments of joy matter.",
        '4': "Wonderful! Remember this feeling."
    };
    
    moodMessage.textContent = messages[moodValue];
}

function updateMoodUI() {
    const today = new Date().toDateString();
    const todaysMood = appData.moods.find(m => m.date === today);
    
    // Reset all buttons
    moodButtons.forEach(btn => btn.classList.remove('active'));
    
    // If we have a mood for today, highlight the correct button
    if (todaysMood) {
        const activeButton = document.querySelector(`.mood-btn[data-mood="${todaysMood.value}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            
            // Also set the mood message
            const messages = {
                '1': "It's okay to not be okay. Your feelings are valid.",
                '2': "Neutral days are part of life too. You're doing fine.",
                '3': "That's great! Small moments of joy matter.",
                '4': "Wonderful! Remember this feeling."
            };
            
            moodMessage.textContent = messages[todaysMood.value];
        }
    } else {
        moodMessage.textContent = '';
    }
}

// Micro Goals Functions
const microGoalOptions = [
    "Drink a glass of water",
    "Look out a window for 30 seconds",
    "Stretch for 10 seconds",
    "Take 5 deep breaths",
    "Stand up and sit back down",
    "Notice 3 sounds around you",
    "Massage your shoulders for 5 seconds",
    "Smile (even if you don't feel like it)",
    "Clench and release your fists 3 times",
    "Look at a photo that makes you feel something",
    "Name 3 colors you can see right now",
    "Touch something with an interesting texture",
    "Hum your favorite song for 5 seconds",
    "Arrange 3 items on your desk/table",
    "Write down one word that describes how you feel",
    "Send a simple 'hi' text to someone",
    "Put on lip balm or lotion",
    "Delete one unnecessary notification",
    "Take one item to the trash/recycling",
    "Move one object to where it belongs"
];

function generateMicroGoals() {
    // Get 3 random unique micro goals
    const selectedGoals = [];
    const usedIndices = new Set();
    
    while (selectedGoals.length < 3) {
        const randomIndex = Math.floor(Math.random() * microGoalOptions.length);
        
        if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex);
            selectedGoals.push(microGoalOptions[randomIndex]);
        }
    }
    
    return selectedGoals;
}

function renderMicroGoals(goals) {
    microGoalsList.innerHTML = '';
    
    goals.forEach((goal, index) => {
        const goalId = `micro-goal-${index}`;
        
        const div = document.createElement('div');
        div.className = 'micro-goal';
        
        div.innerHTML = `
            <input type="checkbox" id="${goalId}" class="micro-checkbox" data-goal="${index}">
            <label for="${goalId}">${goal}</label>
        `;
        
        const checkbox = div.querySelector('.micro-checkbox');
        safeAddEventListener(checkbox, 'change', (e) => {
            toggleMicroGoal(index, e.target.checked, goal);
        });
        
        microGoalsList.appendChild(div);
    });
    
    // Update checkbox states based on already completed goals
    updateMicroGoalsUI();
}

function toggleMicroGoal(index, isChecked, goalText) {
    const today = new Date().toDateString();
    
    if (isChecked) {
        // Add to completed goals
        appData.completedMicroGoals.push({
            date: today,
            goalText: goalText
        });
        
        showQuietAlert('Small step taken! That counts.', 'success');
    } else {
        // Remove from completed goals
        appData.completedMicroGoals = appData.completedMicroGoals.filter(
            g => !(g.date === today && g.goalText === goalText)
        );
    }
    
    saveAppData();
}

function updateMicroGoalsUI() {
    const today = new Date().toDateString();
    const todaysCompletedGoals = appData.completedMicroGoals.filter(g => g.date === today);
    
    // Check the checkboxes for goals completed today
    document.querySelectorAll('.micro-checkbox').forEach(checkbox => {
        const goalLabel = checkbox.nextElementSibling.textContent;
        
        const isCompleted = todaysCompletedGoals.some(g => g.goalText === goalLabel);
        checkbox.checked = isCompleted;
    });
}

// Emergency Help Functions
function handleEmergencyAction(action) {
    switch(action) {
        case 'breathe':
            showBreathingExercise();
            break;
        case 'tiny-task':
            showTinyTask();
            break;
        case 'kind-words':
            showKindWords();
            break;
        case 'why-try':
            showWhyTry();
            break;
    }
}

function showBreathingExercise() {
    emergencyDisplay.innerHTML = `
        <div class="breathing-exercise">
            <div class="breathing-circle"></div>
            <p class="breathing-text">Breathe in... Breathe out...</p>
            <p>Follow the circle. Breathe in as it expands, out as it contracts.</p>
        </div>
    `;
}

function showTinyTask() {
    const tinyTasks = [
        "Get a glass of water and take one sip",
        "Touch your toes (or try to)",
        "Look out the window for 30 seconds",
        "Name 5 objects you can see right now",
        "Stretch your arms above your head",
        "Tap your fingers on a surface for 10 seconds",
        "Pick up one item and put it where it belongs",
        "Write down one word on a piece of paper",
        "Take 3 deep breaths",
        "Close your eyes for 20 seconds"
    ];
    
    const randomTask = tinyTasks[Math.floor(Math.random() * tinyTasks.length)];
    
    emergencyDisplay.innerHTML = `
        <div>
            <p>Here's a tiny task that takes almost no energy:</p>
            <h3 style="margin: 1rem 0; color: var(--primary-color);">${randomTask}</h3>
            <p>Once done, check it off here:</p>
            <label style="display: flex; align-items: center; justify-content: center; margin-top: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="tiny-task-done" style="margin-right: 0.5rem">
                <span>I did it (or part of it)</span>
            </label>
        </div>
    `;
    
    // Add event listener to the checkbox
    document.getElementById('tiny-task-done').addEventListener('change', (e) => {
        if (e.target.checked) {
            emergencyDisplay.innerHTML = `
                <div>
                    <p>Great! Even the smallest action breaks inertia.</p>
                    <p style="margin: 1rem 0;">Would you like another tiny task?</p>
                    <button id="another-tiny-task" class="emergency-btn" style="margin: 0 auto; display: block;">
                        Yes, give me another
                    </button>
                </div>
            `;
            
            document.getElementById('another-tiny-task').addEventListener('click', showTinyTask);
        }
    });
}

function showKindWords() {
    const kindMessages = [
        "You matter, even when you don't feel productive.",
        "This difficult moment is not your whole life. It will pass.",
        "You've survived every hard day so far - that's 100% success.",
        "Small steps still move you forward. There's no minimum speed requirement.",
        "It's okay to rest. Resting is not giving up.",
        "You don't have to earn your right to exist and take up space.",
        "Your worth is not measured by your productivity.",
        "Be as kind to yourself as you would be to someone you love.",
        "This feeling is temporary, even when it doesn't feel like it.",
        "You're doing better than you think you are."
    ];
    
    const randomMessage = kindMessages[Math.floor(Math.random() * kindMessages.length)];
    
    emergencyDisplay.innerHTML = `
        <div>
            <p style="font-size: 1.2rem; color: var(--primary-color); margin-bottom: 1rem; font-weight: 500;">${randomMessage}</p>
            <button id="another-kind-message" class="emergency-btn" style="margin: 0 auto; display: block; margin-top: 1rem;">
                Give me another message
            </button>
        </div>
    `;
    
    document.getElementById('another-kind-message').addEventListener('click', showKindWords);
}

function showWhyTry() {
    emergencyDisplay.innerHTML = `
        <div>
            <p>When nothing seems worth doing, remember:</p>
            <ul style="list-style-type: none; padding: 0; margin: 1rem 0;">
                <li style="padding: 0.5rem 0;">✓ Small actions create momentum</li>
                <li style="padding: 0.5rem 0;">✓ Feelings follow action, not the other way around</li>
                <li style="padding: 0.5rem 0;">✓ The goal isn't to feel motivated, but to start despite not feeling motivated</li>
                <li style="padding: 0.5rem 0;">✓ You don't have to do it all - just the next tiny step</li>
            </ul>
            <p>What's one ridiculously small action you could take in the next minute?</p>
        </div>
    `;
}

// Helper functions
function showQuietAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `quiet-alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Fade in
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 300);
    }, 3000);
}

// Reflection Functions
const reflectionPrompts = [
    "What small thing caught your attention today?",
    "Did anything make you smile today, even for a second?",
    "What's one tiny thing you did today that was helpful?",
    "What's one small comfort you experienced today?",
    "What sound did you notice today?",
    "What did you eat today that you enjoyed, even a little?",
    "What's one small thing you're looking forward to?",
    "What's something you saw today that was interesting?",
    "What's one moment today when you felt okay, even briefly?",
    "What's one small thing you can do tomorrow?",
    "What's a small physical sensation you felt today?",
    "What's one basic need you met today (eating, showering, etc.)?",
    "What's a small kindness you showed yourself or someone else?"
];

function getRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * reflectionPrompts.length);
    return reflectionPrompts[randomIndex];
}

function saveReflection() {
    const today = new Date().toDateString();
    const reflectionText = reflectionAnswer.value.trim();
    
    if (reflectionText === '') return;
    
    const reflection = {
        date: today,
        prompt: reflectionQuestion.textContent,
        answer: reflectionText
    };
    
    // Check if we already have a reflection for today
    const existingReflectionIndex = appData.reflections.findIndex(r => r.date === today);
    
    if (existingReflectionIndex !== -1) {
        appData.reflections[existingReflectionIndex] = reflection;
    } else {
        appData.reflections.push(reflection);
    }
    
    saveAppData();
    
    // Show a success message
    reflectionAnswer.value = '';
    showQuietAlert('Your thoughts have been saved.', 'success');
    
    // Get a new prompt for tomorrow
    reflectionQuestion.textContent = getRandomPrompt();
}

// Motivational Quotes - Gentler, more compassionate
const quotes = [
    "The path to change starts with forgiveness for yesterday and a tiny step today.",
    "You don't have to see the whole staircase, just take the first step.",
    "Progress isn't always visible, but each small action creates change beneath the surface.",
    "Your effort doesn't need to be perfect to be valuable.",
    "Today, just do what you can. Tomorrow, try again.",
    "The fact that you're thinking about change means you've already begun.",
    "Tiny habits build strong bridges to a different future.",
    "Every moment is a fresh beginning if you choose it to be.",
    "Healing isn't linear. Some days are harder than others, and that's okay.",
    "Small actions done repeatedly have more impact than big actions done rarely.",
    "Be gentle with yourself. You're doing the best you can with what you have right now.",
    "When everything feels heavy, find one small thing that feels lighter.",
    "The key to moving forward is to focus on the next smallest step.",
    "Having a bad day doesn't mean you have a bad life.",
    "Sometimes, even surviving the day is an achievement worth honoring.",
    "Start where you are. Use what you have. Do what you can.",
    "If today was hard, remember: you made it through 100% of your difficult days so far.",
    "Self-compassion turns walls into doorways.",
    "A slow step forward is still a step forward.",
    "Today matters because it's one more chance to try."
];

function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

function displayNewQuote() {
    if (quoteElement) {
        quoteElement.textContent = getRandomQuote();
    }
}

// Modal Functions
function showModal(title, content) {
    modalBody.innerHTML = `
        <h2>${title}</h2>
        <div class="modal-content-inner">${content}</div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModalFunction() {
    modal.classList.add('hidden');
}

// Journal and Why Functions
function showJournal() {
    if (appData.reflections.length === 0) {
        showModal('Your Words', '<p>Nothing here yet. When you save a reflection, your words will appear here. No pressure though - do it when you feel ready.</p>');
        return;
    }
    
    let content = `<div class="journal-entries">`;
    
    // Sort reflections by date, newest first
    const sortedReflections = [...appData.reflections].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedReflections.forEach(reflection => {
        const date = new Date(reflection.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        content += `
            <div class="journal-entry">
                <div class="journal-date">${formattedDate}</div>
                <div class="journal-prompt">${reflection.prompt}</div>
                <div class="journal-text">${reflection.answer}</div>
            </div>
        `;
    });
    
    content += `</div>`;
    
    showModal('Your Words', content);
}

function showWhy() {
    let content = `
        <div class="why-section">
            <div class="why-item">
                <div class="why-icon"><i class="fas fa-brain"></i></div>
                <div class="why-content">
                    <h3>Breaking the Loop</h3>
                    <p>When we're stuck, our brain gets caught in a negative feedback loop. Taking even the tiniest action breaks this pattern and creates new neural pathways.</p>
                </div>
            </div>
            
            <div class="why-item">
                <div class="why-icon"><i class="fas fa-seedling"></i></div>
                <div class="why-content">
                    <h3>Micro-Steps Matter</h3>
                    <p>Research shows that starting with ridiculously small actions builds momentum more effectively than trying to make big changes all at once.</p>
                </div>
            </div>
            
            <div class="why-item">
                <div class="why-icon"><i class="fas fa-heart"></i></div>
                <div class="why-content">
                    <h3>Self-Compassion Works</h3>
                    <p>Being gentle with yourself isn't just nice—it's scientifically proven to enhance motivation and resilience more than harsh self-criticism.</p>
                </div>
            </div>
            
            <div class="why-item">
                <div class="why-icon"><i class="fas fa-pen"></i></div>
                <div class="why-content">
                    <h3>Noticing Changes You</h3>
                    <p>Simply observing your thoughts, feelings, and small daily experiences increases self-awareness and helps break automatic patterns of behavior.</p>
                </div>
            </div>
        </div>
    `;
    
    showModal('Why This Helps', content);
}

function showSettings() {
    let content = `
        <div class="settings-form">
            <div class="setting-item">
                <label for="username">Your Name (or what you'd like to be called)</label>
                <input type="text" id="username" value="${appData.settings.username}" placeholder="Friend">
            </div>
            
            <div class="setting-item">
                <label for="theme-select">App Theme</label>
                <select id="theme-select">
                    <option value="light" ${appData.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${appData.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label for="motivation-reason">Why do you want to feel better? (optional)</label>
                <textarea id="motivation-reason" rows="3" placeholder="This will be private to you">${appData.settings.motivationReason || ''}</textarea>
                <small>Having a personal reason can help on difficult days</small>
            </div>
            
            <div class="setting-item">
                <label for="emergency-contact">Emergency Contact (optional)</label>
                <input type="text" id="emergency-contact" value="${appData.settings.emergencyContact || ''}" placeholder="Name: Phone or Email">
                <small>Someone you could reach out to on especially difficult days</small>
            </div>
            
            <div class="setting-actions">
                <button id="save-settings">Save Settings</button>
                <button id="reset-data" class="danger-btn">Reset All Data</button>
            </div>
        </div>
    `;
    
    showModal('Settings', content);
    
    // Add event listeners for the settings form
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('reset-data').addEventListener('click', confirmResetData);
}

function saveSettings() {
    appData.settings.username = document.getElementById('username').value || 'Friend';
    appData.settings.theme = document.getElementById('theme-select').value || 'light';
    appData.settings.motivationReason = document.getElementById('motivation-reason').value || '';
    appData.settings.emergencyContact = document.getElementById('emergency-contact').value || '';
    
    saveAppData();
    applyTheme();
    closeModalFunction();
    
    showQuietAlert('Settings saved.', 'success');
}

function confirmResetData() {
    if (confirm("Are you sure you want to reset all your data? This cannot be undone.")) {
        // Reset all data
        appData = {
            tasks: [],
            streak: 0,
            lastActive: null,
            moods: [],
            reflections: [],
            completedMicroGoals: [],
            settings: {
                theme: 'light',
                username: 'Friend',
                emergencyContact: '',
                motivationReason: ''
            }
        };
        
        saveAppData();
        renderTasks();
        updateStreak();
        updateMoodUI();
        closeModalFunction();
        
        showQuietAlert('All data has been reset.');
    }
}

// Section toggling
function toggleSection(contentElement, toggleBtn) {
    if (contentElement.style.display === 'none') {
        contentElement.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        contentElement.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
}

function applyTheme() {
    const root = document.documentElement;
    
    if (appData.settings.theme === 'dark') {
        root.style.setProperty('--background-color', '#1a1a2e');
        root.style.setProperty('--card-color', '#16213e');
        root.style.setProperty('--text-color', '#e6e6e6');
        root.style.setProperty('--text-muted', '#a0a0a0');
        root.style.setProperty('--border-color', '#2a2a4a');
    } else {
        root.style.setProperty('--background-color', '#f8f9fe');
        root.style.setProperty('--card-color', '#ffffff');
        root.style.setProperty('--text-color', '#2d3436');
        root.style.setProperty('--text-muted', '#636e72');
        root.style.setProperty('--border-color', '#dfe6e9');
    }
}

// CSS for quiet alerts
function addAlertStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .quiet-alert {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 8px;
            background-color: rgba(45, 52, 54, 0.9);
            color: white;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .quiet-alert.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .quiet-alert.success {
            background-color: rgba(0, 184, 148, 0.9);
        }
        
        .quiet-alert.warning {
            background-color: rgba(253, 203, 110, 0.9);
            color: #2d3436;
        }
    `;
    document.head.appendChild(style);
}

// Safe event binding - only binds if element exists
function safeAddEventListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

// Event Listeners with null checks
function setupEventListeners() {
    // Task Events
    safeAddEventListener(addTaskBtn, 'click', addTask);
    
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }
    
    // Mood Events
    moodButtons.forEach(btn => {
        safeAddEventListener(btn, 'click', () => {
            trackMood(btn.dataset.mood);
        });
    });
    
    // Emergency Help Events
    emergencyBtns.forEach(btn => {
        safeAddEventListener(btn, 'click', () => {
            handleEmergencyAction(btn.dataset.action);
        });
    });
    
    // Micro Goal Events
    microGoals.forEach(checkbox => {
        safeAddEventListener(checkbox, 'change', (e) => {
            const index = parseInt(e.target.dataset.goal || 0);
            const goalText = e.target.nextElementSibling ? e.target.nextElementSibling.textContent : '';
            toggleMicroGoal(index, e.target.checked, goalText);
        });
    });
    
    safeAddEventListener(refreshMicroGoalsBtn, 'click', () => {
        const newGoals = generateMicroGoals();
        renderMicroGoals(newGoals);
    });
    
    // Section Toggle Events
    safeAddEventListener(toggleEmergency, 'click', () => toggleSection(emergencyContent, toggleEmergency));
    safeAddEventListener(toggleTasks, 'click', () => toggleSection(tasksContent, toggleTasks));
    safeAddEventListener(toggleReflection, 'click', () => toggleSection(reflectionContent, toggleReflection));
    
    // Reflection Events
    safeAddEventListener(saveReflectionBtn, 'click', saveReflection);
    
    // Quote Events
    safeAddEventListener(newQuoteBtn, 'click', displayNewQuote);
    
    // Modal Events
    safeAddEventListener(closeModal, 'click', closeModalFunction);
    
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            closeModalFunction();
        }
    });
    
    // Navigation Events
    safeAddEventListener(showJournalBtn, 'click', showJournal);
    safeAddEventListener(showWhyBtn, 'click', showWhy);
    safeAddEventListener(showSettingsBtn, 'click', showSettings);
}

// Initialize App with error handling
function initApp() {
    try {
        console.log("Initializing MotivateMe app...");
        
        // Add styles for alerts
        addAlertStyles();
        
        // Load and render data
        loadAppData();
        
        // Generate micro goals if none exist
        if (microGoalsList) {
            const microGoalOptions = generateMicroGoals();
            renderMicroGoals(microGoalOptions);
        }
        
        // Display quote and reflection prompt
        if (quoteElement) {
            displayNewQuote();
        }
        
        if (reflectionQuestion) {
            reflectionQuestion.textContent = getRandomPrompt();
        }
        
        // Apply theme
        applyTheme();
        
        // Initialize all section toggles to be open
        if (emergencyContent) emergencyContent.style.display = 'block';
        if (tasksContent) tasksContent.style.display = 'block';
        if (reflectionContent) reflectionContent.style.display = 'block';
        
        // Set up event listeners
        setupEventListeners();
        
        // Show welcome message on first visit
        if (!localStorage.getItem('motivateMeFirstVisit')) {
            localStorage.setItem('motivateMeFirstVisit', 'true');
            setTimeout(() => {
                showQuietAlert("Welcome. This app is designed for difficult days. There's no right way to use it - just what helps you.", "success");
            }, 1000);
        }
        
        console.log("MotivateMe app initialized successfully!");
    } catch (error) {
        console.error("Error initializing app:", error);
        showQuietAlert("There was an issue loading the app. Please try refreshing the page.", "warning");
    }
}

// Start the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);