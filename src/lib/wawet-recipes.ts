// Relative import on purpose: scripts/check-catalogue.ts consumes this module
// under tsx, where the "@/" alias is not guaranteed to resolve.
import { type Meal, meals } from "./wawet-data";

/**
 * Cooking instructions for every built-in dish. Static content, no state.
 *
 * Content rules (docs/recipe-plan.md): UK English, metric, family dishes
 * serve 4 and kids dishes serve 2, short imperative steps, quantities only
 * where essential. Store-cupboard staples (oil, butter, onions, garlic,
 * stock, flour, soy, dried herbs and spices) are assumed present, matching
 * the pantry's hero-ingredient philosophy in wawet-data.ts.
 *
 * Coverage is enforced two ways from the same validator: scripts/check-catalogue.ts
 * (CI) and __tests__ both call validateRecipes().
 */

export type Recipe = {
  serves: number;
  time: string;
  steps: string[];
};

export const recipes: Record<string, Recipe> = {
  // ---------------------------------------------------------------- family
  "spaghetti-bolognese": {
    serves: 4,
    time: "50 min",
    steps: [
      "Soften a chopped onion and 2 crushed garlic cloves in olive oil over a medium heat.",
      "Add 500g beef mince and brown it hard, breaking it up as you go.",
      "Stir in a tin of chopped tomatoes, a squeeze of tomato puree, a beef stock cube and a splash of water.",
      "Season, then simmer gently for 30 minutes until thick and glossy.",
      "Cook the spaghetti in well salted water until just tender, saving a mug of pasta water.",
      "Loosen the ragu with a splash of pasta water, toss with the spaghetti and serve with parmesan.",
    ],
  },
  "lasagna-night": {
    serves: 4,
    time: "1 hr 15 min",
    steps: [
      "Make a quick ragu: brown 500g beef mince with a chopped onion and garlic, then simmer with a tin of chopped tomatoes for 20 minutes.",
      "Melt 40g butter, stir in 40g flour, then whisk in 500ml milk to make a smooth white sauce. Season with a pinch of nutmeg.",
      "Layer ragu, pasta sheets and white sauce in a baking dish, repeating twice and finishing with white sauce.",
      "Top with a generous handful of grated cheese.",
      "Bake at 190C for 35 to 40 minutes until bubbling and golden.",
      "Rest for 10 minutes before cutting. Serve with a green salad.",
    ],
  },
  "chilli-con-carne": {
    serves: 4,
    time: "50 min",
    steps: [
      "Soften a chopped onion in oil, then add garlic, 1 tsp cumin, 1 tsp smoked paprika and a pinch of chilli flakes.",
      "Add 500g beef mince and brown it well.",
      "Stir in a tin of chopped tomatoes, a drained tin of kidney beans if you have one, and a beef stock cube.",
      "Simmer gently for 30 minutes, stirring now and then, until rich and thick.",
      "Rinse 300g rice and cook until fluffy.",
      "Serve the chilli over the rice with soured cream and anything else the table demands.",
    ],
  },
  "burger-night": {
    serves: 4,
    time: "30 min",
    steps: [
      "Season 500g beef mince with salt and pepper and shape into 4 patties slightly wider than the buns.",
      "Press a small dimple into the centre of each patty so they stay flat.",
      "Fry or grill on a high heat for 3 to 4 minutes a side; add cheese for the last minute if you like.",
      "Toast the cut sides of the bread or buns.",
      "Build with whatever the family insists on: lettuce, tomato, pickles, sauce.",
      "Serve with fries and extra napkins.",
    ],
  },
  "cottage-pie": {
    serves: 4,
    time: "1 hr 10 min",
    steps: [
      "Brown 500g beef mince with a chopped onion and a grated carrot if you have one.",
      "Stir in a spoon of tomato puree, a beef stock cube and 300ml water; simmer for 20 minutes.",
      "Meanwhile boil 900g peeled potatoes until tender, then mash with butter and a splash of milk.",
      "Tip the mince into a baking dish and spread the mash on top, roughing it up with a fork.",
      "Bake at 200C for 25 minutes until the top is golden at the edges.",
      "Rest for 5 minutes, then serve with peas or greens.",
    ],
  },
  "beef-tacos": {
    serves: 4,
    time: "25 min",
    steps: [
      "Brown 500g beef mince in a hot pan.",
      "Add a chopped onion, garlic, 1 tsp cumin, 1 tsp paprika and a pinch of chilli; cook 5 minutes more.",
      "Splash in a little water and simmer until saucy.",
      "Warm the wraps in a dry pan or the oven.",
      "Put the mince, wraps and bowls of toppings on the table: cheese, salsa, soured cream, shredded lettuce.",
      "Everyone builds their own. That is the point.",
    ],
  },
  "steak-night": {
    serves: 4,
    time: "40 min",
    steps: [
      "Cut the potatoes into chunks, boil for 8 minutes, then roast in hot oil at 220C for 25 minutes until crisp.",
      "Take the steaks out of the fridge 20 minutes before cooking and season generously.",
      "Trim the green beans and steam or boil for 4 minutes.",
      "Sear the steaks in a screaming hot pan: 2 to 3 minutes a side for medium rare, longer to taste.",
      "Rest the steaks for 5 minutes under foil; make a quick peppercorn sauce in the pan with cream and crushed pepper if you fancy.",
      "Slice and serve with the potatoes and beans.",
    ],
  },
  "beef-stir-fry": {
    serves: 4,
    time: "25 min",
    steps: [
      "Slice the steak thinly across the grain and toss with a splash of soy sauce.",
      "Cook the noodles according to the packet, drain and set aside.",
      "Get a wok smoking hot and sear the beef in batches; set aside.",
      "Stir-fry sliced peppers with garlic and ginger for 2 to 3 minutes.",
      "Return the beef with the noodles, more soy, a spoon of honey and a splash of water; toss until sticky.",
      "Serve straight from the wok.",
    ],
  },
  "roast-chicken": {
    serves: 4,
    time: "1 hr 45 min",
    steps: [
      "Heat the oven to 200C. Season the chicken all over and put half a lemon in the cavity if you have one.",
      "Roast for 20 minutes per 500g plus 20 minutes, basting once or twice.",
      "Parboil potato chunks for 8 minutes, shake them rough, then roast in hot oil for the last 50 minutes.",
      "Add peeled carrots to the roasting tray for the last 30 minutes.",
      "Rest the chicken for 15 minutes under foil while you make gravy from the tray juices.",
      "Carve and serve with far too much gravy.",
    ],
  },
  "butter-chicken": {
    serves: 4,
    time: "45 min",
    steps: [
      "Cut the chicken into chunks and toss with 1 tsp garam masala, 1 tsp paprika and a pinch of salt.",
      "Brown the chicken in butter, then set aside.",
      "In the same pan soften an onion, garlic and ginger, adding 1 tsp more garam masala.",
      "Add a tin of chopped tomatoes and simmer 10 minutes, then stir in 150ml cream.",
      "Return the chicken and simmer gently until cooked through, about 10 minutes.",
      "Serve over fluffy rice, with cucumber raita if you have yoghurt to spare.",
    ],
  },
  "thai-green-curry": {
    serves: 4,
    time: "35 min",
    steps: [
      "Fry 2 to 3 tbsp green curry paste in a little oil until fragrant.",
      "Add sliced chicken and coat it in the paste.",
      "Pour in a tin of coconut milk plus half a tin of water and simmer for 15 minutes.",
      "Add any quick veg you have: green beans, peppers, peas.",
      "Season with a splash of fish sauce or soy and a pinch of sugar.",
      "Serve over steamed rice with fresh herbs on top.",
    ],
  },
  "chicken-fajitas": {
    serves: 4,
    time: "30 min",
    steps: [
      "Slice the chicken and toss with 1 tsp each of paprika, cumin and oregano.",
      "Slice the peppers and an onion into strips.",
      "Sear the chicken in a very hot pan until charred at the edges; set aside.",
      "Cook the peppers and onion in the same pan until soft and blistered.",
      "Return the chicken, squeeze over lime if you have it, and warm the wraps.",
      "Serve the sizzling pan at the table with wraps and toppings.",
    ],
  },
  "caesar-salad": {
    serves: 4,
    time: "25 min",
    steps: [
      "Season the chicken and fry or griddle until golden and cooked through; rest, then slice.",
      "Tear yesterday's bread into chunks, toss in oil and bake at 200C for 8 minutes for croutons.",
      "Whisk a dressing: mayonnaise, a little crushed garlic, lemon juice, and grated parmesan.",
      "Toss the leaves with most of the dressing.",
      "Top with chicken, croutons and more parmesan.",
      "Finish with black pepper and the last of the dressing.",
    ],
  },
  "chicken-stir-fry": {
    serves: 4,
    time: "20 min",
    steps: [
      "Slice the chicken thinly and the peppers into strips.",
      "Cook the noodles, drain, and toss with a drop of oil.",
      "Stir-fry the chicken in a hot wok until just cooked; set aside.",
      "Fry the peppers with garlic and ginger for 2 minutes.",
      "Everything back in the wok with soy, a spoon of honey and a splash of water.",
      "Toss with the noodles and serve immediately.",
    ],
  },
  "katsu-curry": {
    serves: 4,
    time: "35 min",
    steps: [
      "Cook the breaded chicken steaks in the oven per the packet until crisp and golden.",
      "Soften a chopped onion and a grated carrot in a saucepan.",
      "Stir in 1 tbsp curry powder and 1 tbsp flour, then gradually whisk in 500ml chicken stock.",
      "Simmer until smooth and glossy, then blend or leave rustic; add a splash of soy and a pinch of sugar.",
      "Steam the rice.",
      "Slice the chicken over the rice and pour the sauce across the top.",
    ],
  },
  "chicken-steak-chips": {
    serves: 4,
    time: "30 min",
    steps: [
      "Heat the oven to 220C with the oven chips spread on one tray.",
      "Put the breaded chicken steaks on a second tray.",
      "Bake both per the packets, turning halfway, until crisp and golden.",
      "Cook a quick side: peas, beans or a pile of cucumber sticks.",
      "Line up the sauces and let everyone pick a lane.",
      "Serve hot and argue about ketchup versus mayo.",
    ],
  },
  "salmon-tray-bake": {
    serves: 4,
    time: "40 min",
    steps: [
      "Heat the oven to 200C. Halve the baby potatoes, or chunk larger ones.",
      "Toss the potatoes in oil and salt and roast for 20 minutes.",
      "Push the potatoes aside and add the salmon fillets to the tray.",
      "Season, add lemon slices, and roast 12 to 15 minutes more until the salmon flakes.",
      "Throw any quick greens on the tray for the last 5 minutes.",
      "Serve straight from the tin. One tin to wash.",
    ],
  },
  "teriyaki-salmon": {
    serves: 4,
    time: "30 min",
    steps: [
      "Mix a glaze: 4 tbsp soy, 2 tbsp honey, a little grated ginger and garlic.",
      "Steam the rice and cut the broccoli into small florets.",
      "Pan-fry the salmon skin side down for 4 minutes.",
      "Turn, add the glaze, and let it bubble to a sticky coat, spooning it over.",
      "Steam or boil the broccoli for 4 minutes.",
      "Serve the salmon and broccoli over rice with the pan glaze poured over.",
    ],
  },
  "fish-and-chips": {
    serves: 4,
    time: "35 min",
    steps: [
      "Heat the oven to 220C and get the oven chips on a tray.",
      "Season the fish and coat it: flour, then beaten egg, then breadcrumbs if breading your own.",
      "Bake or fry the fish until golden and just flaking, about 15 minutes in the oven.",
      "Simmer the peas, then crush them roughly with butter, salt and a squeeze of lemon.",
      "Cook the chips per the packet until properly crisp.",
      "Serve with lemon wedges, tartare sauce and vinegar on the table.",
    ],
  },
  "fish-pie": {
    serves: 4,
    time: "1 hr",
    steps: [
      "Boil 900g peeled potatoes and mash with butter and milk.",
      "Poach the fish chunks in 400ml milk for 5 minutes, then lift out, keeping the milk.",
      "Make a sauce: melt 40g butter, stir in 40g flour, then whisk in the poaching milk until smooth.",
      "Fold the fish into the sauce with a handful of peas and season well.",
      "Spoon into a dish, top with the mash, and rough up the surface.",
      "Bake at 200C for 25 minutes until browned at the edges.",
    ],
  },
  "prawn-linguine": {
    serves: 4,
    time: "25 min",
    steps: [
      "Cook the linguine in well salted water, saving a mug of pasta water.",
      "Warm olive oil with sliced garlic and a pinch of chilli flakes.",
      "Add halved cherry tomatoes and cook until they start to collapse.",
      "Add the prawns and cook 2 to 3 minutes until pink.",
      "Toss in the pasta with a splash of pasta water and a lot of lemon.",
      "Finish with parsley if you have it and serve immediately.",
    ],
  },
  "prawn-noodles": {
    serves: 4,
    time: "20 min",
    steps: [
      "Cook the noodles, drain and toss with a drop of sesame oil if you have it.",
      "Stir-fry garlic and ginger in a hot wok for 30 seconds.",
      "Add the prawns and cook until just pink.",
      "Add the noodles with soy sauce and a splash of water; toss well.",
      "Finish with sliced spring onion and sesame seeds.",
      "Serve in deep bowls.",
    ],
  },
  "toad-in-the-hole": {
    serves: 4,
    time: "50 min",
    steps: [
      "Whisk a batter: 140g flour, 4 eggs, 200ml milk and a pinch of salt. Rest it while the oven heats.",
      "Heat the oven to 220C with 2 tbsp oil in a roasting tin.",
      "Brown the sausages in the hot tin for 10 minutes.",
      "Pour the batter around the sausages, straight into the hot fat.",
      "Bake 25 to 30 minutes without opening the door until tall and crisp.",
      "Serve with onion gravy. Gravy is not optional.",
    ],
  },
  "sausage-pasta-bake": {
    serves: 4,
    time: "50 min",
    steps: [
      "Squeeze the sausage meat from the skins and brown it in a pan, breaking it up.",
      "Add a chopped onion and garlic, then a tin of chopped tomatoes and a pinch of fennel or oregano.",
      "Simmer 15 minutes while the pasta cooks 2 minutes short of the packet time.",
      "Toss the pasta with the sauce and tip into a baking dish.",
      "Top with grated cheese or torn mozzarella.",
      "Bake at 200C for 20 minutes until crisp on top.",
    ],
  },
  carbonara: {
    serves: 4,
    time: "25 min",
    steps: [
      "Cook the pasta in well salted water, saving a mug of pasta water.",
      "Fry chopped bacon until crisp and turn off the heat.",
      "Whisk 3 whole eggs plus 1 yolk with 60g grated parmesan and a lot of black pepper.",
      "Tip the hot drained pasta into the bacon pan.",
      "Off the heat, stir in the egg mix with splashes of pasta water until glossy, not scrambled.",
      "Serve immediately with more parmesan and pepper. No cream, no arguments.",
    ],
  },
  "breakfast-for-dinner": {
    serves: 4,
    time: "20 min",
    steps: [
      "Grill or fry the bacon until it is exactly how your family likes it.",
      "Warm the baked beans in a pan.",
      "Fry or scramble the eggs in butter.",
      "Toast a stack of bread and butter it properly.",
      "Plate everything up while it is all still hot.",
      "Ketchup or brown sauce: choose your side and defend it.",
    ],
  },
  "broccoli-bacon-pasta": {
    serves: 4,
    time: "25 min",
    steps: [
      "Cut the broccoli into small florets and the bacon into strips.",
      "Cook the pasta; add the broccoli to the same pot for the final 4 minutes.",
      "Meanwhile fry the bacon until crisp with a little garlic.",
      "Save a mug of pasta water, then drain the pasta and broccoli.",
      "Toss everything in the bacon pan with pasta water and a knob of butter until glossy.",
      "Finish with grated cheese and black pepper.",
    ],
  },
  blt: {
    serves: 4,
    time: "15 min",
    steps: [
      "Fry or grill the bacon until properly crisp.",
      "Toast thick slices of bread.",
      "Spread mayonnaise generously on every slice.",
      "Layer cold crisp lettuce, sliced tomato, then the hot bacon.",
      "Season the tomato layer with salt and pepper. It matters.",
      "Top, press gently, halve, and stack them high.",
    ],
  },
  "pork-chops": {
    serves: 4,
    time: "35 min",
    steps: [
      "Boil potato chunks until tender, then crush roughly with butter and season.",
      "Take the chops out of the fridge 15 minutes ahead and season well.",
      "Fry the chops in a hot pan, 4 to 5 minutes a side depending on thickness.",
      "Baste with a knob of butter for the last minute and rest for 5.",
      "Warm some apple sauce, or quickly soften a grated apple in the chop pan.",
      "Serve chops over the crushed potatoes with the pan juices.",
    ],
  },
  "sweet-sour-pork": {
    serves: 4,
    time: "35 min",
    steps: [
      "Cut the pork into bite-size pieces and dust with cornflour or plain flour.",
      "Steam the rice.",
      "Fry the pork in a hot wok until golden; set aside.",
      "Stir-fry pepper chunks for 2 minutes, with pineapple chunks if you have a tin.",
      "Mix a sauce of 3 tbsp ketchup, 2 tbsp vinegar, 1 tbsp soy and 1 tbsp sugar; bubble it in the wok.",
      "Return the pork, toss until sticky, and serve over the rice.",
    ],
  },
  "pizza-night": {
    serves: 4,
    time: "40 min",
    steps: [
      "Heat the oven as hot as it goes with a tray or stone inside.",
      "Roll or stretch your dough thin. Shop bases work fine on a busy night.",
      "Simmer half a tin of tomatoes with garlic, salt and a pinch of oregano into a quick sauce.",
      "Spread the sauce thin, tear the mozzarella over, and add your toppings.",
      "Slide onto the hot tray and bake 8 to 12 minutes until blistered.",
      "Finish with chilli oil for the grown-ups.",
    ],
  },
  "creamy-mushroom-pasta": {
    serves: 4,
    time: "25 min",
    steps: [
      "Slice the mushrooms and cook the pasta, saving a mug of pasta water.",
      "Fry the mushrooms hard in butter until deeply golden. Do not crowd the pan.",
      "Add crushed garlic for the last minute.",
      "Pour in 200ml cream and let it bubble briefly.",
      "Toss with the pasta and a splash of pasta water until the sauce clings.",
      "Shower with parmesan and black pepper.",
    ],
  },
  "mushroom-risotto": {
    serves: 4,
    time: "45 min",
    steps: [
      "Fry sliced mushrooms in butter until golden; set some aside for the top.",
      "Soften a finely chopped onion in the same pan, then stir in 300g risotto rice for a minute.",
      "Add a splash of white wine if open, letting it cook off.",
      "Add hot stock a ladle at a time, stirring, letting each addition absorb.",
      "After about 20 minutes the rice should be creamy with a slight bite.",
      "Stir in butter, parmesan and the reserved mushrooms. Rest 2 minutes, then serve.",
    ],
  },
  "chickpea-curry": {
    serves: 4,
    time: "40 min",
    steps: [
      "Peel and cube the sweet potato.",
      "Soften a chopped onion, then add garlic, ginger and 1 tbsp curry powder.",
      "Add the sweet potato, a drained tin of chickpeas and a tin of chopped tomatoes plus half a tin of water.",
      "Simmer 20 to 25 minutes until the sweet potato is tender.",
      "Steam the rice while it cooks.",
      "Season, add a squeeze of lemon, and serve over rice. Better tomorrow, if it lasts.",
    ],
  },
  dhal: {
    serves: 4,
    time: "40 min",
    steps: [
      "Rinse 300g red lentils until the water runs clearish.",
      "Simmer the lentils in 900ml water with 1 tsp turmeric, skimming any foam, about 20 minutes.",
      "Meanwhile fry a chopped onion until golden, adding garlic, ginger and 1 tsp cumin at the end.",
      "Stir the onion mix into the soft lentils and season properly with salt.",
      "Steam the rice.",
      "Serve the dhal over rice with a spoon of yoghurt on top.",
    ],
  },
  shakshuka: {
    serves: 4,
    time: "30 min",
    steps: [
      "Soften sliced peppers and an onion in olive oil for 8 to 10 minutes.",
      "Add garlic, 1 tsp cumin and 1 tsp paprika, then a tin of chopped tomatoes.",
      "Simmer 10 minutes until thick, and season well.",
      "Make wells and crack an egg into each.",
      "Cover and cook gently until the whites set but the yolks still run.",
      "Bring the pan to the table with bread for dipping.",
    ],
  },
  omelette: {
    serves: 4,
    time: "20 min",
    steps: [
      "Grate the cheese first: omelettes wait for no one.",
      "Beat 3 eggs per omelette with a pinch of salt.",
      "Melt butter in a small nonstick pan over a medium-high heat.",
      "Pour in the eggs and pull the edges in as they set, tilting the pan.",
      "While still slightly soft on top, add cheese and fold in half.",
      "Slide onto a plate and repeat. Serve with salad or toast.",
    ],
  },
  "egg-fried-rice": {
    serves: 4,
    time: "15 min",
    steps: [
      "Use cold cooked rice if you have it; fresh rice needs spreading out to cool and dry.",
      "Beat 3 eggs. Slice any spring onions.",
      "Scramble the eggs in a hot wok and set aside.",
      "Stir-fry the rice in hot oil, pressing it against the wok, until it smells toasty.",
      "Add peas or sweetcorn if around, then the eggs, soy sauce and a drop of sesame oil.",
      "Toss well, top with spring onion, and serve.",
    ],
  },
  "tuna-pasta-bake": {
    serves: 4,
    time: "40 min",
    steps: [
      "Cook the pasta 2 minutes short of the packet time.",
      "Make a quick white sauce: 40g butter, 40g flour, then 500ml milk whisked in gradually.",
      "Stir most of the grated cheese into the sauce off the heat.",
      "Fold in the drained tuna, the pasta and a handful of sweetcorn or peas if you like.",
      "Tip into a dish and top with the rest of the cheese.",
      "Bake at 200C for 20 minutes until golden and bubbling.",
    ],
  },
  "tuna-melt": {
    serves: 4,
    time: "15 min",
    steps: [
      "Mix drained tuna with mayonnaise, a little finely chopped onion and black pepper.",
      "Lightly toast the bread.",
      "Pile the tuna mix onto the slices.",
      "Top generously with grated cheese.",
      "Grill until the cheese melts and bubbles.",
      "Serve hot with something crunchy on the side.",
    ],
  },
  "jacket-potatoes": {
    serves: 4,
    time: "1 hr 20 min",
    steps: [
      "Heat the oven to 200C. Prick the potatoes all over.",
      "Rub with oil and salt for proper crisp skins.",
      "Bake for 1 hour to 1 hour 15 minutes until the skins are crisp and the middles give.",
      "Warm the baked beans near the end.",
      "Split the potatoes, fluff the insides with a fork, and add a knob of butter.",
      "Load with beans and grated cheese while everything is hot.",
    ],
  },
  "loaded-wedges": {
    serves: 4,
    time: "40 min",
    steps: [
      "Bake the wedges at 220C per the packet, or cut your own and toss in oil and paprika.",
      "Cook until deeply golden and crisp, turning once.",
      "Pile the wedges into an ovenproof dish and cover with grated cheese.",
      "Back in the oven for 5 minutes until melted.",
      "Top with soured cream and sliced spring onion.",
      "Serve in the middle of the table with forks ready.",
    ],
  },
  "greek-salad": {
    serves: 4,
    time: "15 min",
    steps: [
      "Chop tomatoes into chunks and slice the cucumber thickly.",
      "Slice some red onion thinly if you have one, and add a handful of olives.",
      "Dress with good olive oil, a splash of red wine vinegar, salt and dried oregano.",
      "Toss gently in a wide bowl.",
      "Lay a thick slab of feta on top and drizzle with more oil.",
      "Serve with warm bread to mop up the juices.",
    ],
  },
  "soup-toasties": {
    serves: 4,
    time: "25 min",
    steps: [
      "Warm your soup gently: tinned is fine, homemade is a bonus.",
      "Butter the bread on the OUTSIDE faces.",
      "Fill generously with grated cheese, plus ham or onion if you like.",
      "Toast in a dry pan or toastie machine until deep golden and molten inside.",
      "Rest the toasties for one minute so the cheese settles.",
      "Cut into triangles for dunking. This is non-negotiable.",
    ],
  },
  "sweetcorn-chowder": {
    serves: 4,
    time: "35 min",
    steps: [
      "Soften a chopped onion in butter in a big pot.",
      "Add cubed potatoes and 700ml stock; simmer 12 minutes.",
      "Add the sweetcorn and simmer 5 minutes more.",
      "Blend half the pot and return it for a thick but chunky texture.",
      "Stir in 150ml cream and warm through without boiling.",
      "Season generously with black pepper and serve with bread.",
    ],
  },
  // ------------------------------------------------------------------ kids
  "chicken-nuggets": {
    serves: 2,
    time: "25 min",
    steps: [
      "Heat the oven to 220C.",
      "Spread the nuggets and oven chips on trays in a single layer.",
      "Bake per the packets, turning halfway, until golden and crisp.",
      "Cut cucumber into sticks while you wait.",
      "Plate up with ketchup exactly where they like it.",
      "Serve with the cucumber sticks first, chips second. Worth a try.",
    ],
  },
  "nuggets-sweet-potato": {
    serves: 2,
    time: "35 min",
    steps: [
      "Heat the oven to 220C.",
      "Cut the sweet potato into fries, toss in a little oil and salt.",
      "Spread on a tray with space between them and bake for 15 minutes.",
      "Add the nuggets on their own tray and bake both for 15 minutes more, turning once.",
      "The fries are done when browned at the edges.",
      "Serve with a dip and call them chips. Orange edition.",
    ],
  },
  "fish-fingers": {
    serves: 2,
    time: "30 min",
    steps: [
      "Grill or bake the fish fingers per the packet until golden.",
      "Boil peeled potato chunks until tender.",
      "Mash with butter and a splash of milk until smooth.",
      "Warm the sweetcorn in a small pan.",
      "Plate with everything touching or nothing touching, per the current rules.",
      "Ketchup on the side.",
    ],
  },
  "cheesy-pasta": {
    serves: 2,
    time: "20 min",
    steps: [
      "Cook short pasta until soft enough for small people.",
      "Save a splash of pasta water, then drain.",
      "Melt a knob of butter into the hot pasta.",
      "Add plenty of grated cheese and a splash of the pasta water.",
      "Stir until the sauce goes creamy and coats every piece.",
      "Serve fast, with peas on the side if they are having a brave day.",
    ],
  },
  "mac-cheese": {
    serves: 2,
    time: "35 min",
    steps: [
      "Cook macaroni 2 minutes short of the packet time.",
      "Make a sauce: 30g butter, 30g flour, then 400ml milk whisked in gradually.",
      "Stir most of the grated cheese into the sauce off the heat.",
      "Fold in the pasta and tip into a small baking dish.",
      "Top with the last of the cheese.",
      "Bake at 200C for 15 minutes until the top is crunchy and golden.",
    ],
  },
  "pasta-bake": {
    serves: 2,
    time: "35 min",
    steps: [
      "Cook the pasta 2 minutes short of the packet time.",
      "Simmer a tin of chopped tomatoes with a little garlic and a pinch of sugar for 10 minutes.",
      "Toss the pasta through the sauce.",
      "Tip into a baking dish and tear the mozzarella over the top like a lid.",
      "Bake at 200C for 15 minutes until melted and bubbling.",
      "Cool for a few minutes before serving. Molten cheese waits for no one.",
    ],
  },
  "mini-pizzas": {
    serves: 2,
    time: "20 min",
    steps: [
      "Heat the oven to 220C.",
      "Spread each mini base with a spoon of tomato sauce or passata.",
      "Let the kids add the mozzarella and any toppings they will actually eat.",
      "Bake for 8 to 10 minutes until the cheese bubbles.",
      "Cool for 2 minutes; the roof of the mouth matters.",
      "Cut into quarters and serve with veggie sticks.",
    ],
  },
  "sausage-mash-kids": {
    serves: 2,
    time: "35 min",
    steps: [
      "Grill or bake the sausages, turning until browned all over and cooked through.",
      "Boil peeled potato chunks until tender.",
      "Mash with butter and a splash of milk until properly smooth.",
      "Warm some peas.",
      "Serve sausages on a cloud of mash with the peas alongside.",
      "Add gravy for the grown-up version.",
    ],
  },
  "sausages-beans-chips": {
    serves: 2,
    time: "30 min",
    steps: [
      "Heat the oven to 220C and get the chips on a tray.",
      "Add the sausages on their own tray or alongside.",
      "Bake per the packets, turning everything once.",
      "Warm the baked beans gently in a pan.",
      "Check the sausages are cooked through.",
      "The classic plate. No notes.",
    ],
  },
  "beans-on-toast": {
    serves: 2,
    time: "10 min",
    steps: [
      "Warm the beans slowly in a pan, not to a rolling boil.",
      "Toast thick slices of bread.",
      "Butter the toast right to the edges.",
      "Pour the beans over or serve them beside, per each child's law.",
      "Add grated cheese on top if it is that kind of day.",
      "Serve immediately.",
    ],
  },
  toasties: {
    serves: 2,
    time: "15 min",
    steps: [
      "Butter the bread on the OUTSIDE faces.",
      "Fill with grated cheese, not too thick or it will not melt through.",
      "Toast in a dry pan or toastie machine until deep golden.",
      "Rest for one minute so the cheese settles.",
      "Cut into triangles or soldiers, whichever is current.",
      "Serve with veggie sticks on the side.",
    ],
  },
  quesadilla: {
    serves: 2,
    time: "15 min",
    steps: [
      "Lay a wrap flat in a dry frying pan over a medium heat.",
      "Scatter grated cheese over one half, plus a little mild salsa or sweetcorn.",
      "Fold the empty half over and press gently.",
      "Cook 2 minutes a side until golden and melted inside.",
      "Cool for a minute, then cut into wedges.",
      "Serve with a little dish of salsa for dipping.",
    ],
  },
  "rice-chicken": {
    serves: 2,
    time: "30 min",
    steps: [
      "Cut the chicken into small pieces.",
      "Cook the rice until soft and fluffy.",
      "Gently fry the chicken in a little oil until cooked through with no pink.",
      "Warm the sweetcorn.",
      "Stir everything together, or plate in separate piles, per the rules of the table.",
      "A little butter or soy stirred through the rice never hurts.",
    ],
  },
  "chicken-wrap": {
    serves: 2,
    time: "20 min",
    steps: [
      "Slice the chicken into strips and cook through in a lightly oiled pan.",
      "Warm the wraps so they roll without cracking.",
      "Slice the cucumber into thin sticks.",
      "Spread each wrap with mayo.",
      "Add chicken and cucumber, then roll up tightly and halve.",
      "Wrap the bottom in kitchen paper for small hands.",
    ],
  },
  "scrambled-eggs": {
    serves: 2,
    time: "10 min",
    steps: [
      "Beat 4 eggs with a small pinch of salt.",
      "Toast the bread and butter it while hot.",
      "Melt butter in a nonstick pan over a low heat.",
      "Add the eggs and stir slowly and constantly.",
      "Pull the pan off the heat while the eggs still look slightly wet.",
      "Pile onto the toast and serve straight away.",
    ],
  },
  "meatballs-kids": {
    serves: 2,
    time: "40 min",
    steps: [
      "Season the mince and roll it into small meatballs.",
      "Brown the meatballs gently in a little oil, turning carefully.",
      "Add a tin of chopped tomatoes and a pinch of sugar; simmer 15 minutes.",
      "Cook the spaghetti until soft enough for the audience.",
      "Check a big meatball is cooked through.",
      "Serve saucy spaghetti with the meatballs on top and cheese for sprinkling.",
    ],
  },
  "tuna-wraps": {
    serves: 2,
    time: "10 min",
    steps: [
      "Drain the tuna well.",
      "Mix with mayonnaise and a spoon of sweetcorn.",
      "Spread across the wraps, leaving a border.",
      "Roll up tightly and slice into pinwheels or halves.",
      "Serve with cucumber sticks.",
      "Make one extra: they travel well and are good cold tomorrow.",
    ],
  },
  "hummus-dippers": {
    serves: 2,
    time: "15 min",
    steps: [
      "Blend a drained tin of chickpeas with 2 tbsp olive oil, a squeeze of lemon, a small garlic clove and salt.",
      "Add water a spoon at a time until smooth and scoopable. Shop hummus also counts.",
      "Peel the carrots and cut into sticks with the cucumber.",
      "Warm some bread or pitta and cut into fingers.",
      "Arrange everything on one big plate, dips in the middle.",
      "Dinner that looks like a picnic. Works every time.",
    ],
  },
};

