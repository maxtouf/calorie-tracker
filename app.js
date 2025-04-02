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
const databaseFoodForm = document.getElementById('database-food-form');

// Initialiser la date d'aujourd'hui pour le filtre
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
if (filterDateInput) {
    filterDateInput.value = formattedDate;
}

// État de l'application
let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || [];
let calorieGoal = parseInt(localStorage.getItem('calorieGoal')) || 2000;

// Mettre à jour l'objectif affiché
if (calorieGoalSpan) {
    calorieGoalSpan.textContent = calorieGoal;
}

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
    // Vérifier si l'élément existe
    if (!caloriesChart) return;
    
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
}

function searchFoods() {
    const searchTerm = foodSearchInput.value.toLowerCase();
    const category = foodCategorySelect.value;
    
    // S'assurer que la base de données est disponible
    if (!window.foodsDatabase || !Array.isArray(window.foodsDatabase)) {
        console.error("La base de données d'aliments n'est pas disponible");
        return;
    }
    
    // Filtrer les aliments
    let filteredFoods = window.foodsDatabase;
    
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
    if (!foodResultsDiv) return;
    
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
        
        foodItem.addEventListener('click', function() {
            // Afficher le formulaire de sélection
            const selectedFoodForm = document.getElementById('selected-food-form');
            const selectedFoodName = document.getElementById('selected-food-name');
            const selectedFoodCalories = document.getElementById('selected-food-calories');
            const selectedFoodPortion = document.getElementById('selected-food-portion');
            const dbFoodIndex = document.getElementById('db-food-index');
            
            selectedFoodName.textContent = food.name;
            selectedFoodCalories.textContent = food.calories;
            selectedFoodPortion.textContent = food.portion;
            dbFoodIndex.value = index;
            
            selectedFoodForm.style.display = 'block';
        });
        
        foodResultsDiv.appendChild(foodItem);
    });
}

// Événements du formulaire manuel
if (foodForm) {
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
}

// Événements pour le journal alimentaire
if (foodEntriesDiv) {
    foodEntriesDiv.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteFoodEntry(id);
        }
    });
}

// Événement pour la date de filtrage
if (filterDateInput) {
    filterDateInput.addEventListener('change', updateUI);
}

// Événement pour modifier l'objectif
if (editGoalBtn) {
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
}

// Événements pour les onglets
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        changeTab(tabId);
    });
});

// Événements pour la recherche d'aliments
if (foodSearchInput) {
    foodSearchInput.addEventListener('input', searchFoods);
}

if (foodCategorySelect) {
    foodCategorySelect.addEventListener('change', searchFoods);
}

// Événement pour ajouter un aliment depuis la base de données
if (databaseFoodForm) {
    databaseFoodForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dbFoodIndex = document.getElementById('db-food-index');
        const dbFoodQuantity = document.getElementById('db-food-quantity');
        const dbMealType = document.getElementById('db-meal-type');
        
        const index = parseInt(dbFoodIndex.value);
        const quantity = parseInt(dbFoodQuantity.value);
        const mealType = dbMealType.value;
        
        // Vérifier que la base de données est disponible
        if (!window.foodsDatabase || !Array.isArray(window.foodsDatabase)) {
            console.error("La base de données d'aliments n'est pas disponible");
            return;
        }
        
        const food = window.foodsDatabase[index];
        
        if (!food) {
            console.error("Aliment non trouvé à l'index:", index);
            alert("Erreur: Aliment non trouvé. Veuillez réessayer.");
            return;
        }
        
        // Calculer les calories en fonction de la quantité
        const calories = Math.round(food.calories * (quantity / 100));
        
        // Ajouter l'entrée
        addFoodEntry(`${food.name} (${quantity}g/ml)`, calories, mealType);
        
        // Réinitialiser le formulaire
        dbFoodQuantity.value = '100';
        document.getElementById('selected-food-form').style.display = 'none';
        
        // Changer d'onglet pour voir le journal mis à jour
        changeTab('manual-entry');
    });
}

// Initialiser l'interface
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation de l'interface utilisateur");
    updateUI();
});