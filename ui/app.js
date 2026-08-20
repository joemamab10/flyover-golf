const courses=[
{name:"Waveland Golf Course",city:"Des Moines, IA",phone:"515-248-6302",dist:"4.8 mi",drive:12,price:42,rating:4.6,weather:93,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"waveland",bookingUrl:"https://golfwaveland.com/",times:[{t:"8:00 AM",h:8},{t:"8:30 AM",h:8},{t:"9:00 AM",h:9}]},
{name:"A.H. Blank Golf Course",city:"Des Moines, IA",phone:"515-248-6300",dist:"7.2 mi",drive:16,price:39,rating:4.4,weather:93,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"ah-blank",bookingUrl:"https://golfblank.com/",times:[{t:"7:48 AM",h:7},{t:"8:12 AM",h:8},{t:"8:36 AM",h:8}]},
{name:"Bright Grandview Golf Course",city:"Des Moines, IA",phone:"515-248-6301",dist:"6.6 mi",drive:15,price:38,rating:4.3,weather:92,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"bright-grandview",bookingUrl:"https://golfbrightgrandview.com/",times:[{t:"7:56 AM",h:7},{t:"8:20 AM",h:8},{t:"8:44 AM",h:8}]},
{name:"Jester Park Golf Course",city:"Granger, IA",phone:"515-999-2903",dist:"18.5 mi",drive:27,price:44,rating:4.6,weather:91,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"jester-park",bookingUrl:"https://jesterparkgolf.com/",times:[{t:"8:08 AM",h:8},{t:"8:32 AM",h:8},{t:"9:04 AM",h:9}]},
{name:"Otter Creek Golf Course",city:"Ankeny, IA",phone:"515-965-6464",dist:"14.8 mi",drive:23,price:46,rating:4.6,weather:92,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"otter-creek",bookingUrl:"https://www.ottercreekankeny.com/",times:[{t:"7:50 AM",h:7},{t:"8:20 AM",h:8},{t:"8:50 AM",h:8}]},
{name:"The Legacy Golf Club",city:"Norwalk, IA",phone:"515-287-7885",dist:"12.9 mi",drive:22,price:49,rating:4.7,weather:95,holes:18,walk:true,cart:true,provider:"clubcaddie",providerCourseId:"legacy-norwalk",bookingUrl:"https://thelegacygolfclub.com/",times:[{t:"8:10 AM",h:8},{t:"8:40 AM",h:8},{t:"9:10 AM",h:9}]},
{name:"Tournament Club of Iowa",city:"Polk City, IA",phone:"515-984-9440",dist:"19.4 mi",drive:29,price:55,rating:4.8,weather:94,holes:18,walk:true,cart:true,provider:"foreup",providerCourseId:"tci-polk-city",bookingUrl:"https://tcofiowa.com/",times:[{t:"8:00 AM",h:8},{t:"8:30 AM",h:8},{t:"9:00 AM",h:9}]},
{name:"Copper Creek Golf Club",city:"Pleasant Hill, IA",phone:"515-263-1600",dist:"9.7 mi",drive:18,price:43,rating:4.5,weather:92,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"copper-creek",bookingUrl:"https://coppercreekgolfclub.com/",times:[{t:"7:52 AM",h:7},{t:"8:24 AM",h:8},{t:"8:56 AM",h:8}]},
{name:"Beaver Creek Golf Club",city:"Grimes, IA",phone:"515-986-3221",dist:"13.6 mi",drive:21,price:41,rating:4.4,weather:91,holes:18,walk:true,cart:true,provider:"direct",providerCourseId:"beaver-creek",bookingUrl:"https://beavercreek-golf.com/",times:[{t:"8:04 AM",h:8},{t:"8:36 AM",h:8},{t:"9:08 AM",h:9}]}
];

/* ============================
   Phase 2 Inventory Providers
   ============================ */
class InventoryProvider {
  constructor(id,label){this.id=id;this.label=label}
  async search(course,date,players){throw new Error("Provider search() not implemented")}
  normalize(raw,course){throw new Error("Provider normalize() not implemented")}
}