/**
 * Prototype-safe lookup: untrusted ids like "toString" must read as unknown,
 * never as an inherited Object.prototype member (same discipline as
 * seededMealFor in wawet-state.ts). This is also the recipe page's
 * seeded-vs-custom discriminator.
 */
export function seededRecipeFor(id: string): Recipe | undefined {
  return Object.hasOwn(recipes, id) ? recipes[id] : undefined;
}

/**
 * Shared coverage validator, consumed by BOTH scripts/check-catalogue.ts (CI)
 * and the unit suite so the two can never drift. Set equality between recipe
 * keys and seeded meal ids also catches a duplicate key in the literal above
 * silently overwriting an entry (the object would come up one key short).
 */
export function validateRecipes(
  allMeals: readonly Meal[] = meals,
  all: Record<string, Recipe> = recipes,
): string[] {
  const problems: string[] = [];
  const mealIds = new Set(allMeals.map((m) => m.id));
  const keys = Object.keys(all);

  for (const id of mealIds) {
    if (!Object.hasOwn(all, id)) problems.push(`meal "${id}" has no recipe`);
  }
  for (const key of keys) {
    if (!mealIds.has(key)) problems.push(`recipe "${key}" matches no seeded meal`);
  }
  if (keys.length !== mealIds.size) {
    problems.push(`recipe count ${keys.length} does not equal meal count ${mealIds.size}`);
  }
  for (const [id, recipe] of Object.entries(all)) {
    if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      problems.push(`recipe "${id}" has no steps`);
    }
    if (!(recipe.serves >= 1)) problems.push(`recipe "${id}" serves fewer than 1`);
    if (typeof recipe.time !== "string" || recipe.time.trim() === "") {
      problems.push(`recipe "${id}" has no time`);
    }
    for (const text of [...(recipe.steps ?? []), recipe.time]) {
      if (typeof text === "string" && text.includes("—")) {
        problems.push(`recipe "${id}" contains an em dash`);
      }
    }
  }
  return problems;
}
