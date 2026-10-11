const $ = s => document.querySelector(s);
let filters = {city:"Chennai", category:"All", minPrice:0, maxPrice:100, hotel:"All"};
let toastTimer;
const PAGE=12;let shown=PAGE;
const CITY_COLORS=[["#4e7776","#294d4b"],["#d58c52","#9b5b35"],["#8a8d58","#555d3c"],["#8c718b","#5e4c6a"],["#c4694f","#8a3e2c"],["#5b7fa3","#34506f"],["#b5933f","#7d6322"],["#6e9a6c","#3f6a3f"]];
let stateFilter="All";
function cityCount(name){return foodItems.filter(x=>x.city===name).length}
function buildCitySelect(){
 const sel=$("#citySelect"),states=[...new Set(cityMeta.map(c=>c.state))];
 sel.innerHTML=states.map(st=>`<optgroup label="${st}">${cityMeta.filter(c=>c.state===st).map(c=>`<option>${c.name}</option>`).join("")}</optgroup>`).join("");
 sel.value="Chennai";
}
function buildCityGrid(){
 const states=["All",...new Set(cityMeta.map(c=>c.state))];
 $("#stateTabs").innerHTML=states.map(st=>`<button class="state-tab ${st===stateFilter?"active":""}" data-state="${st}" role="tab">${st}</button>`).join("");
 const list=cityMeta.filter(c=>stateFilter==="All"||c.state===stateFilter);
 $("#cityGrid").innerHTML=list.map(c=>{const i=cityMeta.indexOf(c),[a,b]=CITY_COLORS[i%CITY_COLORS.length];return `<button class="city-card" data-city="${c.name}" style="background:linear-gradient(135deg,${a},${b})"><span>${c.state.toUpperCase()}</span><strong>${c.name}</strong><small>${c.tagline}</small><em class="city-count">${cityCount(c.name)} places</em><b>↗</b></button>`}).join("");
}
function buildHotelSelect(city){
 const sel=$("#hotelSelect"),list=[...(HOTELS[city]||[])].sort((a,b)=>a.name.localeCompare(b.name));
 sel.innerHTML=`<option value="All">All restaurants (${list.length})</option>`+list.map(h=>`<option value="${h.name.replace(/"/g,"&quot;")}">${h.name} · ${h.area}</option>`).join("");
 sel.dataset.city=city;sel.value="All";
}
function goPage(p){if(location.hash==="#"+p)route();else location.hash="#"+p}
function scrollToResults(){goPage("results")}
function parseBudget(v){const[a,b]=String(v).split("-").map(Number);return{min:a||0,max:b||100000}}
function budgetText(){return filters.maxPrice>=100000?"any budget":filters.minPrice>0?`₹${filters.minPrice} – ₹${filters.maxPrice}`:`up to ₹${filters.maxPrice}`}
buildCitySelect();buildHotelSelect($("#citySelect").value);buildCityGrid();
let userPos=null; /* {lat,lng,acc} while live location is on */
function getFavorites(){try{return JSON.parse(localStorage.getItem("foodwise-favorites")||"[]")}catch{return []}}
function saveFavorites(ids){localStorage.setItem("foodwise-favorites",JSON.stringify(ids));$("#favoriteCount").textContent=ids.length}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2300)}
function priceBand(price){if(price>700)return"Luxury";if(price>500)return"Premium";if(price>300)return"High";if(price>200)return"Mid-high";return price<=50?"Very low":price<=100?"Low":price<=200?"Medium":"High"}
function inFilter(x){return x.price>=filters.minPrice&&x.price<=filters.maxPrice&&(filters.category==="All"||x.category===filters.category)}
function getFilteredItems(){
 let items=filters.hotel!=="All"?((HOTEL_BY_KEY[filters.city+"|"+filters.hotel]||{items:[]}).items).filter(x=>menuAll||inFilter(x)):(HOTELS[filters.city]||[]).flatMap(h=>h.items).filter(inFilter);
 const sort=$("#sortSelect").value;
 if(sort==="price-low")items.sort((a,b)=>a.price-b.price);
 else if(sort==="price-high")items.sort((a,b)=>b.price-a.price);
 else if(sort==="rating")items.sort((a,b)=>b.rating-a.rating);
 else if(sort==="nearest"&&userPos)items.sort((a,b)=>distKm(a)-distKm(b));
 else items.sort((a,b)=>(b.rating+(b.price<=100?.3:0))-(a.rating+(a.price<=100?.3:0)));
 return items;
}
function distKm(item){if(!userPos)return null;const R=6371,rad=Math.PI/180,dLat=(item.lat-userPos.lat)*rad,dLng=(item.lng-userPos.lng)*rad;const h=Math.sin(dLat/2)**2+Math.cos(userPos.lat*rad)*Math.cos(item.lat*rad)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function distLabel(item){const d=distKm(item);if(d===null)return"";return d<1?`${Math.round(d*100)*10} m away`:`${d.toFixed(1)} km away`}
function cityState(c){const m=cityMeta.find(x=>x.name===c);return m?", "+m.state:""}
function foodCard(item){
 const saved=getFavorites().includes(item.id);
 return `<article class="food-card" id="card-${item.id}"><div class="food-visual" style="--food-bg:${item.bg}"><span class="food-tag">${item.tag}</span><button class="heart-button ${saved?"saved":""}" data-favorite="${item.id}" aria-label="Toggle favourite">${saved?"♥":"♡"}</button><span class="food-emoji" aria-hidden="true">${item.emoji}</span></div><div class="food-info"><div class="food-topline"><h3 class="food-name">${item.name}</h3><span class="food-price">₹${item.price}</span></div><p class="food-hotel">${item.hotel} · ${item.area}</p><div class="food-meta"><span class="food-rating"><span>★</span> ${item.rating.toFixed(1)}</span><span class="food-location">${item.city}</span><span class="food-location">${priceBand(item.price)} budget</span>${userPos?`<span class="food-location food-distance">${distLabel(item)}</span>`:""}</div><div class="food-card-footer"><button class="small-action" data-details="${item.id}">About</button><button class="small-action" data-showmap="${item.id}">Map ⌖</button><button class="small-action primary" data-route="${encodeURIComponent(item.city+"|"+item.hotel)}">Route ↗</button></div><button class="cart-add" data-addcart="${item.id}">${cartLabel(item.id)}</button></div></article>`;
}
function renderFood(){
 const items=getFilteredItems(),grid=$("#foodGrid");
 grid.innerHTML=items.slice(0,shown).map(foodCard).join("");updateLoadMore(items);
 $("#emptyState").classList.toggle("hidden",items.length!==0);grid.classList.toggle("hidden",items.length===0);
 $("#resultsSubtitle").textContent=`${items.length} food ${items.length===1?"pick":"picks"} in ${filters.hotel!=="All"?filters.hotel+", ":""}${filters.city}${cityState(filters.city)}${filters.category!=="All"?" · "+filters.category:""} · budget ${budgetText()}`;
 updateMap(items,true);
 renderHotels();
}
function updateLoadMore(items){const left=items.length-shown,b=$("#loadMore");b.classList.toggle("hidden",left<=0);if(left>0)b.textContent=`Show more picks (${left} more)`}
function renderFavorites(){
 const items=getFavorites().map(id=>foodItems.find(x=>x.id===id)).filter(Boolean),grid=$("#favoritesGrid");
 grid.innerHTML=items.map(foodCard).join("");$("#favoritesEmpty").classList.toggle("hidden",items.length>0);grid.classList.toggle("hidden",items.length===0);$("#favoriteCount").textContent=items.length;
}
function applySearch(){
 shown=PAGE;const city=$("#citySelect").value;
 if($("#hotelSelect").dataset.city!==city)buildHotelSelect(city);
 filters.city=city;filters.hotel=$("#hotelSelect").value;filters.category=$("#foodSelect").value;
 const b=parseBudget($("#budgetSelect").value);filters.minPrice=b.min;filters.maxPrice=b.max;menuAll=false;
 document.querySelectorAll(".category-card").forEach(c=>c.classList.toggle("selected",c.dataset.category===filters.category));document.querySelectorAll(".budget-card").forEach(c=>c.classList.toggle("selected",c.dataset.budget===$("#budgetSelect").value));renderFood();
}
$("#citySelect").addEventListener("change",()=>buildHotelSelect($("#citySelect").value));
/* Enter/selecting inside a dropdown must NOT submit the form; only the "Find food" button does */
$("#searchForm").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName!=="BUTTON")e.preventDefault()});
$("#searchForm").addEventListener("submit",e=>{e.preventDefault();if(!e.submitter||e.submitter.id!=="findFoodBtn")return;applySearch();goPage(filters.hotel==="All"?"hotels":"results")});
$("#sortSelect").addEventListener("change",()=>{shown=PAGE;renderFood()});
$("#stateTabs").addEventListener("click",e=>{const t=e.target.closest("[data-state]");if(!t)return;stateFilter=t.dataset.state;buildCityGrid();document.querySelectorAll("#cityGrid [data-city]").forEach(b=>b.addEventListener("click",cityClick))});
$("#loadMore").addEventListener("click",()=>{shown+=PAGE;renderFoodKeepView()});
document.querySelectorAll("[data-budget]").forEach(b=>b.addEventListener("click",()=>{$("#budgetSelect").value=b.dataset.budget;$("#hotelSelect").value="All";applySearch();scrollToResults()}));
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{$("#foodSelect").value=b.dataset.category;$("#hotelSelect").value="All";applySearch();scrollToResults()}));
function cityClick(e){const b=e.currentTarget;$("#citySelect").value=b.dataset.city;buildHotelSelect(b.dataset.city);applySearch();goPage("hotels")}
document.querySelectorAll("[data-city]").forEach(b=>b.addEventListener("click",cityClick));
$("#resetFilters").addEventListener("click",()=>{$("#citySelect").value="Chennai";buildHotelSelect("Chennai");$("#foodSelect").value="All";$("#budgetSelect").value="0-100000";$("#sortSelect").value="recommended";applySearch()});
$("#skipHotel").addEventListener("click",()=>{$("#hotelSelect").value="All";applySearch();goPage("results")});
document.addEventListener("click",e=>{
 const fav=e.target.closest("[data-favorite]");
 if(fav){const id=Number(fav.dataset.favorite),ids=getFavorites(),updated=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];saveFavorites(updated);renderFoodKeepView();renderHotelMenu();renderFavorites();showToast(updated.includes(id)?"Saved to your favourites ♥":"Removed from favourites");return}
 const sm=e.target.closest("[data-showmap]");
 if(sm){focusOnMap(Number(sm.dataset.showmap));return}
 const detail=e.target.closest("[data-details]");
 if(detail){const item=foodItems.find(x=>x.id===Number(detail.dataset.details));if(item)showToast(`${item.description} · Sample listing only`);return}
 const rt=e.target.closest("[data-route]");
 if(rt){routeToHotel(decodeURIComponent(rt.dataset.route));return}
});
$("#menuToggle").addEventListener("click",()=>{const open=$("#navLinks").classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open))});
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>{$("#navLinks").classList.remove("open");$("#menuToggle").setAttribute("aria-expanded","false")}));

