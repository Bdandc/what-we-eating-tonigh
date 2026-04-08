const seededMeals = {
  family: [
    {
      id: "spaghetti-night",
      name: "Spaghetti Night",
      description: "Silky tomato pasta with basil, parmesan, and warm garlic bread.",
    },
    {
      id: "pizza-night",
      name: "Pizza Night",
      description: "Crisp stone-baked slices with rocket, mozzarella, and chili oil.",
    },
    {
      id: "caesar-salad",
      name: "Caesar Salad",
      description: "Romaine, crunchy croutons, parmesan, and lemony chicken on top.",
    },
    {
      id: "takeaway-night",
      name: "Takeaway Night",
      description: "A low-effort night for grabbing your favorite delivery and switching off.",
    },
    {
      id: "steak-night",
      name: "Steak Night",
      description: "Seared steak with crispy potatoes, green beans, and peppercorn sauce.",
    },
    {
      id: "curry-night",
      name: "Curry Night",
      description: "Fragrant coconut curry with steamed rice and lots of fresh herbs.",
    },
    {
      id: "fajita-night",
      name: "Fajita Night",
      description: "Sizzling peppers, onions, and juicy strips ready for the table.",
    },
    {
      id: "salmon-tray-bake",
      name: "Salmon Tray Bake",
      description: "Roasted salmon with lemon, asparagus, and baby potatoes.",
    },
    {
      id: "burger-night",
      name: "Burger Night",
      description: "Juicy burgers, crispy fries, and a good excuse for extra sauce.",
    },
    {
      id: "lasagna-night",
      name: "Lasagna",
      description: "Layered, bubbling, and perfect with a big green salad.",
    },
    {
      id: "butter-chicken",
      name: "Butter Chicken",
      description: "Rich, creamy curry with naan and cucumber raita.",
    },
    {
      id: "soup-toasties",
      name: "Soup and Toasties",
      description: "Something cozy, simple, and gentle before the next week begins.",
    },
  ],
  kids: [
    {
      id: "cheesy-pasta",
      name: "Cheesy Pasta",
      description: "Short pasta with a creamy cheese sauce and peas on the side.",
    },
    {
      id: "mini-pizzas",
      name: "Mini Pizzas",
      description: "Easy little pizzas with simple toppings and lots of melted cheese.",
    },
    {
      id: "chicken-nuggets",
      name: "Chicken Nuggets",
      description: "Crispy nuggets with oven fries, cucumber sticks, and ketchup.",
    },
    {
      id: "fish-fingers",
      name: "Fish Fingers",
      description: "Golden fish fingers with mash and sweetcorn.",
    },
    {
      id: "quesadilla",
      name: "Cheese Quesadilla",
      description: "Toasted tortilla wedges with mild cheese and tomato salsa.",
    },
    {
      id: "mac-cheese",
      name: "Mac and Cheese",
      description: "Creamy macaroni bake with a crunchy golden topping.",
    },
    {
      id: "sausage-mash",
      name: "Sausage and Mash",
      description: "Simple sausages with buttery mash and peas.",
    },
    {
      id: "pasta-bake",
      name: "Pasta Bake",
      description: "Baked pasta with tomato sauce, mozzarella, and garlic bread fingers.",
    },
    {
      id: "jacket-potato",
      name: "Jacket Potatoes",
      description: "Fluffy baked potatoes with beans and grated cheese.",
    },
    {
      id: "toasties",
      name: "Ham and Cheese Toasties",
      description: "Golden toasties with a little salad or veggie sticks on the side.",
    },
    {
      id: "rice-chicken",
      name: "Chicken and Rice",
      description: "Soft rice with little chicken pieces and sweetcorn.",
    },
  ],
};

