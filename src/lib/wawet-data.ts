export type Category = "protein" | "veg" | "sides" | "misc";
export type MealKind = "family" | "kids";
export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type Ingredient = {
  id: string;
  name: string;
  category: Category;
};

export type Meal = {
  id: string;
  name: string;
  description: string;
  kind: MealKind;
  // Sparse by design: only ingredients the meal genuinely depends on.
  // A meal with an empty list is always eligible.
  ingredients: string[];
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "protein", label: "Proteins" },
  { id: "veg", label: "Veg" },
  { id: "sides", label: "Sides" },
  { id: "misc", label: "MISC" },
];

export const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const seededIngredients: Ingredient[] = [
  { id: "chicken", name: "Chicken", category: "protein" },
  { id: "fish", name: "Fish", category: "protein" },
  { id: "beef-mince", name: "Beef mince", category: "protein" },
  { id: "pork", name: "Pork", category: "protein" },
  { id: "beef-steak", name: "Beef steak", category: "protein" },
  { id: "breaded-chicken-steak", name: "Breaded chicken steak", category: "protein" },
  { id: "garden-peas", name: "Garden peas", category: "veg" },
  { id: "string-beans", name: "String beans", category: "veg" },
  { id: "broccoli", name: "Broccoli", category: "veg" },
  { id: "tomato", name: "Tomato", category: "veg" },
  { id: "cucumber", name: "Cucumber", category: "veg" },
  { id: "chips", name: "Chips", category: "sides" },
  { id: "wedges", name: "Wedges", category: "sides" },
  { id: "cheese-sticks", name: "Cheese sticks", category: "sides" },
  { id: "sweet-potato-fries", name: "Sweet potato fries", category: "sides" },
  { id: "mini-pizza", name: "Mini pizza", category: "misc" },
  { id: "breaded-mushrooms", name: "Breaded mushrooms", category: "misc" },
  { id: "pizza-pockets", name: "Pizza pockets", category: "misc" },
];

export const meals: Meal[] = [
  // Family pool ("takeaway-night" intentionally absent: takeaway is a day-mode, not a meal)
  { id: "spaghetti-night", name: "Spaghetti Night", description: "Silky tomato pasta with basil, parmesan, and warm garlic bread.", kind: "family", ingredients: [] },
  { id: "pizza-night", name: "Pizza Night", description: "Crisp stone-baked slices with rocket, mozzarella, and chili oil.", kind: "family", ingredients: [] },
  { id: "caesar-salad", name: "Caesar Salad", description: "Romaine, crunchy croutons, parmesan, and lemony chicken on top.", kind: "family", ingredients: ["chicken"] },
  { id: "steak-night", name: "Steak Night", description: "Seared steak with crispy potatoes, green beans, and peppercorn sauce.", kind: "family", ingredients: ["beef-steak"] },
  { id: "curry-night", name: "Curry Night", description: "Fragrant coconut curry with steamed rice and lots of fresh herbs.", kind: "family", ingredients: [] },
  { id: "fajita-night", name: "Fajita Night", description: "Sizzling peppers, onions, and juicy strips ready for the table.", kind: "family", ingredients: ["chicken"] },
  { id: "salmon-tray-bake", name: "Salmon Tray Bake", description: "Roasted salmon with lemon, asparagus, and baby potatoes.", kind: "family", ingredients: ["fish"] },
  { id: "burger-night", name: "Burger Night", description: "Juicy burgers, crispy fries, and a good excuse for extra sauce.", kind: "family", ingredients: ["beef-mince"] },
  { id: "lasagna-night", name: "Lasagna", description: "Layered, bubbling, and perfect with a big green salad.", kind: "family", ingredients: ["beef-mince"] },
  { id: "butter-chicken", name: "Butter Chicken", description: "Rich, creamy curry with naan and cucumber raita.", kind: "family", ingredients: ["chicken"] },
  { id: "soup-toasties", name: "Soup and Toasties", description: "Something cozy, simple, and gentle before the next week begins.", kind: "family", ingredients: [] },
  // Kids pool
  { id: "cheesy-pasta", name: "Cheesy Pasta", description: "Short pasta with a creamy cheese sauce and peas on the side.", kind: "kids", ingredients: [] },
  { id: "mini-pizzas", name: "Mini Pizzas", description: "Easy little pizzas with simple toppings and lots of melted cheese.", kind: "kids", ingredients: ["mini-pizza"] },
  { id: "chicken-nuggets", name: "Chicken Nuggets", description: "Crispy nuggets with oven fries, cucumber sticks, and ketchup.", kind: "kids", ingredients: [] },
  { id: "fish-fingers", name: "Fish Fingers", description: "Golden fish fingers with mash and sweetcorn.", kind: "kids", ingredients: [] },
  { id: "quesadilla", name: "Cheese Quesadilla", description: "Toasted tortilla wedges with mild cheese and tomato salsa.", kind: "kids", ingredients: [] },
  { id: "mac-cheese", name: "Mac and Cheese", description: "Creamy macaroni bake with a crunchy golden topping.", kind: "kids", ingredients: [] },
  { id: "sausage-mash", name: "Sausage and Mash", description: "Simple sausages with buttery mash and peas.", kind: "kids", ingredients: [] },
  { id: "pasta-bake", name: "Pasta Bake", description: "Baked pasta with tomato sauce, mozzarella, and garlic bread fingers.", kind: "kids", ingredients: [] },
  { id: "jacket-potato", name: "Jacket Potatoes", description: "Fluffy baked potatoes with beans and grated cheese.", kind: "kids", ingredients: [] },
  { id: "toasties", name: "Ham and Cheese Toasties", description: "Golden toasties with a little salad or veggie sticks on the side.", kind: "kids", ingredients: [] },
  { id: "rice-chicken", name: "Chicken and Rice", description: "Soft rice with little chicken pieces and sweetcorn.", kind: "kids", ingredients: ["chicken"] },
];

export const familyMeals = meals.filter((m) => m.kind === "family");
export const kidsMeals = meals.filter((m) => m.kind === "kids");

export const mealById: Record<string, Meal> = Object.fromEntries(
  meals.map((m) => [m.id, m]),
);
