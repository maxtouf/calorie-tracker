// Éléments du DOM
const foodForm = document.getElementById('food-form');
const foodNameInput = document.getElementById('food-name');
const caloriesInput = document.getElementById('calories');
const mealTypeSelect = document.getElementById('meal-type');
const foodEntriesDiv = document.getElementById('food-entries');
const todayCaloriesSpan = document.getElementById('today-calories');
const calorieGoalSpan = document.getElementById('calorie-goal');
const remainingCaloriesSpan = document.getElementById('remaining-calories');
const filterDateInput = document.getElementById('filter-date');
const editGoalBtn = document.getElementById('edit-goal');
const caloriesChart = document.getElementById('calories-chart');

// Initialiser la date d'aujourd'hui pour le filtre
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
filterDateInput.value = formattedDate;

// État de l'application
let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || [];
let calorieGoal = parseInt(localStorage.getItem('calorieGoal')) || 2000;

// Mettre à jour l'objectif affiché
calorieGoalSpan.textContent = calorieGoal;

// Initialiser le graphique
let chart = null;

// Fonctions
function saveToLocalStorage() {
    localStorage.setItem('foodEntries', JSON.stringify(foodEntries));
    localStorage.setItem('calorieGoal', calorieGoal.toString());
}

function addFoodEntry(name, calories, mealType, date = formattedDate) {
    const entry = {
        id: Date.now(),
        name,
        calories,
        mealType,
        date
    };
    
    foodEntries.push(entry);
    saveToLocalStorage();
    updateUI();
}

function deleteFoodEntry(id) {
    foodEntries = foodEntries.filter(entry => entry.id !== id);
    saveToLocalStorage();
    updateUI();
}

function getFilteredEntries() {
    const filterDate = filterDateInput.value;
    return foodEntries.filter(entry => entry.date === filterDate);
}

function getTotalCaloriesForDate(date) {
    return foodEntries
        .filter(entry => entry.date === date)
        .reduce((total, entry) => total + entry.calories, 0);
}

function updateUI() {
    // Mettre à jour la liste des aliments
    const filteredEntries = getFilteredEntries();
    foodEntriesDiv.innerHTML = '';
    
    if (filteredEntries.length === 0) {
        foodEntriesDiv.innerHTML = '<p>Aucune entrée pour cette date.</p>';
    } else {
        filteredEntries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'food-entry';
            
            const mealTypeText = {
                'breakfast': 'Petit-déjeuner',
                'lunch': 'Déjeuner',
                'dinner': 'Dîner',
                'snack': 'Collation'
            }[entry.mealType];
            
            entryDiv.innerHTML = `
                <div class="entry-details">
                    <span class="food-name">${entry.name}</span>
                    <span class="meal-type">${mealTypeText}</span>
                </div>
                <span class="entry-calories">${entry.calories} cal</span>
                <button class="delete-btn" data-id="${entry.id}">Supprimer</button>
            `;
            
            foodEntriesDiv.appendChild(entryDiv);
        });
    }
    
    // Mettre à jour les calories du jour
    const todayTotalCalories = getTotalCaloriesForDate(formattedDate);
    todayCaloriesSpan.textContent = todayTotalCalories;
    
    // Mettre à jour les calories restantes
    const remainingCalories = calorieGoal - todayTotalCalories;
    remainingCaloriesSpan.textContent = remainingCalories;
    
    if (remainingCalories < 0) {
        remainingCaloriesSpan.style.color = '#e74c3c';
    } else {
        remainingCaloriesSpan.style.color = '#27ae60';
    }
    
    // Mettre à jour le graphique
    updateChart();
}

function updateChart() {
    // Préparer les données pour les 7 derniers jours
    const dates = [];
    const calorieData = [];
    const goalData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        dates.push(dateString.slice(5)); // Format MM-DD
        calorieData.push(getTotalCaloriesForDate(dateString));
        goalData.push(calorieGoal);
    }
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(caloriesChart, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Calories',
                    data: calorieData,
                    backgroundColor: '#3498db'
                },
                {
                    label: 'Objectif',
                    data: goalData,
                    type: 'line',
                    borderColor: '#e74c3c',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date (MM-DD)'
                    }
                }
            }
        }
    });
}

// Gestionnaires d'événements
foodForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = foodNameInput.value.trim();
    const calories = parseInt(caloriesInput.value);
    const mealType = mealTypeSelect.value;
    
    addFoodEntry(name, calories, mealType);
    
    // Réinitialiser le formulaire
    foodNameInput.value = '';
    caloriesInput.value = '';
    foodNameInput.focus();
});

foodEntriesDiv.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.getAttribute('data-id'));
        deleteFoodEntry(id);
    }
});

filterDateInput.addEventListener('change', updateUI);

editGoalBtn.addEventListener('click', function() {
    const newGoal = prompt('Entrez votre nouvel objectif de calories quotidien:', calorieGoal);
    const parsedGoal = parseInt(newGoal);
    
    if (!isNaN(parsedGoal) && parsedGoal > 0) {
        calorieGoal = parsedGoal;
        calorieGoalSpan.textContent = calorieGoal;
        saveToLocalStorage();
        updateUI();
    }
});

// Initialiser l'interface
updateUI();