/* ---------- Map + live location (Leaflet / OpenStreetMap) ---------- */
let map=null,pinLayer=null,meMarker=null,meCircle=null,watchId=null,firstFix=true,pins={};
function initMap(){
 if(typeof L==="undefined"){$("#foodMap").innerHTML='<p style="padding:24px;color:#74796f;font-size:13px">The map could not load. Check your internet connection and refresh.</p>';return}
 map=L.map("foodMap",{scrollWheelZoom:false}).setView([13.06,80.23],11);
 L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
 pinLayer=(L.markerClusterGroup?L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:42,iconCreateFunction:c=>L.divIcon({html:`<div class="food-cluster">${c.getChildCount()}</div>`,className:"",iconSize:[38,38]})}):L.layerGroup()).addTo(map);
 map.on("click",()=>map.scrollWheelZoom.enable());
 map.on("mouseout",()=>map.scrollWheelZoom.disable());
}
function updateMap(items,fit){
 if(!map)return;pinLayer.clearLayers();pins={};
 const groups={};items.forEach(i=>{(groups[i.city+"|"+i.hotel]??=[]).push(i)});
 Object.entries(groups).forEach(([key,list])=>{
  const h=HOTEL_BY_KEY[key];if(!h)return;
  const min=Math.min(...list.map(x=>x.price)),cheap=[...list].sort((a,b)=>a.price-b.price).slice(0,5);
  const icon=L.divIcon({className:"",html:`<div class="hotel-pin ${key===activeRoute?"active":""}">🍽 ₹${min}${list.length>1?"+":""}</div>`,iconSize:[0,0]});
  const m=L.marker([h.lat,h.lng],{icon});pinLayer.addLayer(m);
  const dist=userPos?` · ${distLabel(h)}`:"";
  m.bindPopup(`<div class="map-pop"><strong>${h.name}</strong><small>${h.area}, ${h.city}${dist} · ★ ${h.rating.toFixed(1)}</small><ul>${cheap.map(x=>`<li><span>${x.emoji} ${x.name}</span><b>₹${x.price}</b></li>`).join("")}</ul>${list.length>5?`<small>+ ${list.length-5} more dishes</small>`:""}<button class="small-action primary" data-route="${encodeURIComponent(key)}">Route ↗</button><button class="small-action" data-hotel="${h.name.replace(/"/g,"&quot;")}">Menu</button></div>`);
  pins[key]=m;
 });
 if(fit)fitMap(items);
}
function fitMap(items){
 if(!map)return;const pts=(items||getFilteredItems()).map(i=>[i.lat,i.lng]);if(userPos)pts.push([userPos.lat,userPos.lng]);
 if(pts.length)map.fitBounds(pts,{padding:[40,40],maxZoom:15});
}
function focusOnMap(id){
 const item=foodItems.find(x=>x.id===id);if(!item||!map)return;const key=item.city+"|"+item.hotel;
 if(!pins[key])updateMap([...getFilteredItems(),item],false);
 goPage("map");
 setTimeout(()=>{map.invalidateSize();map.setView([item.lat,item.lng],16);if(pins[key]){pinLayer.zoomToShowLayer?pinLayer.zoomToShowLayer(pins[key],()=>pins[key].openPopup()):pins[key].openPopup()}},450);
}
/* ---- route from the live location to a restaurant ---- */
let routeLayer=null,routeMode="car",activeRoute=null,pendingRoute=null,routeReq=0,lastRoutePos=null,lastRouteAt=0;
const MODES={car:["routed-car","🚗 Drive","driving"],foot:["routed-foot","🚶 Walk","walking"],bike:["routed-bike","🚲 Cycle","bicycling"]};
function gmapsLink(h,withOrigin){return`https://www.google.com/maps/dir/?api=1${withOrigin&&userPos?`&origin=${userPos.lat},${userPos.lng}`:""}&destination=${h.lat},${h.lng}&travelmode=${MODES[routeMode][2]}`}
function showRouteBar(h,text){
 const bar=$("#routeBar");bar.classList.remove("hidden");
 bar.innerHTML=`<div class="rb-info"><strong>${h.name}</strong><br>${h.area}, ${h.city} · ${text}</div><div class="rb-modes">${Object.entries(MODES).map(([k,m])=>`<button type="button" class="${k===routeMode?"on":""}" data-rmode="${k}">${m[1]}</button>`).join("")}</div><a href="${gmapsLink(h,true)}" target="_blank" rel="noopener">Open in Google Maps ↗</a><button type="button" data-routeclear="1">✕</button>`;
}
function routeToHotel(key){
 const h=HOTEL_BY_KEY[key];if(!h)return;activeRoute=key;
 goPage("map");
 if(!userPos){
  pendingRoute=key;showRouteBar(h,"turn on location to see the way…");
  if(watchId===null)startLive();return;
 }
 drawRoute(h);
}
async function drawRoute(h){
 if(!map||!userPos)return;const my=++routeReq,from={...userPos};lastRoutePos=from;lastRouteAt=Date.now();
 showRouteBar(h,"finding the best route…");
 let line=null,km=null,min=null,exact=false;
 const urls=[`https://routing.openstreetmap.de/${MODES[routeMode][0]}/route/v1/driving/${from.lng},${from.lat};${h.lng},${h.lat}?overview=full&geometries=geojson`];
 if(routeMode==="car")urls.push(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${h.lng},${h.lat}?overview=full&geometries=geojson`);
 for(const u of urls){
  try{const r=await fetch(u);const j=await r.json();const rt=j.routes&&j.routes[0];if(rt){line=rt.geometry.coordinates.map(c=>[c[1],c[0]]);line.unshift([from.lat,from.lng]);line.push([h.lat,h.lng]);km=rt.distance/1000;min=rt.duration/60;exact=true;break}}catch(e){}
 }
 if(my!==routeReq)return;
 if(!line){line=[[from.lat,from.lng],[h.lat,h.lng]];km=distKm(h)}
 if(routeLayer)map.removeLayer(routeLayer);
 routeLayer=L.polyline(line,{color:"#f36b3f",weight:5,opacity:.9,dashArray:exact?null:"8 10"}).addTo(map);
 map.fitBounds(routeLayer.getBounds(),{padding:[50,50]});
 const d=km<1?`${Math.round(km*1000)} m`:`${km.toFixed(1)} km`;
 showRouteBar(h,exact?`${d} · about ${Math.max(1,Math.round(min))} min`:`${d} in a straight line (road route unavailable, use Google Maps)`);
 updateMap(getFilteredItems().concat(foodItems.filter(x=>x.city+"|"+x.hotel===activeRoute&&!inFilter(x)).slice(0,1)),false);
}
function clearRoute(){activeRoute=null;pendingRoute=null;routeReq++;if(routeLayer&&map)map.removeLayer(routeLayer);routeLayer=null;$("#routeBar").classList.add("hidden");if(map)updateMap(getFilteredItems(),false)}
document.addEventListener("click",e=>{
 const m=e.target.closest("[data-rmode]");if(m){routeMode=m.dataset.rmode;const h=HOTEL_BY_KEY[activeRoute];if(h){userPos?drawRoute(h):showRouteBar(h,"turn on location to see the way…")}return}
 if(e.target.closest("[data-routeclear]"))clearRoute();
});
function setStatus(t){$("#mapStatus").textContent=t}
function startLive(){
 if(!navigator.geolocation){setStatus("Your browser does not support location.");return}
 setStatus("Asking for permission and finding you…");$("#locateBtn").disabled=true;
 watchId=navigator.geolocation.watchPosition(pos=>{
  userPos={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:pos.coords.accuracy};
  const ll=[userPos.lat,userPos.lng];
  if(map){
   if(!meMarker){meMarker=L.marker(ll,{icon:L.divIcon({className:"",html:'<div class="me-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:1000}).addTo(map).bindTooltip("You are here");meCircle=L.circle(ll,{radius:userPos.acc,color:"#2f7de1",weight:1,fillOpacity:.1}).addTo(map)}
   else{meMarker.setLatLng(ll);meCircle.setLatLng(ll).setRadius(userPos.acc)}
  }
  $("#locateBtn").classList.add("hidden");$("#stopLocateBtn").classList.remove("hidden");
  setStatus(`Live location on · accurate to about ${Math.round(userPos.acc)} m`);
  if(firstFix){firstFix=false;if(pendingRoute){const h=HOTEL_BY_KEY[pendingRoute];pendingRoute=null;if(h)drawRoute(h)}else{goToNearestCity();showNearestHint();if(map)map.setView(ll,14)}}
  refreshAfterMove();
 },err=>{
  $("#locateBtn").disabled=false;
  setStatus(err.code===1?"Location permission was blocked. Allow it in your browser's site settings and try again.":err.code===3?"Finding you is taking too long. Try again outdoors or on Wi-Fi.":"Could not get your location right now.");
  if(pendingRoute){const h=HOTEL_BY_KEY[pendingRoute];pendingRoute=null;if(h){showRouteBar(h,"location blocked, opening Google Maps");window.open(gmapsLink(h,false),"_blank","noopener")}}
  stopLive(true);
 },{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
}
function stopLive(keepMsg){
 if(!pendingRoute&&!keepMsg)clearRoute();
 if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;userPos=null;firstFix=true;
 if(map){meMarker&&map.removeLayer(meMarker);meCircle&&map.removeLayer(meCircle)}meMarker=meCircle=null;
 $("#locateBtn").disabled=false;$("#locateBtn").classList.remove("hidden");$("#stopLocateBtn").classList.add("hidden");
 if(!keepMsg)setStatus("Location is off. Your position stays in your browser.");
 if($("#sortSelect").value==="nearest")$("#sortSelect").value="recommended";
 renderFood();renderFavorites();
}
let moveTimer;
function refreshAfterMove(){clearTimeout(moveTimer);moveTimer=setTimeout(()=>{renderFoodKeepView();renderFavorites();const h=HOTEL_BY_KEY[activeRoute];if(h&&userPos&&lastRoutePos&&Date.now()-lastRouteAt>15000&&distBetween(userPos,lastRoutePos)>0.08)drawRoute(h)},400)}
function distBetween(a,b){const rad=Math.PI/180,x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;return 12742*Math.asin(Math.sqrt(x))}
function renderFoodKeepView(){const items=getFilteredItems(),grid=$("#foodGrid");grid.innerHTML=items.slice(0,shown).map(foodCard).join("");updateLoadMore(items);updateMap(items,false)}
window.addEventListener("resize",()=>{if(map)map.invalidateSize()});
function goToNearestCity(){
 const rad=Math.PI/180;let best=null,bd=1e9;
 cityMeta.forEach(c=>{const dLat=(c.center[0]-userPos.lat)*rad,dLng=(c.center[1]-userPos.lng)*rad,a=Math.sin(dLat/2)**2+Math.cos(userPos.lat*rad)*Math.cos(c.center[0]*rad)*Math.sin(dLng/2)**2,d=12742*Math.asin(Math.sqrt(a));if(d<bd){bd=d;best=c}});
 if(best&&bd<60&&best.name!==filters.city){$("#citySelect").value=best.name;applySearch();showToast(`Showing food in ${best.name}, the nearest city to you`)}
}
function showNearestHint(){const items=getFilteredItems().sort((a,b)=>distKm(a)-distKm(b));if(items[0]){const d=distKm(items[0]);setStatus(`Live location on · nearest pick: ${items[0].name} at ${items[0].hotel}, ${distLabel(items[0])}`);if(d>60)showToast("You seem far from these listings. Try another city.")}}
$("#locateBtn").addEventListener("click",startLive);
$("#stopLocateBtn").addEventListener("click",()=>stopLive(false));
$("#fitBtn").addEventListener("click",()=>fitMap());
/* ---------- Hotels in the selected city + menu of a hotel ---------- */
let menuAll=false;
function renderHotels(){
 const all=(HOTELS[filters.city]||[]).map(h=>({...h,inBudget:h.items.filter(inFilter)}));
 const list=all.filter(h=>h.inBudget.length).sort((a,b)=>b.rating-a.rating);
 $("#hotelsTitle").innerHTML=`Restaurants in ${filters.city}<span class="title-dot">.</span>`;
 $("#hotelsSubtitle").textContent=`${list.length} of ${all.length} restaurants have food with budget ${budgetText()}${filters.category!=="All"?" · "+filters.category:""}. Tap one to see its menu.`;
 $("#hotelGrid").innerHTML=list.length?list.map(h=>`<button class="hotel-card ${h.name===filters.hotel?"selected":""}" data-hotel="${h.name.replace(/"/g,"&quot;")}"><span class="hotel-top"><strong>${h.name}</strong><span class="food-rating"><span>★</span> ${h.rating.toFixed(1)}</span></span><small>📍 ${h.area}, ${filters.city}</small><span class="hotel-chips">${[...new Set(h.items.map(i=>i.category))].slice(0,4).map(c=>`<i>${c}</i>`).join("")}</span><span class="hotel-foot"><span>₹${h.min} – ₹${h.max}</span><span>${h.inBudget.length} of ${h.items.length} dishes in budget</span></span></button>`).join(""):`<p class="hotel-empty">No restaurants match this budget in ${filters.city}. Try another budget.</p>`;
 renderHotelMenu();
}
function renderHotelMenu(){
 const box=$("#hotelMenu");
 const h=filters.hotel!=="All"?HOTEL_BY_KEY[filters.city+"|"+filters.hotel]:null;
 if(!h){box.classList.add("hidden");box.innerHTML="";return}
 const n=h.items.filter(inFilter).length;
 box.classList.remove("hidden");
 box.innerHTML=`<div class="hotel-menu-head"><div><span class="section-kicker">YOUR RESTAURANT</span><h3>${h.name}</h3><p>${h.area}, ${filters.city} · ★ ${h.rating.toFixed(1)} · ₹${h.min} – ₹${h.max}</p></div><div class="hotel-menu-actions"><button class="small-action primary" data-route="${encodeURIComponent(h.key)}">Route ↗</button><button class="small-action" data-hotelclose="1">Change restaurant</button></div></div><p class="hotel-menu-note">${menuAll?`Showing the full menu (${h.items.length} dishes).`:`Showing ${n} of ${h.items.length} dishes within budget ${budgetText()}.`} <button class="text-btn inline" data-menuall="1">${menuAll?"Show only my budget":"Show full menu"}</button></p>`;
}
document.addEventListener("click",e=>{
 const hc=e.target.closest("[data-hotel]");
 if(hc){$("#hotelSelect").value=hc.dataset.hotel;applySearch();goPage("results");return}
 if(e.target.closest("[data-hotelclose]")){$("#hotelSelect").value="All";applySearch();goPage("hotels");return}
 if(e.target.closest("[data-menuall]")){menuAll=!menuAll;shown=PAGE;renderFood()}
});