class ForeUpProvider extends InventoryProvider {
  constructor(){super("foreup","foreUP")}
  async search(course,date,players){
    // POC payload shaped like a provider response.
    // Replace ONLY this method with the authorized foreUP request later.
    const raw={courseId:course.providerCourseId,date,slots:course.times.map((x,i)=>({
      time:x.t,hour:x.h,holes:course.holes,price:course.price+(i===2?3:0),
      availablePlayers:Math.max(players,4-i),bookingUrl:course.bookingUrl
    }))};
    return raw.slots.map(slot=>this.normalize(slot,course));
  }
  normalize(raw,course){
    return {
      provider:this.id,providerLabel:this.label,courseId:course.providerCourseId,
      courseName:course.name,time:raw.time,hour:raw.hour,price:raw.price,
      holes:raw.holes,availablePlayers:raw.availablePlayers,cartIncluded:false,
      bookingUrl:raw.bookingUrl,isLive:false
    };
  }
}

class ClubCaddieProvider extends InventoryProvider {
  constructor(){super("clubcaddie","Club Caddie")}
  async search(course,date,players){
    const raw=course.times.map((x,i)=>({
      teeTime:x.t,hour:x.h,rate:course.price+(i===1?2:0),spots:Math.max(players,4-i),
      holes:course.holes,url:course.bookingUrl
    }));
    return raw.map(slot=>this.normalize(slot,course));
  }
  normalize(raw,course){
    return {
      provider:this.id,providerLabel:this.label,courseId:course.providerCourseId,
      courseName:course.name,time:raw.teeTime,hour:raw.hour,price:raw.rate,
      holes:raw.holes,availablePlayers:raw.spots,cartIncluded:false,
      bookingUrl:raw.url,isLive:false
    };
  }
}

class DirectCourseProvider extends InventoryProvider {
  constructor(){super("direct","Course Direct")}
  async search(course,date,players){
    return course.times.map(x=>this.normalize({time:x.t,hour:x.h},course));
  }
  normalize(raw,course){
    return {
      provider:this.id,providerLabel:this.label,courseId:course.providerCourseId,
      courseName:course.name,time:raw.time,hour:raw.hour,price:course.price,
      holes:course.holes,availablePlayers:4,cartIncluded:false,
      bookingUrl:course.bookingUrl,isLive:false
    };
  }
}

const providers={
  foreup:new ForeUpProvider(),
  clubcaddie:new ClubCaddieProvider(),
  direct:new DirectCourseProvider()
};

let normalizedInventory=[];

async function loadNormalizedInventory(date="today",players=4){
  const all=[];
  for(const course of courses){
    const adapter=providers[course.provider]||providers.direct;
    const slots=await adapter.search(course,date,players);
    all.push(...slots.map(slot=>({...slot,course})));
  }
  return all;
}

async function refreshInventory(){
  const players=+(document.getElementById("prefPlayers")?.value||4);
  normalizedInventory=await loadNormalizedInventory("today",players);

  // Scout still works with course objects; hydrate them from normalized inventory.
  courses.forEach(course=>{
    const slots=normalizedInventory.filter(x=>x.courseId===course.providerCourseId);
    if(!slots.length)return;
    course.times=slots.map(x=>({t:x.time,h:x.hour}));
    course.price=Math.min(...slots.map(x=>x.price));
    course.inventorySource=slots[0].providerLabel;
    course.inventoryLive=slots.some(x=>x.isLive);
  });
}


const API_BASE_URL="http://localhost:3000";
let currentApiRecommendations=[];
let selectedApiRecommendation=null;

function setApiStatus(isOnline){
  const dot=document.getElementById("apiStatusDot");
  const title=document.getElementById("apiStatusTitle");
  const text=document.getElementById("apiStatusText");
  if(!dot||!title||!text)return;
  dot.classList.remove("live","offline");
  if(isOnline){
    dot.classList.add("live");
    title.textContent="Prototype mode · API connected";
    text.textContent="Real courses with demo tee times, prices and Flyover Scores.";
  }else{
    dot.classList.add("offline");
    title.textContent="Prototype mode · Local fallback";
    text.textContent="The API is offline, so Scout is showing local demo recommendations.";
  }
}

async function checkApiHealth(){
  try{
    const r=await fetch(`${API_BASE_URL}/health`);
    if(!r.ok)throw new Error("health");
    const data=await r.json();
    setApiStatus(true);
    return true;
  }catch(e){
    setApiStatus(false);
    return false;
  }
}

