document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let events = JSON.parse(localStorage.getItem('events')) || [];
    let timerSessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 'general', name: 'Général' },
        { id: 'work', name: 'Travail' },
        { id: 'personal', name: 'Personnel' },
        { id: 'health', name: 'Santé' }
    ];
    let budgetCategories = JSON.parse(localStorage.getItem('budgetCategories')) || [
        { id: 'income', name: 'Revenu' },
        { id: 'food', name: 'Nourriture' },
        { id: 'housing', name: 'Logement' },
        { id: 'transport', name: 'Transport' },
        { id: 'entertainment', name: 'Divertissement' }
    ];
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let timerInterval;
    let timerSeconds = 25 * 60; // 25 minutes par défaut
    let isTimerRunning = false;

    // Initialisation
    init();

    // Fonctions d'initialisation
    function init() {
        updateDateDisplay();
        setupTabNavigation();
        loadTasks();
        loadCategories();
        loadHabits();
        loadCalendar();
        loadTimerSessions();
        loadTransactions();
        loadBudgetCategories();
        setupEventListeners();
    }

    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('fr-FR', options);
    }

    function setupTabNavigation() {
        const tabs = document.querySelectorAll('.sidebar li');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    // Fonctions pour la section To-Do
    function setupEventListeners() {
        // To-Do
        document.getElementById('add-task').addEventListener('click', addTask);
        document.getElementById('new-task').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        document.getElementById('add-category').addEventListener('click', addCategory);
        document.getElementById('new-category').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addCategory();
        });

        // Filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTasks(this.getAttribute('data-filter'));
            });
        });

        // Habitudes
        document.getElementById('add-habit').addEventListener('click', addHabit);
        document.getElementById('new-habit').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addHabit();
        });

        // Calendrier
        document.getElementById('prev-month').addEventListener('click', prevMonth);
        document.getElementById('next-month').addEventListener('click', nextMonth);
        document.getElementById('add-event').addEventListener('click', addEvent);

        // Timer
        document.getElementById('start-timer').addEventListener('click', startTimer);
        document.getElementById('pause-timer').addEventListener('click', pauseTimer);
        document.getElementById('reset-timer').addEventListener('click', resetTimer);
        document.getElementById('set-timer').addEventListener('click', setTimer);
        document.getElementById('clear-timer-history').addEventListener('click', clearTimerHistory);

        // Budget
        document.getElementById('add-transaction').addEventListener('click', addTransaction);
        document.getElementById('new-transaction').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTransaction();
        });
        document.getElementById('add-budget-category').addEventListener('click', addBudgetCategory);
        document.getElementById('new-budget-category').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addBudgetCategory();
        });
        document.querySelectorAll('.budget-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.budget-filters .filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTransactions(this.getAttribute('data-filter'));
            });
        });
    }

    function addTask() {
        const taskInput = document.getElementById('new-task');
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const taskCategory = document.getElementById('task-category').value;
        const taskPriority = document.getElementById('task-priority').value;

        const newTask = {
            id: Date.now(),
            text: taskText,
            category: taskCategory,
            priority: taskPriority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTask(newTask);
        taskInput.value = '';
    }

    function renderTask(task) {
        const taskList = document.getElementById('task-list');
        
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        taskItem.dataset.category = task.category;
        if (task.completed) taskItem.classList.add('completed');

        const priorityClass = `priority-${task.priority}`;
        
        taskItem.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-category">${getCategoryName(task.category)}</span>
                <span class="task-priority ${priorityClass}"></span>
            </div>
            <div class="task-actions">
                <button class="edit-task"><i class="fas fa-edit"></i></button>
                <button class="delete-task"><i class="fas fa-trash"></i></button>
            </div>
        `;

        taskList.appendChild(taskItem);

        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('change', function() {
            toggleTaskComplete(task.id, this.checked);
        });

        const editBtn = taskItem.querySelector('.edit-task');
        editBtn.addEventListener('click', () => editTask(task.id));

        const deleteBtn = taskItem.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    }

    function getCategoryName(categoryId) {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Sans catégorie';
    }

    function loadTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    }

    function toggleTaskComplete(id, completed) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = completed;
            saveTasks();
            const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskItem) {
                if (completed) {
                    taskItem.classList.add('completed');
                } else {
                    taskItem.classList.remove('completed');
                }
            }
        }
    }

    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Modifier la tâche:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            loadTasks();
        }
    }

    function deleteTask(id) {
        if (confirm('Supprimer cette tâche ?')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskItem) taskItem.remove();
        }
    }

    function filterTasks(filter) {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'flex';
            } else {
                if (item.dataset.category === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function addCategory() {
        const categoryInput = document.getElementById('new-category');
        const categoryName = categoryInput.value.trim();
        if (categoryName === '') return;

        const newCategory = {
            id: 'category-' + Date.now(),
            name: categoryName
        };

        categories.push(newCategory);
        saveCategories();
        renderCategory(newCategory);
        categoryInput.value = '';
    }

    function renderCategory(category) {
        const categorySelect = document.getElementById('task-category');
        const filterContainer = document.querySelector('.filters');

        // Ajouter au menu déroulant
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);

        // Ajouter au filtre
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-btn';
        filterBtn.dataset.filter = category.id;
        filterBtn.innerHTML = `
            ${category.name}
            <span class="delete-category" data-id="${category.id}"><i class="fas fa-times"></i></span>
        `;
        filterBtn.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-category') || e.target.parentElement.classList.contains('delete-category')) {
                deleteCategory(category.id);
            } else {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTasks(this.getAttribute('data-filter'));
            }
        });
        filterContainer.appendChild(filterBtn);
    }

    function deleteCategory(id) {
        if (confirm('Supprimer cette catégorie ? Les tâches associées seront marquées comme "Sans catégorie".')) {
            // Vérifier si la catégorie est utilisée par des tâches
            const hasTasks = tasks.some(task => task.category === id);
            if (hasTasks) {
                tasks = tasks.map(task => 
                    task.category === id ? { ...task, category: 'uncategorized' } : task
                );
                saveTasks();
            }
            // Supprimer la catégorie
            categories = categories.filter(c => c.id !== id);
            saveCategories();
            // Recharger les catégories et les tâches
            loadCategories();
            loadTasks();
        }
    }

    function loadCategories() {
        const categorySelect = document.getElementById('task-category');
        const filterContainer = document.querySelector('.filters');
        categorySelect.innerHTML = '<option value="uncategorized">Sans catégorie</option>';
        filterContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Toutes</button>';

        categories.forEach(category => renderCategory(category));
    }

    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    // Fonctions pour la section Habitudes
    function addHabit() {
        const habitInput = document.getElementById('new-habit');
        const habitName = habitInput.value.trim();
        if (habitName === '') return;

        const newHabit = {
            id: Date.now(),
            name: habitName,
            trackedDays: {},
            createdAt: new Date().toISOString()
        };

        habits.push(newHabit);
        saveHabits();
        renderHabit(newHabit);
        habitInput.value = '';
        updateHabitChart();
    }

    function renderHabit(habit) {
        const habitList = document.getElementById('habit-list');
        
        const habitItem = document.createElement('div');
        habitItem.className = 'habit-item';
        habitItem.dataset.id = habit.id;

        const today = new Date().toISOString().split('T')[0];
        const isTrackedToday = habit.trackedDays[today] || false;

        habitItem.innerHTML = `
            <span class="habit-name">${habit.name}</span>
            <div class="habit-actions">
                <button class="track-habit ${isTrackedToday ? 'tracked' : ''}">
                    <i class="fas ${isTrackedToday ? 'fa-check-circle' : 'fa-circle'}"></i>
                </button>
                <button class="delete-habit"><i class="fas fa-trash"></i></button>
            </div>
        `;

        habitList.appendChild(habitItem);

        const trackBtn = habitItem.querySelector('.track-habit');
        trackBtn.addEventListener('click', () => toggleHabitTrack(habit.id));

        const deleteBtn = habitItem.querySelector('.delete-habit');
        deleteBtn.addEventListener('click', () => deleteHabit(habit.id));
    }

    function toggleHabitTrack(id) {
        const habit = habits.find(h => h.id === id);
        if (!habit) return;

        const today = new Date().toISOString().split('T')[0];
        habit.trackedDays[today] = !habit.trackedDays[today];
        saveHabits();

        const habitItem = document.querySelector(`.habit-item[data-id="${id}"]`);
        if (habitItem) {
            const trackBtn = habitItem.querySelector('.track-habit');
            const icon = trackBtn.querySelector('i');
            
            if (habit.trackedDays[today]) {
                trackBtn.classList.add('tracked');
                icon.classList.remove('fa-circle');
                icon.classList.add('fa-check-circle');
            } else {
                trackBtn.classList.remove('tracked');
                icon.classList.remove('fa-check-circle');
                icon.classList.add('fa-circle');
            }
        }

        updateHabitChart();
    }

    function deleteHabit(id) {
        if (confirm('Supprimer cette habitude ?')) {
            habits = habits.filter(h => h.id !== id);
            saveHabits();
            const habitItem = document.querySelector(`.habit-item[data-id="${id}"]`);
            if (habitItem) habitItem.remove();
            updateHabitChart();
        }
    }

    function loadHabits() {
        const habitList = document.getElementById('habit-list');
        habitList.innerHTML = '';
        habits.forEach(habit => renderHabit(habit));
        updateHabitChart();
    }

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function updateHabitChart() {
        const ctx = document.getElementById('habit-tracker-chart').getContext('2d');
        
        if (window.habitChart) {
            window.habitChart.destroy();
        }

        const labels = [];
        const datasets = [];
        
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        habits.forEach(habit => {
            const data = labels.map(date => habit.trackedDays[date] ? 1 : 0);
            
            datasets.push({
                label: habit.name,
                data: data,
                borderColor: getRandomColor(),
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            });
        });

        window.habitChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(date => formatChartDate(date)),
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 1 ? 'Fait' : 'Non fait';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + (context.raw === 1 ? 'Fait' : 'Non fait');
                            }
                        }
                    }
                }
            }
        });
    }

    function formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Fonctions pour la section Calendrier
    function loadCalendar() {
        updateMonthYearDisplay();
        renderCalendar();
    }

    function updateMonthYearDisplay() {
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        document.getElementById('current-month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    function renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(event => event.date === dateStr);
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.textContent = event.title;
                eventElement.title = event.description || event.title;
                eventElement.dataset.id = event.id;
                eventElement.addEventListener('click', () => showEventDetails(event.id));
                dayElement.appendChild(eventElement);
            });

            dayElement.addEventListener('click', function(e) {
                if (e.target === this || e.target.classList.contains('day-number')) {
                    document.getElementById('event-date').value = dateStr;
                    document.getElementById('event-title').focus();
                }
            });

            const today = new Date();
            if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()) {
                dayElement.style.border = '2px solid var(--primary-color)';
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    function prevMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateMonthYearDisplay();
        renderCalendar();
    }

    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateMonthYearDisplay();
        renderCalendar();
    }

    function addEvent() {
        const titleInput = document.getElementById('event-title');
        const dateInput = document.getElementById('event-date');
        const descInput = document.getElementById('event-desc');

        const title = titleInput.value.trim();
        const date = dateInput.value;
        const description = descInput.value.trim();

        if (title === '' || date === '') {
            alert('Veuillez remplir au moins le titre et la date');
            return;
        }

        const newEvent = {
            id: Date.now(),
            title: title,
            date: date,
            description: description,
            createdAt: new Date().toISOString()
        };

        events.push(newEvent);
        saveEvents();
        renderCalendar();

        titleInput.value = '';
        dateInput.value = '';
        descInput.value = '';
    }

    function showEventDetails(eventId) {
        const event = events.find(e => e.id == eventId);
        if (!event) return;

        if (confirm(`${event.title}\nDate: ${formatEventDate(event.date)}\n${event.description || ''}\n\nSupprimer cet événement ?`)) {
            deleteEvent(event.id);
        }
    }

    function formatEventDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function deleteEvent(id) {
        events = events.filter(e => e.id !== id);
        saveEvents();
        renderCalendar();
    }

    function saveEvents() {
        localStorage.setItem('events', JSON.stringify(events));
    }

    // Fonctions pour la section Timer
    function loadTimerSessions() {
        const timerSessionsList = document.getElementById('timer-sessions');
        timerSessionsList.innerHTML = '';
        
        timerSessions.slice().reverse().forEach(session => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${formatTimerSessionDate(session.date)}</span>
                <span>${formatTime(session.duration)}</span>
            `;
            timerSessionsList.appendChild(li);
        });
    }

    function clearTimerHistory() {
        if (confirm('Voulez-vous supprimer tout l\'historique du timer ?')) {
            timerSessions = [];
            saveTimerSessions();
            loadTimerSessions();
        }
    }

    function formatTimerSessionDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (isTimerRunning) return;
        
        isTimerRunning = true;
        document.getElementById('start-timer').disabled = true;
        document.getElementById('pause-timer').disabled = false;
        document.getElementById('time').classList.add('pomodoro-pulse');
        
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                document.getElementById('time').classList.remove('pomodoro-pulse');
                alert('Timer terminé !');
                addTimerSession();
                resetTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isTimerRunning) return;
        
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('time').classList.remove('pomodoro-pulse');
    }

    function resetTimer() {
        pauseTimer();
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 25;
        timerSeconds = minutes * 60;
        updateTimerDisplay();
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('time').classList.remove('pomodoro-pulse');
    }

    function setTimer() {
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 25;
        if (minutes < 1 || minutes > 120) {
            alert('Veuillez entrer une valeur entre 1 et 120 minutes');
            return;
        }
        
        timerSeconds = minutes * 60;
        updateTimerDisplay();
        if (!isTimerRunning) {
            resetTimer();
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function addTimerSession() {
        const newSession = {
            id: Date.now(),
            date: new Date().toISOString(),
            duration: parseInt(document.getElementById('timer-minutes').value) * 60
        };
        
        timerSessions.push(newSession);
        saveTimerSessions();
        loadTimerSessions();
    }

    function saveTimerSessions() {
        localStorage.setItem('timerSessions', JSON.stringify(timerSessions));
    }

    // Fonctions pour la section Budget
    function addTransaction() {
        const descriptionInput = document.getElementById('new-transaction');
        const amountInput = document.getElementById('transaction-amount');
        const typeInput = document.getElementById('transaction-type');
        const categoryInput = document.getElementById('transaction-category');
        const dateInput = document.getElementById('transaction-date');

        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeInput.value;
        const category = categoryInput.value;
        const date = dateInput.value || new Date().toISOString().split('T')[0];

        if (description === '' || isNaN(amount) || amount <= 0) {
            alert('Veuillez remplir la description et un montant valide');
            return;
        }

        const newTransaction = {
            id: Date.now(),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date,
            createdAt: new Date().toISOString()
        };

        transactions.push(newTransaction);
        saveTransactions();
        renderTransaction(newTransaction);
        descriptionInput.value = '';
        amountInput.value = '';
        dateInput.value = '';
        updateBudgetSummary();
    }

    function renderTransaction(transaction) {
        const transactionList = document.getElementById('transaction-list');
        
        const transactionItem = document.createElement('li');
        transactionItem.className = `transaction-item ${transaction.type}`;
        transactionItem.dataset.id = transaction.id;
        transactionItem.dataset.category = transaction.category;

        transactionItem.innerHTML = `
            <div class="transaction-content">
                <span class="transaction-text">${transaction.description}</span>
                <span class="transaction-category">${getBudgetCategoryName(transaction.category)}</span>
                <span class="transaction-amount ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)} €</span>
                <span class="transaction-date">${formatTransactionDate(transaction.date)}</span>
            </div>
            <div class="transaction-actions">
                <button class="edit-transaction"><i class="fas fa-edit"></i></button>
                <button class="delete-transaction"><i class="fas fa-trash"></i></button>
            </div>
        `;

        transactionList.appendChild(transactionItem);

        const editBtn = transactionItem.querySelector('.edit-transaction');
        editBtn.addEventListener('click', () => editTransaction(transaction.id));

        const deleteBtn = transactionItem.querySelector('.delete-transaction');
        deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
    }

    function getBudgetCategoryName(categoryId) {
        const category = budgetCategories.find(c => c.id === categoryId);
        return category ? category.name : 'Sans catégorie';
    }

    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        const newDescription = prompt('Modifier la description:', transaction.description);
        const newAmount = prompt('Modifier le montant:', transaction.amount);
        if (newDescription !== null && newDescription.trim() !== '' && newAmount !== null && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            transaction.description = newDescription.trim();
            transaction.amount = parseFloat(newAmount);
            saveTransactions();
            loadTransactions();
            updateBudgetSummary();
        }
    }

    function deleteTransaction(id) {
        if (confirm('Supprimer cette transaction ?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            const transactionItem = document.querySelector(`.transaction-item[data-id="${id}"]`);
            if (transactionItem) transactionItem.remove();
            updateBudgetSummary();
        }
    }

    function filterTransactions(filter) {
        const transactionItems = document.querySelectorAll('.transaction-item');
        
        transactionItems.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'flex';
            } else {
                if (item.dataset.category === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    function loadTransactions() {
        const transactionList = document.getElementById('transaction-list');
        transactionList.innerHTML = '';
        transactions.forEach(transaction => renderTransaction(transaction));
        updateBudgetSummary();
    }

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function addBudgetCategory() {
        const categoryInput = document.getElementById('new-budget-category');
        const categoryName = categoryInput.value.trim();
        if (categoryName === '') return;

        const newCategory = {
            id: 'budget-category-' + Date.now(),
            name: categoryName
        };

        budgetCategories.push(newCategory);
        saveBudgetCategories();
        renderBudgetCategory(newCategory);
        categoryInput.value = '';
    }

    function renderBudgetCategory(category) {
        const categorySelect = document.getElementById('transaction-category');
        const filterContainer = document.querySelector('.budget-filters');

        // Ajouter au menu déroulant
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);

        // Ajouter au filtre
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-btn';
        filterBtn.dataset.filter = category.id;
        filterBtn.innerHTML = `
            ${category.name}
            <span class="delete-category" data-id="${category.id}"><i class="fas fa-times"></i></span>
        `;
        filterBtn.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-category') || e.target.parentElement.classList.contains('delete-category')) {
                deleteBudgetCategory(category.id);
            } else {
                document.querySelectorAll('.budget-filters .filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTransactions(this.getAttribute('data-filter'));
            }
        });
        filterContainer.appendChild(filterBtn);
    }

    function deleteBudgetCategory(id) {
        if (confirm('Supprimer cette catégorie ? Les transactions associées seront marquées comme "Sans catégorie".')) {
            const hasTransactions = transactions.some(t => t.category === id);
            if (hasTransactions) {
                transactions = transactions.map(t => 
                    t.category === id ? { ...t, category: 'uncategorized' } : t
                );
                saveTransactions();
            }
            budgetCategories = budgetCategories.filter(c => c.id !== id);
            saveBudgetCategories();
            loadBudgetCategories();
            loadTransactions();
        }
    }

    function loadBudgetCategories() {
        const categorySelect = document.getElementById('transaction-category');
        const filterContainer = document.querySelector('.budget-filters');
        categorySelect.innerHTML = '<option value="uncategorized">Sans catégorie</option>';
        filterContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Toutes</button>';

        budgetCategories.forEach(category => renderBudgetCategory(category));
    }

    function saveBudgetCategories() {
        localStorage.setItem('budgetCategories', JSON.stringify(budgetCategories));
    }

    function updateBudgetSummary() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;

        document.getElementById('total-income').textContent = totalIncome.toFixed(2);
        document.getElementById('total-expense').textContent = totalExpense.toFixed(2);
        document.getElementById('balance').textContent = balance.toFixed(2);

        updateBudgetChart();
    }

    function updateBudgetChart() {
        const ctx = document.getElementById('budget-chart').getContext('2d');
        
        if (window.budgetChart) {
            window.budgetChart.destroy();
        }

        const expenseCategories = budgetCategories.filter(c => c.id !== 'income');
        const expenseData = expenseCategories.map(category => {
            return transactions
                .filter(t => t.type === 'expense' && t.category === category.id)
                .reduce((sum, t) => sum + t.amount, 0);
        });

        window.budgetChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: expenseCategories.map(c => c.name),
                datasets: [{
                    data: expenseData,
                    backgroundColor: expenseCategories.map(() => getRandomColor()),
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || 0;
                                return `${context.label}: ${value.toFixed(2)} €`;
                            }
                        }
                    }
                }
            }
        });
    }

    function formatTransactionDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
});