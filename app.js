// Déclaration d'une base de données de secours au cas où
var foodsDatabase = [
    { name: "Pomme", calories: 52, category: "Fruits", portion: "1 moyenne (100g)" },
    { name: "Banane", calories: 89, category: "Fruits", portion: "1 moyenne (100g)" },
    { name: "Pain", calories: 265, category: "Céréales et féculents", portion: "100g" }
];

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

// Éléments pour la base de données d'aliments
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const foodSearchInput = document.getElementById('food-search');
const foodCategorySelect = document.getElementById('food-category');
const foodResultsDiv = document.getElementById('food-results');
const selectedFoodForm = document.getElementById('selected-food-form');
const selectedFoodName = document.getElementById('selected-food-name');
const selectedFoodCalories = document.getElementById('selected-food-calories');
const selectedFoodPortion = document.getElementById('selected-food-portion');
const dbFoodQuantity = document.getElementById('db-food-quantity');
const dbMealType = document.getElementById('db-meal-type');
const dbFoodIndex = document.getElementById('db-food-index');
const databaseFoodForm = document.getElementById('database-food-form');

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

// Fonctions pour la base de données d'aliments
function changeTab(tabId) {
    // Désactiver tous les onglets
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    // Si on change vers l'onglet de la base de données, afficher tous les aliments
    if (tabId === 'food-database') {
        // Réinitialiser les filtres
        foodSearchInput.value = '';
        foodCategorySelect.value = 'all';
        // Afficher tous les aliments
        displayFoodResults(foodsDatabase);
    }
}

function searchFoods() {
    const searchTerm = foodSearchInput.value.toLowerCase();
    const category = foodCategorySelect.value;
    
    // Utiliser la base de données globale si disponible
    let allFoods = window.foodsDatabase || foodsDatabase;
    let filteredFoods = allFoods;
    
    // Filtrer par catégorie
    if (category !== 'all') {
        filteredFoods = filteredFoods.filter(food => food.category === category);
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
        filteredFoods = filteredFoods.filter(food => 
            food.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Afficher les résultats
    displayFoodResults(filteredFoods);
}

function displayFoodResults(foods) {
    foodResultsDiv.innerHTML = '';
    
    if (!foods || foods.length === 0) {
        foodResultsDiv.innerHTML = '<div class="no-results">Aucun résultat trouvé</div>';
        return;
    }
    
    foods.forEach((food, index) => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        foodItem.setAttribute('data-index', index);
        
        foodItem.innerHTML = `
            <div class="food-item-header">
                <span>${food.name}</span>
                <span>${food.calories} cal</span>
            </div>
            <div class="food-item-details">
                <span class="food-category">${food.category}</span>
                <span>${food.portion}</span>
            </div>
        `;
        
        foodItem.addEventListener('click', () => selectFood(food, index));
        
        foodResultsDiv.appendChild(foodItem);
    });
}

function selectFood(food, index) {
    // Afficher les détails de l'aliment sélectionné
    selectedFoodName.textContent = food.name;
    selectedFoodCalories.textContent = food.calories;
    selectedFoodPortion.textContent = food.portion;
    dbFoodIndex.value = index;
    
    // Afficher le formulaire
    selectedFoodForm.style.display = 'block';
}

function addFoodFromDatabase(event) {
    event.preventDefault();
    
    // Utiliser la base de données globale si disponible
    let allFoods = window.foodsDatabase || foodsDatabase;
    
    const index = parseInt(dbFoodIndex.value);
    const food = allFoods[index];
    const quantity = parseInt(dbFoodQuantity.value);
    const mealType = dbMealType.value;
    
    if (!food) {
        console.error("Aliment non trouvé à l'index:", index);
        alert("Erreur: Aliment non trouvé. Veuillez réessayer.");
        return;
    }
    
    // Calculer les calories en fonction de la quantité
    // On suppose que les portions sont standardisées à 100g/ml
    const calories = Math.round(food.calories * (quantity / 100));
    
    // Ajouter l'entrée
    addFoodEntry(`${food.name} (${quantity}g/ml)`, calories, mealType);
    
    // Réinitialiser le formulaire
    dbFoodQuantity.value = '100';
    selectedFoodForm.style.display = 'none';
    
    // Changer d'onglet pour voir le journal mis à jour
    changeTab('manual-entry');
}

// Gestionnaires d'événements pour l'entrée manuelle
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

// Gestionnaires d'événements pour la base de données d'aliments
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        changeTab(tabId);
    });
});

foodSearchInput.addEventListener('input', searchFoods);
foodCategorySelect.addEventListener('change', searchFoods);
databaseFoodForm.addEventListener('submit', addFoodFromDatabase);

// Chargement de la base de données
function loadFoodDatabase() {
    console.log("Chargement de la base de données d'aliments...");
    if (window.foodsDatabase && Array.isArray(window.foodsDatabase)) {
        console.log(`Base de données globale chargée avec ${window.foodsDatabase.length} aliments`);
        foodsDatabase = window.foodsDatabase;
        // Afficher tous les aliments au chargement
        displayFoodResults(foodsDatabase);
    } else {
        console.error("La base de données globale n'est pas disponible ou n'est pas un tableau.");
    }
}

// Attendez que le DOM soit complètement chargé avant d'initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation de l'application...");
    
    // Initialiser l'interface utilisateur
    updateUI();
    
    // Vérifier si nous sommes dans l'onglet de la base de données d'aliments
    if (document.querySelector('[data-tab="food-database"]').classList.contains('active')) {
        // Charger la base de données
        loadFoodDatabase();
    }
    
    // Ajouter un gestionnaire pour l'onglet de la base de données
    document.querySelector('[data-tab="food-database"]').addEventListener('click', loadFoodDatabase);
});