function buildScoutRequest(){
  const p=getPrefs();
  return {
    players:p.players,maxPrice:p.price,maxDriveMinutes:p.drive,when:p.when,
    holes:p.holes==="either"?"either":Number(p.holes),ride:p.ride,style:p.style,date:"today"
  };
}

async function fetchScoutRecommendations(){
  const r=await fetch(`${API_BASE_URL}/api/scout/recommendations`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(buildScoutRequest())
  });
  if(!r.ok)throw new Error(`Scout API ${r.status}`);
  const data=await r.json();
  return {
    recommendations:data.recommendations||[],
    inventory:data.inventory||data.recommendations||[]
  };
}

function buildApiReason(item){
  const reasons=[];
  if(item.factors?.price>=92)reasons.push("excellent value");
  if(item.factors?.drive>=92)reasons.push("short drive");
  if(item.factors?.course>=94)reasons.push("top course quality");
  if(item.factors?.weather>=94)reasons.push("excellent weather");
  if(item.factors?.time>=95)reasons.push("ideal time fit");
  if(!reasons.length)return "Balanced match across price, distance, course quality and conditions.";
  const s=reasons.slice(0,3).join(", ")+".";
  return s.charAt(0).toUpperCase()+s.slice(1);
}

function renderApiRecommendations(items){
  if(!items.length)return false;
  const best=items[0],hero=document.getElementById("scoutResult");
  hero.querySelector(".scorebadge").innerHTML=`${best.flyoverScore}<small>SCORE</small>`;
  hero.querySelector("h3").textContent=`${best.courseName.replace(" Golf Course","")} · ${best.time}`;
  hero.querySelector(".pick-meta").textContent=`$${best.price} · ${best.course.driveMinutes} min away · ★ ${best.course.rating.toFixed(1)} · weather ${best.course.weatherScore}/100`;
  hero.querySelector(".pick-reason").textContent=buildApiReason(best);
  document.getElementById("openScoutPick").onclick=()=>openApiCourse(best);

  document.querySelectorAll(".reco-mini").forEach((el,i)=>{
    const item=items[i+1]; if(!item)return;
    el.querySelector(".scorebadge").textContent=item.flyoverScore;
    el.querySelector("strong").textContent=`${item.courseName.replace(" Golf Course","")} · ${item.time}`;
    el.querySelector("small:last-child").textContent=`$${item.price} · ${item.course.driveMinutes} min away · ${item.providerLabel}`;
    el.onclick=()=>openApiCourse(item);
  });
  return true;
}

function openApiCourse(item){
  selectedApiRecommendation=item;
  showScreen("course");
  document.getElementById("courseName").textContent=item.courseName;
  document.getElementById("courseCity").innerHTML=`${item.course.city}<div class="provider-pill"><span class="provider-dot ${item.isLive?"live":""}"></span>${item.providerLabel} · ${item.isLive?"LIVE":"POC FEED"}</div>`;
  const fallbackCourse=courses.find(course=>course.providerCourseId===item.courseId);
  renderCoursePhone(item.course.phone||fallbackCourse?.phone,item.courseName);
  document.getElementById("detailScore").textContent=item.flyoverScore;
  document.getElementById("scoreLabel").textContent=item.flyoverScore>=90?"Flyover Pick":"Great match for you";
  document.getElementById("scoreReason").textContent=buildApiReason(item);
  [["Price","price"],["Drive","drive"],["Course","course"],["Weather","weather"]].forEach(([id,key])=>{
    const v=item.factors?.[key]??0;
    document.getElementById("bar"+id).style.width=v+"%";
    document.getElementById("factor"+id).textContent=v;
  });
  const slots=currentApiRecommendations.filter(x=>x.courseId===item.courseId);
  document.getElementById("slots").innerHTML=slots.map(x=>`<div class="slot"><span>${x.time}</span><button class="api-book-slot" data-time="${x.time}" data-course="${x.courseId}">SELECT · $${x.price}</button></div>`).join("");
  document.querySelectorAll(".api-book-slot").forEach(btn=>btn.onclick=()=>{
    const x=currentApiRecommendations.find(r=>r.courseId===btn.dataset.course&&r.time===btn.dataset.time);
    if(x)openApiBooking(x);
  });
}