const weekPlan = [
  {
    day: "Monday",
    familyMealIds: ["spaghetti-night", "pizza-night", "caesar-salad", "lasagna-night", "burger-night"],
    kidsMealIds: ["cheesy-pasta", "mini-pizzas", "mac-cheese", "pasta-bake"],
  },
  {
    day: "Tuesday",
    familyMealIds: ["takeaway-night", "burger-night", "pizza-night", "fajita-night", "caesar-salad"],
    kidsMealIds: ["chicken-nuggets", "mini-pizzas", "fish-fingers", "jacket-potato"],
  },
  {
    day: "Wednesday",
    familyMealIds: ["steak-night", "salmon-tray-bake", "butter-chicken", "curry-night", "lasagna-night"],
    kidsMealIds: ["sausage-mash", "chicken-nuggets", "rice-chicken", "mac-cheese"],
  },
  {
    day: "Thursday",
    familyMealIds: ["curry-night", "fajita-night", "spaghetti-night", "salmon-tray-bake", "butter-chicken"],
    kidsMealIds: ["quesadilla", "cheesy-pasta", "chicken-nuggets", "rice-chicken"],
  },
  {
    day: "Friday",
    familyMealIds: ["pizza-night", "burger-night", "takeaway-night", "lasagna-night", "caesar-salad"],
    kidsMealIds: ["mini-pizzas", "fish-fingers", "chicken-nuggets", "mac-cheese"],
  },
  {
    day: "Saturday",
    familyMealIds: ["lasagna-night", "butter-chicken", "steak-night", "salmon-tray-bake", "pizza-night"],
    kidsMealIds: ["pasta-bake", "sausage-mash", "mini-pizzas", "jacket-potato"],
  },
  {
    day: "Sunday",
    familyMealIds: ["soup-toasties", "spaghetti-night", "curry-night", "caesar-salad", "takeaway-night"],
    kidsMealIds: ["toasties", "cheesy-pasta", "fish-fingers", "jacket-potato"],
  },
];

const storageKey = "dinner-time-state-v3";
const maxShuffles = 3;

const mealGrid = document.querySelector("#meal-grid");
const template = document.querySelector("#day-card-template");
const libraryItemTemplate = document.querySelector("#library-item-template");
const resetButton = document.querySelector("#reset-button");
const todayTitle = document.querySelector("#today-title");
const todayDescription = document.querySelector("#today-description");
const familyLibrary = document.querySelector("#family-library");
const kidsLibrary = document.querySelector("#kids-library");
const libraryDrawer = document.querySelector("#library-drawer");
const drawerOverlay = document.querySelector("#drawer-overlay");
const openDrawerButton = document.querySelector("#open-drawer-button");
const closeDrawerButton = document.querySelector("#close-drawer-button");
const favoriteForm = document.querySelector("#favorite-form");
const mealTypeInput = document.querySelector("#meal-type");
const mealNameInput = document.querySelector("#meal-name-input");
const mealDescriptionInput = document.querySelector("#meal-description-input");
const shuffleIconMarkup = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M17 3h4v4"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M3 7h5l4 5 4 5h5"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M17 17h4v4"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M3 17h5l2-2"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path
      d="M14 10l2-2h5"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
