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
  // Hero items only: the things you would actually be missing, not a recipe.
  // Matching is an AND, so every id listed must be ticked for the meal to
  // qualify. Keep this to 1-3 items or the meal will almost never appear.
  // Store-cupboard staples (oil, flour, onions, garlic, stock, herbs) are
  // assumed present and deliberately absent from the pantry.
  ingredients: string[];
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "protein", label: "Proteins" },
  { id: "veg", label: "Veg" },
  { id: "sides", label: "Carbs & sides" },
  { id: "misc", label: "Dairy & tins" },
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

/**
 * Every item here gates at least one meal. If you add one, add a meal that
 * needs it, or it becomes a tick that does nothing. `npm run check:catalogue`
 * enforces that, plus the reverse: no meal may reference an unknown id.
 *
 * Ids from the original list are preserved wherever the item survived, so an
 * existing user's ticks carry over.
 */
export const seededIngredients: Ingredient[] = [
  // Proteins
  { id: "chicken", name: "Chicken", category: "protein" },
  { id: "beef-mince", name: "Beef mince", category: "protein" },
  { id: "beef-steak", name: "Steak", category: "protein" },
  { id: "pork", name: "Pork", category: "protein" },
  { id: "sausages", name: "Sausages", category: "protein" },
  { id: "bacon", name: "Bacon", category: "protein" },
  { id: "fish", name: "White fish", category: "protein" },
  { id: "salmon", name: "Salmon", category: "protein" },
  { id: "prawns", name: "Prawns", category: "protein" },
  { id: "eggs", name: "Eggs", category: "protein" },
  { id: "tinned-tuna", name: "Tinned tuna", category: "protein" },
  { id: "chickpeas", name: "Chickpeas", category: "protein" },
  { id: "lentils", name: "Lentils", category: "protein" },
  { id: "breaded-chicken-steak", name: "Breaded chicken steak", category: "protein" },
  { id: "chicken-nuggets-item", name: "Chicken nuggets", category: "protein" },
  { id: "fish-fingers-item", name: "Fish fingers", category: "protein" },

  // Veg
  { id: "peppers", name: "Peppers", category: "veg" },
  { id: "mushrooms", name: "Mushrooms", category: "veg" },
  { id: "broccoli", name: "Broccoli", category: "veg" },
  { id: "carrots", name: "Carrots", category: "veg" },
  { id: "garden-peas", name: "Peas", category: "veg" },
  { id: "sweetcorn", name: "Sweetcorn", category: "veg" },
  { id: "string-beans", name: "Green beans", category: "veg" },
  { id: "tomato", name: "Tomatoes", category: "veg" },
  { id: "cucumber", name: "Cucumber", category: "veg" },
  { id: "lettuce", name: "Salad leaves", category: "veg" },

  // Carbs & sides
  { id: "pasta", name: "Pasta", category: "sides" },
  { id: "rice", name: "Rice", category: "sides" },
  { id: "noodles", name: "Noodles", category: "sides" },
  { id: "potatoes", name: "Potatoes", category: "sides" },
  { id: "chips", name: "Oven chips", category: "sides" },
  { id: "wedges", name: "Wedges", category: "sides" },
  { id: "sweet-potato", name: "Sweet potato", category: "sides" },
  { id: "bread", name: "Bread", category: "sides" },
  { id: "wraps", name: "Wraps", category: "sides" },

  // Dairy & tins
  { id: "cheese", name: "Cheese", category: "misc" },
  { id: "mozzarella", name: "Mozzarella", category: "misc" },
  { id: "cream", name: "Cream", category: "misc" },
  { id: "tinned-tomatoes", name: "Tinned tomatoes", category: "misc" },
  { id: "baked-beans", name: "Baked beans", category: "misc" },
  { id: "coconut-milk", name: "Coconut milk", category: "misc" },
  { id: "mini-pizza", name: "Mini pizza bases", category: "misc" },
];

/**
 * Items most kitchens have on a normal week: cupboard, freezer, and fridge
 * basics. These start TICKED on first run so the pantry is useful before the
 * user has touched it; everything else starts unticked. Fresh meat/fish and
 * the more specific bits stay off so the first suggestions stay realistic.
 */
export const LIKELY_STOCKED: string[] = [
  "eggs",
  "cheese",
  "pasta",
  "rice",
  "potatoes",
  "bread",
  "chips",
  "garden-peas",
  "tinned-tomatoes",
  "baked-beans",
];