function openApiBooking(item){
  selectedApiRecommendation=item;
  bookingCourse={name:item.courseName,city:item.course.city,dist:`${item.course.driveMinutes} min`,price:item.price,bookingUrl:item.bookingUrl};
  bookingTime=item.time;
  document.getElementById("bookCourse").textContent=item.courseName;
  document.getElementById("bookMeta").textContent=item.course.city;
  document.getElementById("bookTime").textContent=`Today · ${item.time}`;
  const source=document.getElementById("bookSource"); if(source)source.textContent=`${item.providerLabel} · ${item.isLive?"LIVE":"POC FEED"}`;
  bookingPlayers=+(document.getElementById("prefPlayers")?.value||4);
  document.querySelectorAll(".player").forEach((b,i)=>b.classList.toggle("active",i+1===bookingPlayers));
  resetBookingAddons();
  updateBookingTotal();
  showScreen("booking");
}

async function runScoutFromApi(){
  try{
    const result=await fetchScoutRecommendations();
    currentApiRecommendations=result.inventory;
    setApiStatus(true,"flyover-golf-api");
    renderApiRecommendations(result.recommendations);
    return true;
  }catch(e){
    console.warn("API unavailable; using local fallback",e);
    setApiStatus(false);
    return false;
  }
}

const prefState={holes:"18",ride:"cart",style:"balanced"};
function $(id){return document.getElementById(id)}
function renderCoursePhone(phone,courseName){
  const link=$("coursePhoneLink");
  const digits=String(phone||"").replace(/\D/g,"");
  if(digits.length!==10){
    link.hidden=true;
    link.removeAttribute("href");
    link.removeAttribute("aria-label");
    return;
  }
  const formatted=`(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  $("coursePhone").textContent=formatted;
  link.href=`tel:+1${digits}`;
  link.setAttribute("aria-label",`Call ${courseName} clubhouse at ${formatted}`);
  link.hidden=false;
}
function scrollBehavior(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}
function setGreeting(){
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  document.querySelector("#home .hello").textContent=`${greeting} 👋`;
}
setGreeting();
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)))}
function getPrefs(){return{when:$("prefWhen").value,players:+$("prefPlayers").value,drive:+$("prefDrive").value,price:+$("prefPrice").value,holes:prefState.holes,ride:prefState.ride,style:prefState.style}}
function closeScoutSelects(except){
  document.querySelectorAll(".scout-select.open").forEach(control=>{if(control!==except){control.classList.remove("open");control.querySelector(".scout-select-button").setAttribute("aria-expanded","false")}});
}
function initScoutSelects(){
  document.querySelectorAll(".scout-field select").forEach((select,index)=>{
    select.classList.add("scout-native-select");select.tabIndex=-1;select.setAttribute("aria-hidden","true");
    const label=select.previousElementSibling;
    label.id=`scout-select-label-${index}`;
    const control=document.createElement("div");
    control.className="scout-select";
    const trigger=document.createElement("button");
    trigger.type="button";trigger.id=`scout-select-trigger-${index}`;trigger.className="scout-select-button";trigger.setAttribute("aria-haspopup","listbox");trigger.setAttribute("aria-expanded","false");trigger.setAttribute("aria-labelledby",`${label.id} ${trigger.id}`);
    const menu=document.createElement("div");
    menu.id=`scout-select-menu-${index}`;menu.className="scout-select-menu";menu.setAttribute("role","listbox");menu.setAttribute("aria-labelledby",label.id);trigger.setAttribute("aria-controls",menu.id);
    [...select.options].forEach(option=>{
      const item=document.createElement("button");
      item.type="button";item.className="scout-select-option";item.dataset.value=option.value;item.textContent=option.textContent;item.setAttribute("role","option");
      item.onclick=event=>{event.stopPropagation();select.value=option.value;select._scoutSync();control.classList.remove("open");trigger.setAttribute("aria-expanded","false");select.dispatchEvent(new Event("change",{bubbles:true}));trigger.focus()};
      item.onkeydown=event=>{
        const items=[...menu.querySelectorAll(".scout-select-option")],current=items.indexOf(item);
        const nextIndex=event.key==="ArrowDown"?Math.min(current+1,items.length-1):event.key==="ArrowUp"?Math.max(current-1,0):event.key==="Home"?0:event.key==="End"?items.length-1:-1;
        if(nextIndex>=0){event.preventDefault();items[nextIndex].focus()}
        if(event.key==="Enter"||event.key===" "){event.preventDefault();item.click()}
        if(event.key==="Escape"){event.preventDefault();control.classList.remove("open");trigger.setAttribute("aria-expanded","false");trigger.focus()}
      };
      menu.appendChild(item);
    });
    select._scoutSync=()=>{const selected=select.options[select.selectedIndex];trigger.textContent=selected.textContent;menu.querySelectorAll(".scout-select-option").forEach(item=>{const active=item.dataset.value===select.value;item.classList.toggle("selected",active);item.setAttribute("aria-selected",String(active))})};
    trigger.onclick=event=>{event.stopPropagation();const opening=!control.classList.contains("open");closeScoutSelects(control);control.classList.toggle("open",opening);trigger.setAttribute("aria-expanded",String(opening))};
    trigger.onkeydown=event=>{if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();if(!control.classList.contains("open"))trigger.click();const items=menu.querySelectorAll(".scout-select-option");(event.key==="ArrowUp"?items[items.length-1]:menu.querySelector(".selected"))?.focus()}if(event.key==="Escape"){control.classList.remove("open");trigger.setAttribute("aria-expanded","false")}};
    control.append(trigger,menu);select.after(control);select._scoutSync();
  });
  document.addEventListener("click",()=>closeScoutSelects());
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeScoutSelects()});
}
initScoutSelects();
function scoreCourse(c,p){
  const matchingSlots=c.times.filter(x=>p.when==="morning"?x.h<12:p.when==="afternoon"?x.h>=12:true);
  const slot=(matchingSlots[0]||c.times[0]);

  // Normalized component scores
  const priceRatio=c.price/p.price;
  let price;
  if(priceRatio<=0.70) price=100;
  else if(priceRatio<=1.00) price=100-((priceRatio-.70)/.30)*20;
  else price=80-Math.min(60,(priceRatio-1)*120);
  price=clamp(price);

  const driveRatio=c.drive/p.drive;
  let drive;
  if(driveRatio<=0.60) drive=100;
  else if(driveRatio<=1.00) drive=100-((driveRatio-.60)/.40)*22;
  else drive=78-Math.min(58,(driveRatio-1)*110);
  drive=clamp(drive);

  const course=clamp(((c.rating-3.5)/1.5)*35+65);
  const weather=clamp(c.weather);

  let timeFit=100;
  if(p.when==="morning" && slot.h>=12) timeFit=45;
  if(p.when==="afternoon" && slot.h<12) timeFit=55;
  if(p.when==="any") timeFit=96;

  let formatFit=100;
  if(p.holes!=="either" && +p.holes!==c.holes) formatFit=35;

  let rideFit=100;
  if(p.ride==="walk" && !c.walk) rideFit=45;
  if(p.ride==="cart" && !c.cart) rideFit=45;

  // Preference-based weighting
  let weights={price:.20,drive:.19,course:.24,weather:.17,time:.10,format:.05,ride:.05};
  if(p.style==="value") weights={price:.37,drive:.20,course:.15,weather:.10,time:.08,format:.05,ride:.05};
  if(p.style==="quality") weights={price:.10,drive:.13,course:.42,weather:.16,time:.09,format:.05,ride:.05};
  if(p.style==="flex") weights={price:.18,drive:.15,course:.26,weather:.23,time:.08,format:.05,ride:.05};

  let total=
    price*weights.price +
    drive*weights.drive +
    course*weights.course +
    weather*weights.weather +
    timeFit*weights.time +
    formatFit*weights.format +
    rideFit*weights.ride;

  // Hard-constraint penalties
  if(c.price>p.price) total-=14;
  if(c.drive>p.drive) total-=12;
  if(formatFit<60) total-=12;
  if(rideFit<60) total-=8;
  if(timeFit<60) total-=10;

  total=clamp(total);

  const reasons=[];
  if(price>=92) reasons.push("excellent value");
  else if(price>=82) reasons.push("good price");
  if(drive>=92) reasons.push("short drive");
  else if(drive>=82) reasons.push("reasonable drive");
  if(course>=94) reasons.push("top course quality");
  else if(course>=88) reasons.push("strong course quality");
  if(weather>=94) reasons.push("excellent weather");
  if(timeFit>=95) reasons.push("ideal time fit");

  let reason;
  if(reasons.length){
    reason=reasons.slice(0,3).join(", ")+".";
  } else {
    reason="Balanced fit across price, distance, course quality and conditions.";
  }
  reason=reason.charAt(0).toUpperCase()+reason.slice(1);

  const tradeoffs=[];
  if(c.price>p.price) tradeoffs.push(`$${c.price-p.price} over budget`);
  if(c.drive>p.drive) tradeoffs.push(`${c.drive-p.drive} min beyond drive target`);
  if(timeFit<60) tradeoffs.push("outside preferred time");
  if(formatFit<60) tradeoffs.push("hole format mismatch");
  if(rideFit<60) tradeoffs.push("ride/walk mismatch");

  return{
    score:total,
    slot:slot.t,
    reason,
    tradeoffs,
    factors:{price,drive,course,weather,time:timeFit,format:formatFit,ride:rideFit}
  };
}

let bookingCourse=null,bookingTime=null,bookingPlayers=4;

function showScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelector("nav").classList.toggle("nav-hidden",id==="booking"||id==="confirmed");
  document.querySelector('[data-nav="home"]').classList.toggle("active",id==="home");
  window.scrollTo(0,0);
}
function openBooking(c,t){
  bookingCourse=c; bookingTime=t;
  $("bookCourse").textContent=c.name;
  $("bookMeta").textContent=`${c.city} · ${c.dist}`;
  $("bookTime").textContent=`Today · ${t}`;
  bookingPlayers=+($("prefPlayers")?.value || 4);
  document.querySelectorAll(".player").forEach((b,i)=>{const active=i+1===bookingPlayers;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
  resetBookingAddons();
  updateBookingTotal();
  showScreen("booking");
}
function resetBookingAddons(){
  $("addonCart").checked=true;
  $("addonRange").checked=false;
}
function getBookingAddons(){
  const items=[];
  if($("addonCart").checked)items.push({label:"Cart",price:14});
  if($("addonRange").checked)items.push({label:"Range balls",price:6});
  return items;
}
function getBookingTotal(){
  return bookingCourse.price*bookingPlayers+getBookingAddons().reduce((sum,item)=>sum+item.price,0);
}
function updateBookingTotal(){
  if(!bookingCourse)return;
  $("totalPrice").textContent=`$${getBookingTotal()}`;
}

function renderScout(){
  const prefs=getPrefs(),ranked=courses.map(c=>({course:c,...scoreCourse(c,prefs)})).sort((a,b)=>b.score-a.score),best=ranked[0];
  const hero=$("scoutResult");hero.querySelector(".scorebadge").innerHTML=`${best.score}<small>SCORE</small>`;hero.querySelector("h3").textContent=`${best.course.name.replace(" Golf Course","")} · ${best.slot}`;hero.querySelector(".pick-meta").textContent=`$${best.course.price} · ${best.course.drive} min away · ★ ${best.course.rating.toFixed(1)} · weather ${best.course.weather}/100`;hero.querySelector(".pick-reason").textContent=best.reason;$("openScoutPick").onclick=()=>openCourse(best.course,best.slot);
  document.querySelectorAll(".reco-mini").forEach((el,i)=>{
    const r=ranked[i+1]; if(!r)return;
    el.querySelector(".scorebadge").textContent=r.score;
    el.querySelector("strong").textContent=`${r.course.name.replace(" Golf Course","")} · ${r.slot}`;
    const caveat=r.tradeoffs.length?` · ${r.tradeoffs[0]}`:"";
    el.querySelector("small:last-child").textContent=`$${r.course.price} · ${r.course.drive} min away${caveat}`;
    el.onclick=()=>openCourse(r.course,r.slot)
  });
}
function openCourse(c,t){
  const s=scoreCourse(c,getPrefs());showScreen("course");
  $("courseName").textContent=c.name;$("courseCity").innerHTML=`${c.city} · ${c.dist}<div class="provider-pill"><span class="provider-dot ${c.inventoryLive?"live":""}"></span>${c.inventorySource||providers[c.provider]?.label||"Course Direct"} · ${c.inventoryLive?"LIVE":"POC FEED"}</div>`;$("detailScore").textContent=s.score;$("scoreLabel").textContent=s.score>=90?"Flyover Pick":"Great match for you";$("scoreReason").textContent=s.reason;
  renderCoursePhone(c.phone,c.name);
  [["Price","price"],["Drive","drive"],["Course","course"],["Weather","weather"]].forEach(([id,key])=>{$("bar"+id).style.width=s.factors[key]+"%";$("factor"+id).textContent=s.factors[key]});
  $("tradeoffs").innerHTML=s.tradeoffs.length
    ? `<strong>Tradeoffs</strong><ul>${s.tradeoffs.map(x=>`<li>${x}</li>`).join("")}</ul>`
    : `<strong>No major tradeoffs</strong><span>This round fits your current Scout preferences well.</span>`;
  $("slots").innerHTML=c.times.map(x=>`<div class="slot"><span>${x.t}</span><button class="book-slot" data-time="${x.t}">SELECT · $${c.price}</button></div>`).join(""); document.querySelectorAll(".book-slot").forEach(b=>b.onclick=()=>openBooking(c,b.dataset.time));
}
document.querySelectorAll(".scout-toggle").forEach(btn=>btn.onclick=()=>{const g=btn.dataset.prefGroup;prefState[g]=btn.dataset.value;document.querySelectorAll(`.scout-toggle[data-pref-group="${g}"]`).forEach(x=>{x.classList.remove("active");x.setAttribute("aria-pressed","false")});btn.classList.add("active");btn.setAttribute("aria-pressed","true");renderScout()});
["prefWhen","prefPlayers","prefDrive","prefPrice"].forEach(id=>$(id).onchange=renderScout);
$("runScout").onclick=()=>{
  renderScout();
  $("scoutPanel").classList.remove("show");
  $("scoutResult").scrollIntoView({behavior:scrollBehavior(),block:"center"});
};
document.querySelectorAll(".player").forEach((b,i)=>b.onclick=()=>{
  bookingPlayers=i+1;
  document.querySelectorAll(".player").forEach(x=>{x.classList.remove("active");x.setAttribute("aria-pressed","false")});
  b.classList.add("active");b.setAttribute("aria-pressed","true");
  updateBookingTotal();
});
[$("addonCart"),$("addonRange")].forEach(input=>input.onchange=updateBookingTotal);
$("backCourse").onclick=()=>showScreen("course");
$("confirmBtn").onclick=()=>{
  const addons=getBookingAddons();
  $("confirmCourse").textContent=bookingCourse.name;
  $("confirmMeta").textContent=`${bookingCourse.city} · Today · ${bookingTime}`;
  $("confirmPlayers").textContent=`${bookingPlayers} player${bookingPlayers===1?"":"s"} · ${addons.length?addons.map(x=>x.label).join(" + "):"No add-ons"}`;
  $("confirmTotal").textContent=`$${getBookingTotal()}`;
  $("providerBookingLink").href=bookingCourse.bookingUrl;
  showScreen("confirmed");
};
$("doneBtn").onclick=()=>showScreen("home");

$("openRefine").onclick=()=>{$("scoutPanel").classList.toggle("show")};
$("refineScout").onclick=()=>{
  const panel=$("scoutPanel");
  panel.classList.toggle("show");
  if(panel.classList.contains("show"))setTimeout(()=>panel.scrollIntoView({behavior:scrollBehavior(),block:"nearest"}),180);
};
$("quickMorning").onclick=()=>{$("prefWhen").value="morning";$("prefWhen")._scoutSync();renderScout()};$("quickFour").onclick=()=>{$("prefPlayers").value="4";$("prefPlayers")._scoutSync();renderScout()};
$("backHome").onclick=()=>showScreen("home");
document.querySelector('[data-nav="home"]').onclick=()=>{showScreen("home");window.scrollTo({top:0,behavior:scrollBehavior()})};
refreshInventory().then(async()=>{renderScout();const online=await checkApiHealth();if(online)await runScoutFromApi();});
