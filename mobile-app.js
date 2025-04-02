// MotivateMe Mobile App
document.addEventListener('DOMContentLoaded', function() {
    console.log("Starting MotivateMe mobile app...");
    
    // Constants
    const STORAGE_KEY = 'motivateMeData';
    const REMINDERS_KEY = 'motivateMeReminders';
    const TINY_WINS_KEY = 'motivateMeTinyWins';
    
    // Enhanced App state
    let appData = {
        tasks: [],
        streak: 0,
        lastActive: null,
        moods: [],
        reflections: [],
        completedMicroGoals: [],
        tinyWins: [],
        softStreak: {
            count: 0,
            lastUpdate: null,
            missedDays: 0
        },
        settings: {
            theme: 'auto', // auto, light, dark
            notifications: true,
            username: 'Friend',
            reminderTone: 'supportive', // supportive, neutral, direct
            interfaceMode: 'standard', // minimal, standard, detailed
            hideMetrics: false,
            energyLevel: 'medium' // low, medium, high
        }
    };
    
    let reminders = [];
    let tinyWins = [];
    
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
                
                // Migration for new fields
                if (!appData.tinyWins) appData.tinyWins = [];
                if (!appData.softStreak) {
                    appData.softStreak = {
                        count: appData.streak || 0,
                        lastUpdate: appData.lastActive,
                        missedDays: 0
                    };
                }
                if (!appData.settings.reminderTone) appData.settings.reminderTone = 'supportive';
                if (!appData.settings.interfaceMode) appData.settings.interfaceMode = 'standard';
                if (!appData.settings.hideMetrics) appData.settings.hideMetrics = false;
                if (!appData.settings.energyLevel) appData.settings.energyLevel = 'medium';
            }
            
            const savedReminders = localStorage.getItem(REMINDERS_KEY);
            if (savedReminders) {
                reminders = JSON.parse(savedReminders);
                console.log("Reminders loaded successfully");
            }
            
            const savedTinyWins = localStorage.getItem(TINY_WINS_KEY);
            if (savedTinyWins) {
                tinyWins = JSON.parse(savedTinyWins);
                console.log("Tiny wins loaded successfully");
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
    
    function saveTinyWins() {
        try {
            localStorage.setItem(TINY_WINS_KEY, JSON.stringify(tinyWins));
        } catch (e) {
            console.error("Error saving tiny wins:", e);
        }
    }
    
    // Tab Navigation
    function setupTabs() {
        // This function is now disabled as tab navigation is handled by inline script
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
            
            // Set message based on reminder tone preference
            const messages = {
                supportive: {
                    '1': "It's completely okay to feel down. Your feelings are valid and important.",
                    '2': "Neutral days are part of the journey too. You're doing just fine.",
                    '3': "That's wonderful! Even small moments of joy matter so much.",
                    '4': "Brilliant! Remember this feeling - you created this moment."
                },
                neutral: {
                    '1': "You've recorded feeling down today.",
                    '2': "You've recorded feeling neutral today.",
                    '3': "You've recorded feeling good today.",
                    '4': "You've recorded feeling great today."
                },
                direct: {
                    '1': "You're feeling down. What small thing might help?",
                    '2': "You're feeling neutral. Consider one small positive action.",
                    '3': "You're feeling good. Great time to tackle something important.",
                    '4': "You're feeling great. Make the most of this energy."
                }
            };
            
            const tone = appData.settings.reminderTone || 'supportive';
            moodMessage.textContent = messages[tone][todaysMood.value] || '';
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
        
        // Record as a tiny win
        recordTinyWin("Checked in with your mood");
        
        saveData();
        updateMoodUI();
    }
    
    // Tiny Wins Tracking
    function recordTinyWin(description) {
        const win = {
            id: Date.now(),
            date: new Date().toISOString(),
            description: description
        };
        
        tinyWins.push(win);
        saveTinyWins();
        
        // Update soft streak
        updateSoftStreak();
        
        return win;
    }
    
    function getTinyWinsToday() {
        const today = new Date().toDateString();
        return tinyWins.filter(win => new Date(win.date).toDateString() === today);
    }
    
    function updateTinyWinsUI() {
        const winsContainer = getElement('tiny-wins-container');
        if (!winsContainer) return;
        
        const todayWins = getTinyWinsToday();
        
        if (todayWins.length === 0) {
            winsContainer.innerHTML = '<p class="text-muted">No tiny wins recorded today yet. Every small action counts!</p>';
            return;
        }
        
        winsContainer.innerHTML = '<h4>Today\'s Tiny Wins</h4>';
        const list = document.createElement('ul');
        list.className = 'tiny-wins-list';
        
        todayWins.forEach(win => {
            const item = document.createElement('li');
            item.className = 'tiny-win-item';
            item.innerHTML = `
                <span class="tiny-win-text">${win.description}</span>
                <span class="tiny-win-time">${new Date(win.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            `;
            list.appendChild(item);
        });
        
        winsContainer.appendChild(list);
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
                    
                    // Record as tiny win
                    recordTinyWin(`Completed micro-goal: ${goalText}`);
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
    
    // Soft Streak counter (more forgiving)
    function updateSoftStreak() {
        const today = new Date().toDateString();
        
        if (!appData.softStreak.lastUpdate) {
            // First use ever
            appData.softStreak = {
                count: 1,
                lastUpdate: today,
                missedDays: 0
            };
        } else {
            // Check how many days have passed
            const lastDate = new Date(appData.softStreak.lastUpdate);
            const todayDate = new Date(today);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (appData.softStreak.lastUpdate !== today) {
                if (diffDays === 1) {
                    // Perfect - used yesterday
                    appData.softStreak.count += 1;
                    appData.softStreak.missedDays = 0;
                } else if (diffDays > 1 && diffDays <= 3) {
                    // Missed a few days but still maintain partial streak
                    appData.softStreak.count += 0.5;
                    appData.softStreak.missedDays = diffDays - 1;
                } else if (diffDays > 3) {
                    // Reset but don't go to zero - maintain some momentum
                    appData.softStreak.count = Math.max(1, Math.floor(appData.softStreak.count * 0.5));
                    appData.softStreak.missedDays = diffDays - 1;
                }
                appData.softStreak.lastUpdate = today;
            }
        }
        
        saveData();
        updateStreakUI();
    }
    
    // Streak counter (traditional)
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
        
        // Also update soft streak
        updateSoftStreak();
    }
    
    // Combined streak UI update
    function updateStreakUI() {
        const streakCounter = getElement('streak-counter');
        const softStreakElement = getElement('soft-streak-counter');
        const streakMessageElement = getElement('streak-message');
        
        if (streakCounter) {
            streakCounter.textContent = appData.streak;
        }
        
        if (softStreakElement) {
            // Show rounded soft streak for cleaner display
            const roundedSoftStreak = Math.floor(appData.softStreak.count);
            softStreakElement.textContent = roundedSoftStreak;
        }
        
        if (streakMessageElement && appData.softStreak.missedDays > 0) {
            let message = '';
            if (appData.softStreak.missedDays === 1) {
                message = "You missed yesterday, but that's okay! Your progress still counts.";
            } else {
                message = `You missed ${appData.softStreak.missedDays} days, but you're back now and that's what matters!`;
            }
            streakMessageElement.textContent = message;
            streakMessageElement.style.display = 'block';
        } else if (streakMessageElement) {
            streakMessageElement.style.display = 'none';
        }
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
            
            // Check if the task has micro-steps
            const hasMicroSteps = task.microSteps && task.microSteps.length > 0;
            
            li.innerHTML = `
                <div class="task-main">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    ${hasMicroSteps ? '<button class="task-expand-btn"><i class="fas fa-chevron-down"></i></button>' : ''}
                    <button class="task-tiny-btn" title="Break into tiny steps"><i class="fas fa-bolt"></i></button>
                    <button class="task-delete"><i class="fas fa-trash"></i></button>
                </div>
                ${hasMicroSteps ? `
                <div class="task-micro-steps" style="display: none;">
                    <ul class="micro-steps-list">
                        ${task.microSteps.map((step, idx) => `
                            <li class="micro-step ${step.completed ? 'completed' : ''}">
                                <input type="checkbox" id="micro-step-${task.id}-${idx}" class="micro-step-checkbox" 
                                    data-task-id="${task.id}" data-step-idx="${idx}" ${step.completed ? 'checked' : ''}>
                                <label for="micro-step-${task.id}-${idx}">${step.text}</label>
                            </li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            
            taskList.appendChild(li);
            
            // Add event listeners to the task
            const checkbox = li.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    task.completed = !task.completed;
                    
                    if (task.completed) {
                        // Record as a tiny win when completing a task
                        recordTinyWin(`Completed task: ${task.text}`);
                    }
                    
                    saveData();
                    updateTasks();
                });
            }
            
            // Delete button
            const deleteBtn = li.querySelector('.task-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    appData.tasks = appData.tasks.filter(t => t.id !== task.id);
                    saveData();
                    updateTasks();
                });
            }
            
            // Expand micro-steps button
            const expandBtn = li.querySelector('.task-expand-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    const microStepsDiv = li.querySelector('.task-micro-steps');
                    if (microStepsDiv) {
                        const isHidden = microStepsDiv.style.display === 'none';
                        microStepsDiv.style.display = isHidden ? 'block' : 'none';
                        expandBtn.innerHTML = isHidden ? 
                            '<i class="fas fa-chevron-up"></i>' : 
                            '<i class="fas fa-chevron-down"></i>';
                    }
                });
            }
            
            // Break into tiny steps button
            const tinyBtn = li.querySelector('.task-tiny-btn');
            if (tinyBtn) {
                tinyBtn.addEventListener('click', () => {
                    createMicroSteps(task.id);
                });
            }
            
            // Micro-step checkboxes
            const microCheckboxes = li.querySelectorAll('.micro-step-checkbox');
            microCheckboxes.forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const taskId = e.target.dataset.taskId;
                    const stepIdx = parseInt(e.target.dataset.stepIdx);
                    const targetTask = appData.tasks.find(t => t.id.toString() === taskId);
                    
                    if (targetTask && targetTask.microSteps && targetTask.microSteps[stepIdx]) {
                        targetTask.microSteps[stepIdx].completed = e.target.checked;
                        
                        if (e.target.checked) {
                            // Record completing a micro-step as a tiny win
                            recordTinyWin(`Completed micro-step: ${targetTask.microSteps[stepIdx].text}`);
                            
                            // Check if all micro-steps are completed
                            const allCompleted = targetTask.microSteps.every(step => step.completed);
                            if (allCompleted) {
                                targetTask.completed = true;
                                recordTinyWin(`Completed all micro-steps for: ${targetTask.text}`);
                            }
                        }
                        
                        saveData();
                        updateTasks();
                    }
                });
            });
        });
    }
    
    function addTask() {
        const taskInput = getElement('task-input');
        if (!taskInput) return;
        
        const text = taskInput.value.trim();
        if (text === '') return;
        
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            dateAdded: new Date().toISOString()
        };
        
        appData.tasks.push(newTask);
        
        // Record adding a task as a tiny win
        recordTinyWin("Added a new task");
        
        saveData();
        updateTasks();
        
        taskInput.value = '';
    }
    
    function createMicroSteps(taskId) {
        const task = appData.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Only create micro-steps if they don't exist yet
        if (!task.microSteps || task.microSteps.length === 0) {
            // Create default micro-steps
            task.microSteps = [
                { text: `Just think about ${task.text.toLowerCase()}`, completed: false },
                { text: `Gather what you need for ${task.text.toLowerCase()}`, completed: false },
                { text: `Start ${task.text.toLowerCase()} for just 2 minutes`, completed: false }
            ];
            
            saveData();
            updateTasks();
            
            // Record as a tiny win
            recordTinyWin(`Broke down task into smaller steps`);
        }
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
        
        // Record reflection as a tiny win
        recordTinyWin("Took time to reflect");
        
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
        
        // Store current scroll position before opening modal
        window._scrollPosition = window.scrollY;
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        
        modal.classList.remove('hidden');
    }
    
    function closeModal() {
        const modal = getElement('modal');
        if (modal) {
            modal.classList.add('hidden');
            
            // Restore scroll position after closing modal
            if (window._scrollPosition !== undefined) {
                setTimeout(() => {
                    window.scrollTo(0, window._scrollPosition);
                }, 10);
            }
        }
    }
    
    // Journal view
    function showJournal(e) {
        // Prevent default if event is passed
        if (e && e.preventDefault) e.preventDefault();
        
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
    
    function showWhy(e) {
        // Prevent default if event is passed
        if (e && e.preventDefault) e.preventDefault();
        
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
    
    function showSettings(e) {
        // Prevent default if event is passed
        if (e && e.preventDefault) e.preventDefault();
        
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
        bindEvent('save-settings', 'click', (e) => {
            if (e && e.preventDefault) e.preventDefault();
            
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
        
        bindEvent('reset-data', 'click', (e) => {
            if (e && e.preventDefault) e.preventDefault();
            
            if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                appData = {
                    tasks: [],
                    streak: 0,
                    lastActive: null,
                    moods: [],
                    reflections: [],
                    completedMicroGoals: [],
                    tinyWins: [],
                    softStreak: {
                        count: 0,
                        lastUpdate: null,
                        missedDays: 0
                    },
                    settings: {
                        theme: 'auto',
                        notifications: true,
                        username: 'Friend',
                        reminderTone: 'supportive',
                        interfaceMode: 'standard',
                        hideMetrics: false,
                        energyLevel: 'medium'
                    }
                };
                
                reminders = [];
                tinyWins = [];
                
                saveData();
                saveReminders();
                saveTinyWins();
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
    
    // Energy Level Handling
    function updateEnergyLevelUI() {
        const energyButtons = getAllElements('.energy-btn');
        const suggestionsContainer = getElement('energy-suggestions');
        
        // Remove active class from all buttons
        energyButtons.forEach(btn => btn.classList.remove('active'));
        
        // Set active button based on current energy level
        const activeButton = document.querySelector(`.energy-btn[data-level="${appData.settings.energyLevel}"]`);
        if (activeButton) activeButton.classList.add('active');
        
        // Update suggestions based on energy level
        if (suggestionsContainer) {
            const suggestions = {
                low: [
                    "Focus on tiny, 2-minute tasks",
                    "Break tasks into smaller micro-steps",
                    "Set a timer for just 5 minutes of activity"
                ],
                medium: [
                    "Try alternating between easy and challenging tasks",
                    "Set a specific goal with a small reward after",
                    "Work in 25-minute focused sessions"
                ],
                high: [
                    "Great time to tackle more challenging tasks",
                    "Consider batch-processing similar activities",
                    "Set ambitious but achievable goals today"
                ]
            };
            
            const currentSuggestions = suggestions[appData.settings.energyLevel] || suggestions.medium;
            
            suggestionsContainer.innerHTML = `
                <div class="suggestions-header">Suggestions for ${appData.settings.energyLevel} energy:</div>
                <ul class="suggestions-list">
                    ${currentSuggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            `;
        }
    }
    
    function setEnergyLevel(level) {
        appData.settings.energyLevel = level;
        saveData();
        updateEnergyLevelUI();
        
        // Record as a tiny win
        recordTinyWin("Checked in with your energy level");
    }
    
    // Struggling support
    function showStrugglingSupport() {
        let content = `
            <div class="struggling-support">
                <p>It's completely okay to struggle. Here are some options that might help:</p>
                
                <div class="support-options">
                    <button id="option-break" class="support-option">
                        <i class="fas fa-coffee"></i>
                        <span>Take a break</span>
                    </button>
                    <button id="option-tiny" class="support-option">
                        <i class="fas fa-leaf"></i>
                        <span>Something tiny</span>
                    </button>
                    <button id="option-breathe" class="support-option">
                        <i class="fas fa-wind"></i>
                        <span>Breathing exercise</span>
                    </button>
                </div>
                
                <div id="support-content" class="support-content"></div>
            </div>
        `;
        
        openModal('I\'m Struggling', content);
        
        // Bind events to options
        bindEvent('option-break', 'click', () => {
            const supportContent = getElement('support-content');
            if (supportContent) {
                supportContent.innerHTML = `
                    <div class="break-suggestion">
                        <p>Taking a break is a form of self-care, not giving up. Set a timer for 10 minutes and do something entirely different:</p>
                        <ul>
                            <li>Step outside for fresh air</li>
                            <li>Make a cup of tea or water</li>
                            <li>Stretch or move your body gently</li>
                            <li>Look out a window and focus on something in nature</li>
                        </ul>
                        <p>After your break, decide if you want to try again or rest longer.</p>
                    </div>
                `;
            }
        });
        
        bindEvent('option-tiny', 'click', () => {
            const supportContent = getElement('support-content');
            if (supportContent) {
                const tinyOptions = [
                    "Write down just one sentence about how you feel",
                    "Organize one small area of your desk",
                    "Drink a glass of water slowly and mindfully",
                    "Identify the smallest possible step toward your goal",
                    "Set a timer and work for just 2 minutes"
                ];
                
                const randomOption = tinyOptions[Math.floor(Math.random() * tinyOptions.length)];
                
                supportContent.innerHTML = `
                    <div class="tiny-suggestion">
                        <p>When you're struggling, tiny actions create momentum:</p>
                        <div class="suggested-action">${randomOption}</div>
                        <button id="another-tiny" class="btn small">Another suggestion</button>
                        <button id="record-tiny-win" class="btn small">I did this!</button>
                    </div>
                `;
                
                bindEvent('another-tiny', 'click', () => {
                    let newOption = randomOption;
                    while (newOption === randomOption) {
                        newOption = tinyOptions[Math.floor(Math.random() * tinyOptions.length)];
                    }
                    
                    const actionDiv = document.querySelector('.suggested-action');
                    if (actionDiv) actionDiv.textContent = newOption;
                });
                
                bindEvent('record-tiny-win', 'click', () => {
                    const action = document.querySelector('.suggested-action');
                    if (action) {
                        recordTinyWin(action.textContent);
                        closeModal();
                        showNotification('Tiny Win Recorded', 'Great job taking a small step forward!');
                    }
                });
            }
        });
        
        bindEvent('option-breathe', 'click', () => {
            const supportContent = getElement('support-content');
            if (supportContent) {
                supportContent.innerHTML = `
                    <div class="breathing-exercise">
                        <div class="breathing-circle"></div>
                        <div class="breathing-text">Breathe in... and out...</div>
                        <p>Continue for 30 seconds, focusing only on your breath</p>
                    </div>
                `;
                
                // Record as a tiny win after 30 seconds
                setTimeout(() => {
                    recordTinyWin("Took time for a breathing exercise");
                    
                    supportContent.innerHTML += `
                        <div class="breathing-complete">
                            <p>Well done! How do you feel now?</p>
                            <div class="breathing-buttons">
                                <button id="breathing-better" class="btn small">A bit better</button>
                                <button id="breathing-same" class="btn small">About the same</button>
                            </div>
                        </div>
                    `;
                    
                    bindEvent('breathing-better', 'click', () => {
                        closeModal();
                        showNotification('Great job', 'Remember you can return to your breath anytime.');
                    });
                    
                    bindEvent('breathing-same', 'click', () => {
                        closeModal();
                        showNotification('That\'s okay', 'It\'s perfectly fine to still feel the same. You still took care of yourself.');
                    });
                }, 30000); // 30 seconds
            }
        });
    }
    
    // Interface settings
    function updateInterfaceMode() {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;
        
        // Remove existing mode classes
        appContainer.classList.remove('mode-minimal', 'mode-standard', 'mode-detailed');
        
        // Add new mode class
        appContainer.classList.add(`mode-${appData.settings.interfaceMode}`);
        
        // Handle metrics visibility
        document.body.classList.toggle('hide-metrics', appData.settings.hideMetrics);
        
        // Apply specific interface adjustments
        const sections = document.querySelectorAll('section');
        
        switch (appData.settings.interfaceMode) {
            case 'minimal':
                sections.forEach(section => {
                    const header = section.querySelector('.section-header');
                    const subtitle = section.querySelector('.section-subtitle');
                    
                    if (header) header.style.marginBottom = '0.25rem';
                    if (subtitle) subtitle.style.display = 'none';
                });
                break;
                
            case 'detailed':
                sections.forEach(section => {
                    const header = section.querySelector('.section-header');
                    const subtitle = section.querySelector('.section-subtitle');
                    
                    if (header) header.style.marginBottom = '0.75rem';
                    if (subtitle) subtitle.style.display = 'block';
                });
                break;
                
            // Standard mode is default
            default:
                sections.forEach(section => {
                    const header = section.querySelector('.section-header');
                    const subtitle = section.querySelector('.section-subtitle');
                    
                    if (header) header.style.marginBottom = '0.5rem';
                    if (subtitle) subtitle.style.display = 'block';
                });
        }
    }
    
    function saveInterfaceSettings() {
        const interfaceMode = getElement('interface-mode');
        const hideMetrics = getElement('hide-metrics');
        
        if (interfaceMode) {
            appData.settings.interfaceMode = interfaceMode.value;
        }
        
        if (hideMetrics) {
            appData.settings.hideMetrics = hideMetrics.checked;
        }
        
        saveData();
        updateInterfaceMode();
        
        showNotification('Settings Updated', 'Your interface preferences have been saved.');
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
        
        // Apply interface mode
        updateInterfaceMode();
        
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
        
        // Energy level
        bindQueryEvent('.energy-btn', 'click', (e) => {
            setEnergyLevel(e.currentTarget.dataset.level);
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
        
        // Struggling support
        bindEvent('struggling-btn', 'click', (e) => {
            e.preventDefault();
            showStrugglingSupport();
        });
        
        // Reflection
        bindEvent('save-reflection-btn', 'click', saveReflection);
        
        // Quotes
        bindEvent('new-quote-btn', 'click', newQuote);
        
        // Reminders
        bindEvent('save-reminder', 'click', saveReminder);
        
        // Interface settings
        bindEvent('save-interface', 'click', saveInterfaceSettings);
        
        // Modal
        bindEvent('show-journal', 'click', function(e) {
            e.preventDefault();
            showJournal(e);
        });
        bindEvent('show-why', 'click', function(e) {
            e.preventDefault();
            showWhy(e);
        });
        bindEvent('show-settings', 'click', function(e) {
            e.preventDefault();
            showSettings(e);
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
        updateTinyWinsUI();
        updateEnergyLevelUI();
    }
    
    // Start the app
    init();
}); 