export const meals: Meal[] = [
  // -------------------------------------------------------------------------
  // Family pool. "Takeaway" is intentionally absent: it is a day-mode, not a
  // meal. Every meal names at least one hero item, so the pantry always has an
  // effect and the "nothing matches" fallback notice means something.
  // -------------------------------------------------------------------------
  { id: "spaghetti-bolognese", name: "Spaghetti Bolognese", description: "Slow-cooked mince ragu, plenty of parmesan, garlic bread on the side.", kind: "family", ingredients: ["beef-mince", "pasta"] },
  { id: "lasagna-night", name: "Lasagna", description: "Layered, bubbling, and perfect with a big green salad.", kind: "family", ingredients: ["beef-mince", "pasta", "cheese"] },
  { id: "chilli-con-carne", name: "Chilli con Carne", description: "Smoky, slow-simmered chilli over rice with soured cream.", kind: "family", ingredients: ["beef-mince", "rice"] },
  { id: "burger-night", name: "Burger Night", description: "Juicy burgers, crisp fries, and a good excuse for extra sauce.", kind: "family", ingredients: ["beef-mince", "bread"] },
  { id: "cottage-pie", name: "Cottage Pie", description: "Rich mince under a golden mash lid. Proper cold-weather food.", kind: "family", ingredients: ["beef-mince", "potatoes"] },
  { id: "beef-tacos", name: "Beef Tacos", description: "Spiced mince, warm wraps, and everyone builds their own.", kind: "family", ingredients: ["beef-mince", "wraps"] },
  { id: "steak-night", name: "Steak Night", description: "Seared steak with crispy potatoes, green beans, and peppercorn sauce.", kind: "family", ingredients: ["beef-steak", "potatoes", "string-beans"] },
  { id: "beef-stir-fry", name: "Beef Stir-fry", description: "Fast wok beef with peppers and noodles in a sticky sauce.", kind: "family", ingredients: ["beef-steak", "noodles", "peppers"] },
  { id: "roast-chicken", name: "Roast Chicken", description: "The full works: roast potatoes, carrots, and far too much gravy.", kind: "family", ingredients: ["chicken", "potatoes", "carrots"] },
  { id: "butter-chicken", name: "Butter Chicken", description: "Rich, creamy curry with rice and cucumber raita.", kind: "family", ingredients: ["chicken", "rice"] },
  { id: "thai-green-curry", name: "Thai Green Curry", description: "Fragrant coconut curry with steamed rice and lots of fresh herbs.", kind: "family", ingredients: ["chicken", "coconut-milk", "rice"] },
  { id: "chicken-fajitas", name: "Chicken Fajitas", description: "Sizzling peppers, charred chicken, and warm wraps for the table.", kind: "family", ingredients: ["chicken", "peppers", "wraps"] },
  { id: "caesar-salad", name: "Caesar Salad", description: "Crunchy leaves, croutons, parmesan, and lemony chicken on top.", kind: "family", ingredients: ["chicken", "lettuce"] },
  { id: "chicken-stir-fry", name: "Chicken Stir-fry", description: "Everything in one wok, on the table in fifteen minutes.", kind: "family", ingredients: ["chicken", "noodles", "peppers"] },
  { id: "katsu-curry", name: "Katsu Curry", description: "Crisp breaded chicken, mild golden sauce, and steamed rice.", kind: "family", ingredients: ["breaded-chicken-steak", "rice"] },
  { id: "chicken-steak-chips", name: "Chicken Steak and Chips", description: "Breaded chicken steak, oven chips, and whichever sauce wins.", kind: "family", ingredients: ["breaded-chicken-steak", "chips"] },
  { id: "salmon-tray-bake", name: "Salmon Tray Bake", description: "Roasted salmon with lemon and baby potatoes. One tin to wash.", kind: "family", ingredients: ["salmon", "potatoes"] },
  { id: "teriyaki-salmon", name: "Teriyaki Salmon", description: "Sticky glazed salmon with rice and steamed broccoli.", kind: "family", ingredients: ["salmon", "rice", "broccoli"] },
  { id: "fish-and-chips", name: "Fish and Chips", description: "Friday sorted. Crisp fish, oven chips, and mushy peas.", kind: "family", ingredients: ["fish", "chips", "garden-peas"] },
  { id: "fish-pie", name: "Fish Pie", description: "Creamy fish under mash, browned at the edges.", kind: "family", ingredients: ["fish", "potatoes"] },
  { id: "prawn-linguine", name: "Prawn Linguine", description: "Garlic prawns, chilli, tomatoes, and a lot of lemon.", kind: "family", ingredients: ["prawns", "pasta", "tomato"] },
  { id: "prawn-noodles", name: "Prawn Noodles", description: "Quick prawn noodles with spring onion and sesame.", kind: "family", ingredients: ["prawns", "noodles"] },
  { id: "sausage-and-mash", name: "Sausage and Mash", description: "Buttery mash, proper onion gravy, peas on the side.", kind: "family", ingredients: ["sausages", "potatoes", "garden-peas"] },
  { id: "toad-in-the-hole", name: "Toad in the Hole", description: "Sausages in a tall, crisp batter. Gravy is not optional.", kind: "family", ingredients: ["sausages", "eggs"] },
  { id: "sausage-pasta-bake", name: "Sausage Pasta Bake", description: "Sausage meat, tomato sauce, and baked pasta with a crisp top.", kind: "family", ingredients: ["sausages", "pasta", "tinned-tomatoes"] },
  { id: "carbonara", name: "Carbonara", description: "Eggs, bacon, black pepper. No cream, no arguments.", kind: "family", ingredients: ["bacon", "pasta", "eggs"] },
  { id: "breakfast-for-dinner", name: "Breakfast for Dinner", description: "Bacon, eggs, beans, and toast. Perfectly acceptable at 7pm.", kind: "family", ingredients: ["bacon", "eggs", "baked-beans"] },
  { id: "broccoli-bacon-pasta", name: "Broccoli and Bacon Pasta", description: "Salty bacon, soft broccoli, and a glossy pan sauce.", kind: "family", ingredients: ["bacon", "broccoli", "pasta"] },
  { id: "blt", name: "BLT Night", description: "Crisp bacon, cold lettuce, thick bread. Stack them high.", kind: "family", ingredients: ["bacon", "bread", "lettuce"] },
  { id: "pork-chops", name: "Pork Chops", description: "Pan-fried chops with apple sauce and crushed potatoes.", kind: "family", ingredients: ["pork", "potatoes"] },
  { id: "sweet-sour-pork", name: "Sweet and Sour Pork", description: "Sticky pork with peppers and pineapple over rice.", kind: "family", ingredients: ["pork", "rice", "peppers"] },
  { id: "pizza-night", name: "Pizza Night", description: "Stone-baked, mozzarella pulled to the edges, chilli oil on top.", kind: "family", ingredients: ["mozzarella", "tinned-tomatoes"] },
  { id: "creamy-mushroom-pasta", name: "Creamy Mushroom Pasta", description: "Garlicky mushrooms, cream, and a shower of parmesan.", kind: "family", ingredients: ["mushrooms", "cream", "pasta"] },
  { id: "mushroom-risotto", name: "Mushroom Risotto", description: "Slow-stirred, deeply savoury, worth standing at the hob for.", kind: "family", ingredients: ["mushrooms", "rice"] },
  { id: "chickpea-curry", name: "Chickpea and Sweet Potato Curry", description: "Warm, spiced, and better the next day.", kind: "family", ingredients: ["chickpeas", "sweet-potato", "rice"] },
  { id: "dhal", name: "Dhal", description: "Soft spiced lentils with rice and a spoon of yoghurt.", kind: "family", ingredients: ["lentils", "rice"] },
  { id: "shakshuka", name: "Shakshuka", description: "Eggs baked into spiced peppers and tomatoes. Bread for dipping.", kind: "family", ingredients: ["eggs", "tinned-tomatoes", "peppers"] },
  { id: "omelette", name: "Omelette Night", description: "Folded, cheesy, and faster than the delivery app.", kind: "family", ingredients: ["eggs", "cheese"] },
  { id: "egg-fried-rice", name: "Egg Fried Rice", description: "Yesterday's rice, today's dinner. Soy, sesame, spring onion.", kind: "family", ingredients: ["eggs", "rice"] },
  { id: "tuna-pasta-bake", name: "Tuna Pasta Bake", description: "Storecupboard hero. Creamy, cheesy, gone in minutes.", kind: "family", ingredients: ["tinned-tuna", "pasta", "cheese"] },
  { id: "tuna-melt", name: "Tuna Melt", description: "Toasted, cheesy, and better than it has any right to be.", kind: "family", ingredients: ["tinned-tuna", "bread", "cheese"] },
  { id: "jacket-potatoes", name: "Jacket Potatoes", description: "Crisp skins, fluffy middles, beans and cheese piled on.", kind: "family", ingredients: ["potatoes", "cheese", "baked-beans"] },
  { id: "loaded-wedges", name: "Loaded Wedges", description: "Wedges under melted cheese with soured cream and spring onion.", kind: "family", ingredients: ["wedges", "cheese"] },
  { id: "greek-salad", name: "Greek Salad", description: "Tomato, cucumber, olives, and a thick slab of feta.", kind: "family", ingredients: ["cucumber", "tomato", "lettuce"] },
  { id: "soup-toasties", name: "Soup and Toasties", description: "Something cosy and simple before the next week begins.", kind: "family", ingredients: ["bread", "cheese"] },
  { id: "sweetcorn-chowder", name: "Sweetcorn Chowder", description: "Thick, sweet, and creamy with plenty of black pepper.", kind: "family", ingredients: ["sweetcorn", "potatoes", "cream"] },

  // -------------------------------------------------------------------------
  // Kids pool
  // -------------------------------------------------------------------------
  { id: "chicken-nuggets", name: "Nuggets and Chips", description: "Crispy nuggets, oven chips, cucumber sticks, and ketchup.", kind: "kids", ingredients: ["chicken-nuggets-item", "chips"] },
  { id: "nuggets-sweet-potato", name: "Nuggets and Sweet Potato Fries", description: "The same favourite, orange edition.", kind: "kids", ingredients: ["chicken-nuggets-item", "sweet-potato"] },
  { id: "fish-fingers", name: "Fish Fingers and Mash", description: "Golden fish fingers with buttery mash and sweetcorn.", kind: "kids", ingredients: ["fish-fingers-item", "potatoes", "sweetcorn"] },
  { id: "cheesy-pasta", name: "Cheesy Pasta", description: "Short pasta in a creamy cheese sauce. The reliable one.", kind: "kids", ingredients: ["pasta", "cheese"] },
  { id: "mac-cheese", name: "Mac and Cheese", description: "Creamy macaroni bake with a crunchy golden top.", kind: "kids", ingredients: ["pasta", "cheese"] },
  { id: "pasta-bake", name: "Pasta Bake", description: "Baked pasta, tomato sauce, and a mozzarella lid.", kind: "kids", ingredients: ["pasta", "tinned-tomatoes", "mozzarella"] },
  { id: "mini-pizzas", name: "Mini Pizzas", description: "Little pizzas with simple toppings and lots of melted cheese.", kind: "kids", ingredients: ["mini-pizza", "mozzarella"] },
  { id: "sausage-mash-kids", name: "Sausage and Mash", description: "Simple sausages with buttery mash and peas.", kind: "kids", ingredients: ["sausages", "potatoes"] },
  { id: "sausages-beans-chips", name: "Sausages, Beans and Chips", description: "The classic plate. No notes.", kind: "kids", ingredients: ["sausages", "baked-beans", "chips"] },
  { id: "beans-on-toast", name: "Beans on Toast", description: "Thick toast, hot beans, cheese on top if it is that kind of day.", kind: "kids", ingredients: ["baked-beans", "bread"] },
  { id: "toasties", name: "Cheese Toasties", description: "Golden toasties with veggie sticks on the side.", kind: "kids", ingredients: ["bread", "cheese"] },
  { id: "quesadilla", name: "Cheese Quesadilla", description: "Toasted wrap wedges with mild cheese and a little salsa.", kind: "kids", ingredients: ["wraps", "cheese"] },
  { id: "rice-chicken", name: "Chicken and Rice", description: "Soft rice with little chicken pieces and sweetcorn.", kind: "kids", ingredients: ["chicken", "rice", "sweetcorn"] },
  { id: "chicken-wrap", name: "Chicken Wrap", description: "Warm wrap, chicken strips, cucumber, and mayo.", kind: "kids", ingredients: ["chicken", "wraps", "cucumber"] },
  { id: "scrambled-eggs", name: "Scrambled Eggs on Toast", description: "Soft scrambled eggs on buttered toast. Ten minutes, start to finish.", kind: "kids", ingredients: ["eggs", "bread"] },
  { id: "meatballs-kids", name: "Spaghetti and Meatballs", description: "Little meatballs, tomato sauce, and plenty of spaghetti.", kind: "kids", ingredients: ["beef-mince", "pasta"] },
  { id: "tuna-wraps", name: "Tuna Mayo Wraps", description: "Tuna mayo rolled up with sweetcorn. Good cold the next day.", kind: "kids", ingredients: ["tinned-tuna", "wraps"] },
  { id: "hummus-dippers", name: "Hummus and Dippers", description: "Hummus with carrot and cucumber sticks and warm bread.", kind: "kids", ingredients: ["chickpeas", "carrots", "cucumber"] },
];

export const familyMeals = meals.filter((m) => m.kind === "family");
export const kidsMeals = meals.filter((m) => m.kind === "kids");

export const mealById: Record<string, Meal> = Object.fromEntries(
  meals.map((m) => [m.id, m]),
);
