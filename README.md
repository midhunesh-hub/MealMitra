# Meal Mitra

A responsive front-end demo for discovering budget-friendly food and planning a student's food budget.

## Run in VS Code
1. Extract the ZIP.
2. Open VS Code → **File → Open Folder...** → select `foodwise`.
3. Install the **Live Server** extension by Ritwick Dey if needed.
4. Open `index.html`, right-click inside the editor, and choose **Open with Live Server**.
5. Your browser opens the site. You can also click **Go Live** at the bottom-right.

No backend, database, Node.js, or Python is required.

## Features
- Responsive landing page with a food-themed gradient background
- 20 cities (Tamil Nadu, Kerala, Telangana, Karnataka)
- Search by city, category, and maximum price
- Four budget shortcuts
- Sort food by price or rating
- Food cards with sample menus and Google Maps search directions
- Favorites saved in LocalStorage
- My Cart: add several foods, change quantity, replace or remove items, see the total expenses
- Confirm the cart to get a bill; each bill is saved to Records (grouped by day with daily totals) in LocalStorage
- Map of all picks (Leaflet + OpenStreetMap) with **live location**, distance on each card, and a "Nearest to me" sort

- **Hotels in the selected city**: pick a city, craving and budget to see its hotels (rating, price range, items in budget); tap a hotel to open its full menu with prices, cart, favourites and directions
- `data/extra.js` adds 120 more sample hotels (6 per city) with regional menus; 1,472 listings in total

- **Budget ranges**: Under ₹50/100/200, ₹51–100, ₹101–200, ₹201–300, ₹301–500, ₹501–700, ₹701–1000 and any budget
- **Restaurant picker**: choose City, then a Restaurant, then a Budget, and only that restaurant's foods in that budget are listed
- **39 cities** (Tamil Nadu, Kerala, Karnataka, Telangana, Andhra Pradesh, Puducherry), each with 50+ restaurants and every restaurant with 20+ foods (about 45,000 listings). `data/generate.js` builds them when the page loads.
- **Directions**: every restaurant has one fixed map location. Tap **Route** on a food, restaurant or map pin to draw the route from your live location (drive, walk or cycle) with distance and time, or open it in Google Maps.

## Live location
Click **Use my live location** in the Map section and allow the browser prompt. It works on `localhost` (Live Server) or any HTTPS site, not on a plain `file://` page in some browsers. The map needs internet for the map tiles.

## Demo data
Restaurant names, prices, locations, and ratings in `data/restaurants.js` are fictional sample data. Verify real listings and prices before presenting them as factual.

## Customize
Edit `data/restaurants.js`. To add a city, add it to `cityMeta` and `areaCoords` in that file, then add listings with the same city name. Each item contains `id`, `name`, `hotel`, `city`, `area`, `category`, `price`, `rating`, `emoji`, `bg`, `tag`, and `description`. Keep IDs unique.

Each item also gets `lat`/`lng` from `areaCoords` in the data file. Add your own `lat` and `lng` to an item to pin it exactly.