initMap();
saveFavorites(getFavorites());renderFood();renderFavorites();

/* ---------- Cart, bill and daily records ---------- */
var CART_KEY="foodwise-cart",REC_KEY="foodwise-records";
var lastBill=null; /* receipt shown right after confirming */
function readJSON(k){try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return[]}}
function getCart(){return readJSON(CART_KEY).filter(l=>foodItems.some(f=>f.id===l.id))}
function saveCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c))}catch{}updateCartUI()}
function getRecords(){return readJSON(REC_KEY)}
function saveRecords(r){try{localStorage.setItem(REC_KEY,JSON.stringify(r))}catch{}}
function rupee(n){return "₹"+n.toLocaleString("en-IN");}
function foodById(id){return foodItems.find(f=>f.id===id)}
function cartQty(id){const l=getCart().find(x=>x.id===id);return l?l.qty:0}
function cartLabel(id){const q=cartQty(id);return q?`✓ In cart (${q}) · add one more`:"＋ Add to cart"}
function cartTotals(cart){let items=0,total=0;cart.forEach(l=>{const f=foodById(l.id);items+=l.qty;total+=f.price*l.qty});return{items,total}}
function updateCartUI(){
 const cart=getCart();$("#cartCount").textContent=cart.reduce((s,l)=>s+l.qty,0);
 document.querySelectorAll("[data-addcart]").forEach(b=>b.textContent=cartLabel(Number(b.dataset.addcart)));
 if(currentRoute()==="cart")renderCart();
}
function addToCart(id){
 const cart=getCart(),l=cart.find(x=>x.id===id);if(l)l.qty++;else cart.push({id,qty:1});
 saveCart(cart);const f=foodById(id);showToast(`${f.name} added to cart · ${rupee(cartTotals(cart).total)} so far`);
}
function pad(n){return String(n).padStart(2,"0")}
function dateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function prettyDate(key){const[y,m,d]=key.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
function billLines(lines){return lines.map(l=>`<div class="bill-line"><span class="bill-name">${l.emoji} ${l.name}<small>${l.hotel}</small></span><span class="bill-qty">${l.qty} × ${rupee(l.price)}</span><strong>${rupee(l.price*l.qty)}</strong></div>`).join("")}

function renderCart(){
 const box=$("#cartContent");
 if(lastBill){
  const b=lastBill;
  box.innerHTML=`<div class="bill-card receipt"><div class="receipt-ok">✓</div><h3>Order confirmed</h3><p class="bill-meta">Bill #${b.id} · ${prettyDate(b.date)} · ${b.time}</p><div class="bill-lines">${billLines(b.items)}</div><div class="bill-total"><span>Total bill</span><strong>${rupee(b.total)}</strong></div><p class="bill-note">Saved to your daily records.</p><div class="cart-actions"><a class="button button-primary" href="#records">View records <span>→</span></a><button class="button button-dark" id="newOrderBtn" type="button">Order more</button></div></div>`;
  return;
 }
 const cart=getCart();
 if(!cart.length){box.innerHTML=`<div class="empty-state"><span>🛒</span><h3>Your cart is empty</h3><p>Pick one or more foods and tap “Add to cart”.</p><a class="button button-dark" href="#find-food">Find food</a></div>`;return}
 const t=cartTotals(cart);
 box.innerHTML=`<div class="cart-layout"><div class="cart-list">${cart.map(l=>{const f=foodById(l.id);return `<article class="cart-item"><div class="cart-thumb" style="background:${f.bg}">${f.emoji}</div><div class="cart-info"><h3>${f.name}</h3><p>${f.hotel} · ${f.area}, ${f.city}</p><div class="cart-controls"><div class="qty" aria-label="Quantity"><button data-qty="${f.id}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-qty="${f.id}" data-d="1" aria-label="Increase">+</button></div><button class="small-action" data-replace="${f.id}">⇄ Replace</button><button class="small-action danger" data-remove="${f.id}">Remove</button></div></div><div class="cart-price"><small>${l.qty} × ${rupee(f.price)}</small><strong>${rupee(f.price*l.qty)}</strong></div></article>`}).join("")}</div>
 <aside class="bill-card"><h3>Bill summary</h3><div class="bill-lines">${billLines(cart.map(l=>({...foodById(l.id),qty:l.qty})))}</div><div class="bill-row"><span>Items</span><strong>${t.items}</strong></div><div class="bill-total"><span>Total expenses</span><strong>${rupee(t.total)}</strong></div><button class="button button-primary full" id="confirmBtn" type="button">Confirm foods &amp; get bill</button><button class="text-btn" id="clearCartBtn" type="button">Clear cart</button></aside></div>`;
}
function confirmOrder(){
 const cart=getCart();if(!cart.length)return;
 const now=new Date(),recs=getRecords(),t=cartTotals(cart);
 const bill={id:(recs.reduce((m,r)=>Math.max(m,r.id),0)+1),date:dateKey(now),time:now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
  items:cart.map(l=>{const f=foodById(l.id);return{id:f.id,name:f.name,hotel:f.hotel,emoji:f.emoji,price:f.price,qty:l.qty}}),total:t.total};
 recs.push(bill);saveRecords(recs);lastBill=bill;saveCart([]);showToast("Order confirmed · bill saved to records");
}
function renderRecords(){
 const recs=getRecords(),box=$("#recordsContent");
 if(!recs.length){box.innerHTML=`<div class="empty-state"><span>🧾</span><h3>No records yet</h3><p>Confirm an order in your cart and its bill will be saved here by day.</p><a class="button button-dark" href="#cart">Go to cart</a></div>`;return}
 const days={};recs.forEach(r=>(days[r.date]=days[r.date]||[]).push(r));
 const keys=Object.keys(days).sort().reverse(),grand=recs.reduce((s,r)=>s+r.total,0),today=days[dateKey(new Date())]||[];
 const todayTotal=today.reduce((s,r)=>s+r.total,0);
 box.innerHTML=`<div class="rec-stats"><div><small>Spent today</small><strong>${rupee(todayTotal)}</strong></div><div><small>Days recorded</small><strong>${keys.length}</strong></div><div><small>All-time total</small><strong>${rupee(grand)}</strong></div></div>`+
 keys.map((k,i)=>{const list=days[k].slice().reverse(),sum=list.reduce((s,r)=>s+r.total,0);
  return `<details class="day-card" ${i===0?"open":""}><summary><span><strong>${prettyDate(k)}</strong><small>${list.length} ${list.length===1?"bill":"bills"}</small></span><em>${rupee(sum)}</em></summary>${list.map(r=>`<div class="bill-card rec-bill"><div class="rec-head"><span>Bill #${r.id} · ${r.time}</span><button class="small-action danger" data-delrec="${r.id}">Delete</button></div><div class="bill-lines">${billLines(r.items)}</div><div class="bill-total"><span>Bill total</span><strong>${rupee(r.total)}</strong></div></div>`).join("")}<div class="day-total"><span>Total for the day</span><strong>${rupee(sum)}</strong></div></details>`}).join("")+
 `<div class="cart-actions"><button class="text-btn" id="clearRecBtn" type="button">Clear all records</button></div>`;
}

/* Replace a cart item with another food */
var replacingId=null;
function openReplace(id){
 replacingId=id;const f=foodById(id);
 $("#replaceSub").textContent=`Replacing ${f.name} (${rupee(f.price)}). Pick another food; quantity stays the same.`;
 $("#replaceCity").innerHTML=`<option value="All">All cities</option>`+cityMeta.map(c=>`<option ${c.name===f.city?"selected":""}>${c.name}</option>`).join("");
 $("#replaceSearch").value="";renderReplaceList();$("#replaceModal").classList.remove("hidden");$("#replaceSearch").focus();
}
function renderReplaceList(){
 const q=$("#replaceSearch").value.trim().toLowerCase(),c=$("#replaceCity").value;
 const list=foodItems.filter(x=>x.id!==replacingId&&(c==="All"||x.city===c)&&(!q||(x.name+" "+x.hotel+" "+x.category).toLowerCase().includes(q))).sort((a,b)=>a.price-b.price).slice(0,60);
 $("#replaceList").innerHTML=list.length?list.map(x=>`<button class="replace-item" data-pick="${x.id}"><span class="cart-thumb sm" style="background:${x.bg}">${x.emoji}</span><span class="ri-text"><strong>${x.name}</strong><small>${x.hotel} · ${x.area}, ${x.city}</small></span><b>${rupee(x.price)}</b></button>`).join(""):`<p class="modal-sub">No foods match.</p>`;
}
function closeReplace(){$("#replaceModal").classList.add("hidden");replacingId=null}
function doReplace(newId){
 const cart=getCart(),i=cart.findIndex(l=>l.id===replacingId);if(i<0)return closeReplace();
 const old=foodById(replacingId),nu=foodById(newId),dup=cart.findIndex(l=>l.id===newId);
 if(dup>=0&&dup!==i){cart[dup].qty+=cart[i].qty;cart.splice(i,1)}else cart[i].id=newId;
 closeReplace();saveCart(cart);showToast(`Replaced ${old.name} with ${nu.name}`);
}
$("#replaceSearch").addEventListener("input",renderReplaceList);
$("#replaceCity").addEventListener("change",renderReplaceList);
$("#replaceClose").addEventListener("click",closeReplace);
$("#replaceModal").addEventListener("click",e=>{if(e.target.id==="replaceModal")closeReplace()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&replacingId!==null)closeReplace()});

document.addEventListener("click",e=>{
 const t=e.target;let b;
 if(b=t.closest("[data-addcart]")){addToCart(Number(b.dataset.addcart));return}
 if(b=t.closest("[data-qty]")){const cart=getCart(),l=cart.find(x=>x.id===Number(b.dataset.qty));if(l){l.qty=Math.max(1,Math.min(20,l.qty+Number(b.dataset.d)));saveCart(cart)}return}
 if(b=t.closest("[data-remove]")){const id=Number(b.dataset.remove);saveCart(getCart().filter(l=>l.id!==id));showToast("Removed from cart");return}
 if(b=t.closest("[data-replace]")){openReplace(Number(b.dataset.replace));return}
 if(b=t.closest("[data-pick]")){doReplace(Number(b.dataset.pick));return}
 if(t.closest("#confirmBtn")){confirmOrder();return}
 if(t.closest("#newOrderBtn")){lastBill=null;location.hash="#find-food";return}
 if(t.closest("#clearCartBtn")){saveCart([]);return}
 if(b=t.closest("[data-delrec]")){const id=Number(b.dataset.delrec);saveRecords(getRecords().filter(r=>r.id!==id));renderRecords();return}
 if(t.closest("#clearRecBtn")){if(confirm("Delete all saved records?")){saveRecords([]);renderRecords()}return}
});

/* Hash router: every section in the top menu is its own page */
const PAGES=["home","find-food","budget","popular","results","hotels","map","favorites","cart","records"];
function currentRoute(){const h=location.hash.slice(1);return PAGES.includes(h)?h:"home"}
function route(){
 const r=currentRoute();
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("hidden",p.dataset.page!==r));
 document.querySelectorAll("#navLinks a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+r));
 if(r==="cart"){if(lastBill&&!getRecords().some(x=>x.id===lastBill.id))lastBill=null;renderCart()}
 else if(r==="records"){lastBill=null;renderRecords()}
 else if(r==="favorites")renderFavorites();
 else if(r==="map"&&map)setTimeout(()=>{map.invalidateSize();if(!activeRoute)fitMap()},60);
 window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);
updateCartUI();route();