`;

const initialDayState = weekPlan.reduce((accumulator, item) => {
  accumulator[item.day] = {
    familyMealId: item.familyMealIds[0],
    kidsMealId: item.kidsMealIds[0],
    useKidsMeal: false,
    familyShufflesUsed: 0,
    kidsShufflesUsed: 0,
  };

  return accumulator;
}, {});

function getTodayName() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function getAllMeals(type) {
  return [...seededMeals[type], ...appState.customMeals[type]];
}

function buildMealLookup() {
  return {
    family: Object.fromEntries(getAllMeals("family").map((meal) => [meal.id, meal])),
    kids: Object.fromEntries(getAllMeals("kids").map((meal) => [meal.id, meal])),
  };
}

function buildCustomMealIds(type) {
  return appState.customMeals[type].map((meal) => meal.id);
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  const todayStamp = new Date().toDateString();

  if (!saved) {
    return {
      lastUpdated: todayStamp,
      customMeals: {
        family: [],
        kids: [],
      },
      days: structuredClone(initialDayState),
    };
  }

  try {
    const parsed = JSON.parse(saved);

    return {
      lastUpdated: parsed.lastUpdated === todayStamp ? todayStamp : todayStamp,
      customMeals: {
        family: parsed.customMeals?.family ?? [],
        kids: parsed.customMeals?.kids ?? [],
      },
      days:
        parsed.lastUpdated === todayStamp
          ? {
              ...structuredClone(initialDayState),
              ...parsed.days,
            }
          : structuredClone(initialDayState),
    };
  } catch (error) {
    return {
      lastUpdated: todayStamp,
      customMeals: {
        family: [],
        kids: [],
      },
      days: structuredClone(initialDayState),
    };
  }
}

let appState = loadState();
let mealLookup = buildMealLookup();

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(appState));
}

function refreshMeals() {
  mealLookup = buildMealLookup();
}

function getMealById(type, mealId) {
  return mealLookup[type][mealId];
}

function getRandomMealId(mealIds, currentMealId) {
  const uniqueIds = [...new Set(mealIds)];
  const choices = uniqueIds.filter((mealId) => mealId !== currentMealId);

  if (choices.length === 0) {
    return currentMealId;
  }

  return choices[Math.floor(Math.random() * choices.length)];
}

function getMealSuggestions(dayConfig, currentMealId) {
  const extraIds = buildCustomMealIds("family");

  return [...new Set([...dayConfig.familyMealIds, ...extraIds])]
    .filter((mealId) => mealId !== currentMealId)
    .slice(0, 3)
    .map((mealId) => getMealById("family", mealId)?.name.replace(" Night", ""))
    .filter(Boolean);
}

function updateTodayCard() {
  const todayName = getTodayName();
  const todayState = appState.days[todayName];
  const todayConfig = weekPlan.find((item) => item.day === todayName);

  if (!todayState || !todayConfig) {
    todayTitle.textContent = "Weekend planning time";
    todayDescription.textContent = "Your next dinner choice will show up here.";
    return;
  }

  const familyMeal = getMealById("family", todayState.familyMealId);
  const suggestions = getMealSuggestions(todayConfig, todayState.familyMealId);

  todayTitle.textContent = familyMeal?.name ?? "Dinner idea";
  todayDescription.textContent =
    suggestions.length > 0 ? `Maybe order ${suggestions.join(", ")}.` : "Pick something easy tonight.";
}

function renderLibrary(container, meals) {
  container.innerHTML = "";

  meals.forEach((meal) => {
    const fragment = libraryItemTemplate.content.cloneNode(true);
    const name = fragment.querySelector(".library-item-name");
    const description = fragment.querySelector(".library-item-description");

    name.textContent = meal.name;
    description.textContent = meal.description;
    container.appendChild(fragment);
  });
}

function renderAllLibraries() {
  renderLibrary(familyLibrary, getAllMeals("family"));
  renderLibrary(kidsLibrary, getAllMeals("kids"));
}

function renderPlanner() {
  mealGrid.innerHTML = "";
  const todayName = getTodayName();

  weekPlan.forEach((dayConfig) => {
    const stateForDay = appState.days[dayConfig.day];
    const fragment = template.content.cloneNode(true);
    const dayCard = fragment.querySelector(".day-card");
    const dayName = fragment.querySelector(".day-name");
    const mealName = fragment.querySelector(".meal-name");
    const mealDescription = fragment.querySelector(".meal-description");
    const kidsMealName = fragment.querySelector(".kids-meal-name");
    const kidsMealDescription = fragment.querySelector(".kids-meal-description");
    const kidsPanel = fragment.querySelector(".kids-panel");
    const kidsToggleInput = fragment.querySelector(".kids-toggle-input");
    const familyCount = fragment.querySelector(".family-count");
    const kidsCount = fragment.querySelector(".kids-count");
    const familyShuffleButton = fragment.querySelector(".family-shuffle-button");
    const kidsShuffleButton = fragment.querySelector(".kids-shuffle-button");
    const familyMeal = getMealById("family", stateForDay.familyMealId);
    const kidsMeal = getMealById("kids", stateForDay.kidsMealId);

    familyShuffleButton.innerHTML = shuffleIconMarkup;
    kidsShuffleButton.innerHTML = shuffleIconMarkup;

    dayName.textContent = dayConfig.day;
    mealName.textContent = familyMeal?.name ?? "Choose a family meal";
    mealDescription.textContent = familyMeal?.description ?? "";
    kidsToggleInput.checked = Boolean(stateForDay.useKidsMeal);
    familyCount.textContent = `${stateForDay.familyShufflesUsed}/${maxShuffles}`;

    if (stateForDay.useKidsMeal) {
      kidsPanel.classList.remove("is-disabled");
      kidsMealName.textContent = kidsMeal?.name ?? "Choose a kids meal";
      kidsMealDescription.textContent = kidsMeal?.description ?? "";
      kidsCount.textContent = `${stateForDay.kidsShufflesUsed}/${maxShuffles}`;
    } else {
      kidsPanel.classList.add("is-disabled");
      kidsMealName.textContent = "Same as family dinner";
      kidsMealDescription.textContent = "Kids will have what the parents are having tonight.";
      kidsCount.textContent = "";
    }

    if (dayConfig.day === todayName) {
      dayCard.classList.add("is-today");
    }

    if (stateForDay.familyShufflesUsed >= maxShuffles) {
      familyShuffleButton.disabled = true;
      familyShuffleButton.title = "No family shuffles left";
      familyShuffleButton.setAttribute("aria-label", "No family shuffles left");
    } else {
      familyShuffleButton.disabled = false;
      familyShuffleButton.title = "Shuffle family meal";
      familyShuffleButton.setAttribute("aria-label", "Shuffle family meal");
    }

    if (stateForDay.useKidsMeal && stateForDay.kidsShufflesUsed >= maxShuffles) {
      kidsShuffleButton.disabled = true;
      kidsShuffleButton.title = "No kids shuffles left";
      kidsShuffleButton.setAttribute("aria-label", "No kids shuffles left");
    } else {
      kidsShuffleButton.disabled = false;
      kidsShuffleButton.title = "Shuffle kids meal";
      kidsShuffleButton.setAttribute("aria-label", "Shuffle kids meal");
    }

    familyShuffleButton.addEventListener("click", () => {
      const dayState = appState.days[dayConfig.day];

      if (dayState.familyShufflesUsed >= maxShuffles) {
        return;
      }

      const familyPool = [...dayConfig.familyMealIds, ...buildCustomMealIds("family")];
      dayState.familyMealId = getRandomMealId(familyPool, dayState.familyMealId);
      dayState.familyShufflesUsed += 1;
      appState.lastUpdated = new Date().toDateString();
      persistState();
      renderPlanner();
      updateTodayCard();
    });

    kidsShuffleButton.addEventListener("click", () => {
      const dayState = appState.days[dayConfig.day];

      if (!dayState.useKidsMeal || dayState.kidsShufflesUsed >= maxShuffles) {
        return;
      }

      const kidsPool = [...dayConfig.kidsMealIds, ...buildCustomMealIds("kids")];
      dayState.kidsMealId = getRandomMealId(kidsPool, dayState.kidsMealId);
      dayState.kidsShufflesUsed += 1;
      appState.lastUpdated = new Date().toDateString();
      persistState();
      renderPlanner();
    });

    kidsToggleInput.addEventListener("change", () => {
      const dayState = appState.days[dayConfig.day];
      dayState.useKidsMeal = kidsToggleInput.checked;
      appState.lastUpdated = new Date().toDateString();
      persistState();
      renderPlanner();
    });

    mealGrid.appendChild(fragment);
  });
}

function openDrawer() {
  libraryDrawer.classList.add("is-open");
  libraryDrawer.setAttribute("aria-hidden", "false");
  drawerOverlay.hidden = false;
}

function closeDrawer() {
  libraryDrawer.classList.remove("is-open");
  libraryDrawer.setAttribute("aria-hidden", "true");
  drawerOverlay.hidden = true;
}

function addFavoriteMeal(type, name, description) {
  const baseId = slugify(name) || `meal-${Date.now()}`;
  let nextId = baseId;
  let counter = 2;

  while (mealLookup[type][nextId]) {
    nextId = `${baseId}-${counter}`;
    counter += 1;
  }

  appState.customMeals[type].unshift({
    id: nextId,
    name: name.trim(),
    description: description.trim(),
  });

  refreshMeals();
  persistState();
  renderAllLibraries();
  renderPlanner();
  updateTodayCard();
}

openDrawerButton.addEventListener("click", openDrawer);
closeDrawerButton.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

favoriteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = mealTypeInput.value;
  const name = mealNameInput.value.trim();
  const description = mealDescriptionInput.value.trim();

  if (!name || !description) {
    return;
  }

  addFavoriteMeal(type, name, description);
  favoriteForm.reset();
  mealTypeInput.value = type;
});

resetButton.addEventListener("click", () => {
  appState = {
    ...appState,
    lastUpdated: new Date().toDateString(),
    days: structuredClone(initialDayState),
  };

  persistState();
  renderPlanner();
  updateTodayCard();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && libraryDrawer.classList.contains("is-open")) {
    closeDrawer();
  }
});

renderAllLibraries();
renderPlanner();
updateTodayCard();
