// MotivateMe Mobile App
document.addEventListener('DOMContentLoaded', function() {
    console.log("Starting MotivateMe mobile app...");
    
    // Constants
    const STORAGE_KEY = 'motivateMeData';
    const REMINDERS_KEY = 'motivateMeReminders';
    
    // App state
    let appData = {
        tasks: [],
        streak: 0,
        lastActive: null,
        moods: [],
        reflections: [],
        completedMicroGoals: [],
        settings: {
            theme: 'auto', // auto, light, dark
            notifications: true,
            username: 'Friend'
        }
    };
    
    let reminders = [];
    
    // DOM Utility functions
    function getElement(id) {
        return document.getElementById(id);
    }
    
    function getAllElements(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Safe event binding
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
                console.log("App data loaded successfully");
            }
            
            const savedReminders = localStorage.getItem(REMINDERS_KEY);
            if (savedReminders) {
                reminders = JSON.parse(savedReminders);
                console.log("Reminders loaded successfully");
            }
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        } catch (e) {
            console.error("Error saving app data:", e);
        }
    }
    
    function saveReminders() {
        try {
            localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
        } catch (e) {
            console.error("Error saving reminders:", e);
        }
    }
    
    // Tab Navigation
    function setupTabs() {
        // This function is now disabled as tab navigation is handled by inline script
        // Keep this as a placeholder to avoid errors when it's called from init
        console.log("Tab navigation is now handled by inline script");
        
        // Note: This function is intentionally left empty to avoid conflicts with
        // the tab navigation implemented in mobile.html
    }
    
    // Mood Tracking
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
                "Take 5 deep breaths",
                "Stretch for 1 minute",
                "Write down one thing you're grateful for"
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
    
    // Streak counter
    function updateStreak() {
        const streakCounter = getElement('streak-counter');
        if (!streakCounter) return;
        
        const today = new Date().toDateString();
        
        if (!appData.lastActive) {
            // Initialize on first use with streak of 1
            appData.lastActive = today;
            appData.streak = 1;
            saveData(); // Save immediately to ensure the initial value is stored
        } else {
            // Check if last active was yesterday
            const lastDate = new Date(appData.lastActive);
            const todayDate = new Date(today);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (appData.lastActive !== today) {
                if (diffDays === 1) {
                    // Last active was yesterday, increment streak
                    appData.streak += 1;
                } else if (diffDays > 1) {
                    // Streak broken, reset to 1
                    appData.streak = 1;
                }
                appData.lastActive = today;
                saveData(); // Save changes after updating streak
            }
        }
        
        streakCounter.textContent = appData.streak;
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
    
    // Reflection
    function updateReflectionUI() {
        const reflectionQuestion = getElement('reflection-question');
        if (!reflectionQuestion) return;
        
        // Simple prompts
        const prompts = [
            "What small thing caught your attention today?",
            "Did anything make you smile today, even for a second?",
            "What's one tiny thing you did today that was helpful?",
            "What's one small comfort you experienced today?",
            "What's something small you're looking forward to?",
            "What did you do today that was a little bit hard but you did it anyway?",
            "What's one kind thing you could say to yourself right now?"
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
        
        const today = new Date().toISOString();
        
        appData.reflections.push({
            date: today,
            prompt: question.textContent,
            answer: text
        });
        
        saveData();
        answer.value = '';
        
        // Update reflection question for next time
        updateReflectionUI();
        
        // Show a simple notification
        showNotification('Reflection saved', 'Your reflection has been saved. Great job taking time to reflect!');
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
            "Today, just do what you can. Tomorrow, try again.",
            "Small steps are still steps forward.",
            "The only way out is through. Just keep going.",
            "Self-compassion is the foundation of change.",
            "You're exactly where you need to be in your journey.",
            "One small positive thought can change your whole day."
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
            "Today, just do what you can. Tomorrow, try again.",
            "Small steps are still steps forward.",
            "The only way out is through. Just keep going.",
            "Self-compassion is the foundation of change.",
            "You're exactly where you need to be in your journey.",
            "One small positive thought can change your whole day."
        ];
        
        const currentQuote = quoteElement.textContent;
        let newQuoteText = currentQuote;
        
        // Make sure we get a different quote
        while (newQuoteText === currentQuote) {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            newQuoteText = quotes[randomIndex];
        }
        
        quoteElement.textContent = newQuoteText;
    }
    
    // Reminders system
    function updateRemindersUI() {
        const remindersList = getElement('reminders-list');
        if (!remindersList) return;
        
        if (reminders.length === 0) {
            remindersList.innerHTML = '<p class="text-muted">No reminders set up yet</p>';
            return;
        }
        
        remindersList.innerHTML = '';
        
        reminders.forEach((reminder, index) => {
            const reminderEl = document.createElement('div');
            reminderEl.className = 'reminder-item';
            
            // Format the time
            const timeStr = reminder.time;
            
            // Format the repeat pattern
            let repeatStr = 'Daily';
            if (reminder.repeat === 'weekdays') {
                repeatStr = 'Weekdays';
            } else if (reminder.repeat === 'weekends') {
                repeatStr = 'Weekends';
            } else if (reminder.repeat === 'custom') {
                const days = [];
                if (reminder.days.mon) days.push('Mon');
                if (reminder.days.tue) days.push('Tue');
                if (reminder.days.wed) days.push('Wed');
                if (reminder.days.thu) days.push('Thu');
                if (reminder.days.fri) days.push('Fri');
                if (reminder.days.sat) days.push('Sat');
                if (reminder.days.sun) days.push('Sun');
                repeatStr = days.join(', ');
            }
            
            reminderEl.innerHTML = `
                <div class="reminder-info">
                    <div class="reminder-type">${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}</div>
                    <div class="reminder-details">
                        <span>${timeStr}</span> · 
                        <span>${repeatStr}</span>
                    </div>
                </div>
                <button class="reminder-delete" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            
            remindersList.appendChild(reminderEl);
        });
        
        // Bind delete buttons
        bindQueryEvent('.reminder-delete', 'click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            reminders.splice(index, 1);
            saveReminders();
            updateRemindersUI();
        });
    }
    
    function saveReminder() {
        const typeSelect = getElement('reminder-type');
        const timeInput = getElement('reminder-time');
        const repeatSelect = getElement('reminder-repeat');
        
        if (!typeSelect || !timeInput || !repeatSelect) return;
        
        const type = typeSelect.value;
        const time = timeInput.value;
        const repeat = repeatSelect.value;
        
        let days = null;
        if (repeat === 'custom') {
            days = {
                mon: getElement('day-mon').checked,
                tue: getElement('day-tue').checked,
                wed: getElement('day-wed').checked,
                thu: getElement('day-thu').checked,
                fri: getElement('day-fri').checked,
                sat: getElement('day-sat').checked,
                sun: getElement('day-sun').checked
            };
        }
        
        const reminder = {
            type,
            time,
            repeat,
            days,
            enabled: true
        };
        
        reminders.push(reminder);
        saveReminders();
        updateRemindersUI();
        
        // Show confirmation
        showNotification('Reminder Set', 'Your reminder has been set successfully!');
    }
    
    // Notification system
    function showNotification(title, message) {
        const notification = getElement('notification');
        const notificationMessage = getElement('notification-message');
        
        if (!notification || !notificationMessage) return;
        
        // Set the message
        notificationMessage.innerHTML = `<strong>${title}</strong><br>${message}`;
        
        // Show the notification
        notification.classList.add('show');
        
        // Automatically hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Reminder handler for custom notifications
    function setupReminderHandler() {
        // Check if reminders should be triggered
        function checkReminders() {
            if (!appData.settings.notifications) return;
            
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
            
            reminders.forEach(reminder => {
                if (!reminder.enabled) return;
                
                // Parse reminder time
                const [hour, minute] = reminder.time.split(':').map(Number);
                
                // Check if time matches (within the last minute)
                if (currentHour === hour && currentMinute === minute) {
                    // Check if the day matches based on repeat pattern
                    let shouldTrigger = false;
                    
                    if (reminder.repeat === 'daily') {
                        shouldTrigger = true;
                    } else if (reminder.repeat === 'weekdays' && currentDay >= 1 && currentDay <= 5) {
                        shouldTrigger = true;
                    } else if (reminder.repeat === 'weekends' && (currentDay === 0 || currentDay === 6)) {
                        shouldTrigger = true;
                    } else if (reminder.repeat === 'custom' && reminder.days) {
                        // Convert day of week to our day properties
                        const dayProps = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                        const dayProp = dayProps[currentDay];
                        shouldTrigger = reminder.days[dayProp];
                    }
                    
                    if (shouldTrigger) {
                        triggerReminder(reminder);
                    }
                }
            });
        }
        
        function triggerReminder(reminder) {
            let title = 'MotivateMe Reminder';
            let message = '';
            
            switch (reminder.type) {
                case 'tasks':
                    title = 'Task Reminder';
                    message = 'Check in on your tasks for today';
                    break;
                case 'reflection':
                    title = 'Reflection Time';
                    message = 'Take a moment to reflect on your day';
                    break;
                case 'mood':
                    title = 'Mood Check-in';
                    message = 'How are you feeling right now?';
                    break;
                case 'motivation':
                    title = 'Motivation Boost';
                    message = 'Time for a motivational reminder';
                    break;
            }
            
            // Show in-app notification
            showNotification(title, message);
            
            // Try to use web notifications if available and permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: message,
                    icon: '/icon-192.png' // Assumes you have this icon
                });
                
                notification.onclick = function() {
                    window.focus();
                    // Navigate to the relevant tab
                    const tabToActivate = reminder.type === 'motivation' ? 'today' : 
                                        reminder.type === 'tasks' ? 'tasks' : 
                                        reminder.type === 'reflection' ? 'reflect' : 'today';
                    
                    const tabButton = document.querySelector(`.tab[data-tab="${tabToActivate}"]`);
                    if (tabButton) tabButton.click();
                };
            }
        }
        
        // Check reminders every minute
        setInterval(checkReminders, 60000);
        
        // Also check once on startup
        setTimeout(checkReminders, 2000);
    }
    
    // Modal functions
    function openModal(title, content) {
        const modal = getElement('modal');
        const modalTitle = getElement('modal-title');
        const modalBody = getElement('modal-body');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        
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
        
        // Sort reflections by date, newest first
        const sortedReflections = [...appData.reflections].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedReflections.forEach(reflection => {
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
                <p>Consistent small actions compound over time into significant changes.</p>
                <p>Linking new habits to existing routines makes them easier to maintain.</p>
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
                        <option value="auto" ${appData.settings.theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                        <option value="light" ${appData.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${appData.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label for="notifications-toggle">Notifications</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notifications-toggle" 
                            ${appData.settings.notifications ? 'checked' : ''}>
                        <label for="notifications-toggle"></label>
                    </div>
                </div>
                
                <div class="setting-actions">
                    <button id="save-settings" class="btn">Save Settings</button>
                    <button id="reset-data" class="btn danger-btn">Reset All Data</button>
                </div>
            </div>
        `;
        
        openModal('Settings', content);
        
        // Bind events for settings form
        bindEvent('save-settings', 'click', () => {
            const themeSelect = getElement('theme-select');
            const notificationsToggle = getElement('notifications-toggle');
            
            if (themeSelect) {
                appData.settings.theme = themeSelect.value;
            }
            
            if (notificationsToggle) {
                appData.settings.notifications = notificationsToggle.checked;
            }
            
            saveData();
            applyTheme();
            closeModal();
            
            showNotification('Settings Saved', 'Your settings have been updated');
        });
        
        bindEvent('reset-data', 'click', () => {
            if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                appData = {
                    tasks: [],
                    streak: 0,
                    lastActive: null,
                    moods: [],
                    reflections: [],
                    completedMicroGoals: [],
                    settings: {
                        theme: 'auto',
                        notifications: true,
                        username: 'Friend'
                    }
                };
                
                reminders = [];
                
                saveData();
                saveReminders();
                initModules();
                closeModal();
                
                showNotification('Data Reset', 'All your data has been reset');
            }
        });
    }
    
    // Apply theme
    function applyTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let theme = appData.settings.theme;
        
        // If 'auto', use system preference
        if (theme === 'auto') {
            theme = prefersDark ? 'dark' : 'light';
        }
        
        if (theme === 'dark') {
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
    
    // PWA Installation prompt
    function setupPWA() {
        let deferredPrompt;
        const installPrompt = getElement('install-prompt');
        const installBtn = getElement('install-btn');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show the install prompt
            if (installPrompt) {
                installPrompt.style.display = 'flex';
            }
        });
        
        // Installation button click handler
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                if (!deferredPrompt) return;
                
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                        if (installPrompt) {
                            installPrompt.style.display = 'none';
                        }
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    
                    // Clear the prompt reference
                    deferredPrompt = null;
                });
            });
        }
        
        // Hide install prompt if app is already installed
        window.addEventListener('appinstalled', () => {
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
            console.log('PWA was installed');
        });
    }
    
    // Notification permissions
    function setupNotificationPermission() {
        // Only ask for notification permission if the browser supports it
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            // Delay the prompt to avoid overwhelming the user on first visit
            setTimeout(() => {
                const askForPermission = confirm('Would you like to receive reminders even when the app is closed?');
                if (askForPermission) {
                    Notification.requestPermission();
                }
            }, 5000);
        }
    }
    
    // Handle notification interactions
    function setupNotificationControls() {
        const dismissBtn = getElement('notification-dismiss');
        const openBtn = getElement('notification-open');
        const notification = getElement('notification');
        
        if (dismissBtn && notification) {
            dismissBtn.addEventListener('click', () => {
                notification.classList.remove('show');
            });
        }
        
        if (openBtn && notification) {
            openBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                // Depending on the notification type, could navigate to a specific tab
            });
        }
    }
    
    // Custom days toggle in reminder setup
    function setupReminderForm() {
        const repeatSelect = getElement('reminder-repeat');
        const customDays = getElement('custom-days');
        
        if (repeatSelect && customDays) {
            repeatSelect.addEventListener('change', function() {
                customDays.style.display = this.value === 'custom' ? 'block' : 'none';
            });
        }
    }
    
    // Initialize everything
    function init() {
        console.log("Initializing MotivateMe mobile app...");
        
        // Load saved data
        loadData();
        
        // Ensure streak is at least 1 on first use
        if (!appData.streak || appData.streak < 1) {
            appData.streak = 1;
            saveData();
        }
        
        // Apply theme
        applyTheme();
        
        // Setup tabs
        setupTabs();
        
        // Setup reminder form
        setupReminderForm();
        
        // Initialize all modules
        initModules();
        
        // Setup UI components
        setupNotificationControls();
        setupReminderHandler();
        setupPWA();
        setupNotificationPermission();
        
        // Bind all event listeners
        bindEvents();
        
        console.log("MotivateMe mobile app initialized successfully!");
    }
    
    // Bind all event listeners
    function bindEvents() {
        // Prevent default on all tab navigation links
        document.querySelectorAll('a[href="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
            });
        });

        // Mood tracking
        bindQueryEvent('.mood-btn', 'click', (e) => {
            recordMood(e.currentTarget.dataset.mood);
        });
        
        // Micro goals
        bindEvent('refresh-micro-goals', 'click', () => {
            const goalsList = getElement('micro-goals-list');
            if (goalsList) goalsList.innerHTML = '';
            updateMicroGoals();
        });
        
        // Tasks
        bindEvent('add-task-btn', 'click', addTask);
        bindEvent('task-input', 'keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        // Reflection
        bindEvent('save-reflection-btn', 'click', saveReflection);
        
        // Quotes
        bindEvent('new-quote-btn', 'click', newQuote);
        
        // Reminders
        bindEvent('save-reminder', 'click', saveReminder);
        
        // Modal
        bindEvent('show-journal', 'click', function(e) {
            e.preventDefault();
            showJournal();
        });
        bindEvent('show-why', 'click', function(e) {
            e.preventDefault();
            showWhy();
        });
        bindEvent('show-settings', 'click', function(e) {
            e.preventDefault();
            showSettings();
        });
        bindEvent('close-modal', 'click', closeModal);
    }
    
    // Initialize module functions
    function initModules() {
        updateMoodUI();
        updateMicroGoals();
        updateStreak();
        updateTasks();
        updateReflectionUI();
        updateQuote();
        updateRemindersUI();
        setupReminderHandler();
    }
    
    // Start the app
    init();
}); 