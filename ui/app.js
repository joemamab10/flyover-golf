const API_BASE_URL=window.FLYOVER_API_BASE_URL??(["localhost","127.0.0.1"].includes(location.hostname)?"http://localhost:3000":"");
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FAVORITES="flyover-saved-courses",PLANS="flyover-availability-plans";
let activeCourse=null,courseReturn="home",helpReturn="home",requestVersion=0;
function readLocal(key,fallback=[]){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value));}
function validPlanDate(value){return FlyoverDiscovery.validDate(value)&&value>=FlyoverDiscovery.localDate();}
function showScreen(id){document.querySelectorAll('.screen').forEach(screen=>screen.classList.toggle('active',screen.id===id));document.querySelectorAll('[data-nav]').forEach(button=>button.classList.toggle('active',button.dataset.nav===(id==='course'?courseReturn:id)));window.scrollTo(0,0);}
function savedIds(){const rows=readLocal(FAVORITES);return Array.isArray(rows)?rows.map(row=>typeof row==='string'?row:row.providerCourseId||row.id).map(id=>courses.find(course=>course.id===id||course.aliases?.includes(id))?.id||id):[];}
function courseCard(course,index=null){return `<button type="button" class="discovery-card" data-course="${escapeHTML(course.id)}"><span class="discovery-kicker">${index===null?escapeHTML(course.city):`SCOUT OPTION ${index+1}`}</span><h2>${escapeHTML(course.name)}</h2><p>${escapeHTML(course.reason||course.city)}</p><span class="discovery-action">Explore course →</span></button>`;}
function bindCards(container){container.querySelectorAll('[data-course]').forEach(button=>button.onclick=()=>openCourse(courses.find(course=>course.id===button.dataset.course)));}
async function refreshScout(){
  const version=++requestVersion,date=$('planningDate').value,city=$('planningCity').value;
  if(!validPlanDate(date)){$('discoveryStatus').textContent='Choose today or a future planning date.';return;}
  $('discoveryStatus').textContent='Finding courses…';
  let rows,notice='';
  try{
    if(window.FLYOVER_STORAGE_MODE!=='device'){
      const response=await fetch(`${API_BASE_URL}/api/discovery`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,city}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error();rows=(await response.json()).courses;
    }else{
      const rounds=window.FLYOVER_STORAGE_MODE==='device'?(await flyoverDeviceStore.request('/rounds','GET')).rounds:[];
      rows=FlyoverDiscovery.discover(courses,{city,date},rounds);
    }
  }catch{rows=FlyoverDiscovery.discover(courses,{city,date},[]);notice=' Synced reviews are unavailable; showing the course directory.';}
  if(version!==requestVersion)return;
  const picks=rows.slice(0,3);
  $('discoveryStatus').textContent=`${picks.length} course${picks.length===1?'':'s'} to explore for ${date}. Availability not checked.${notice}`;
  $('discoveryResults').innerHTML=picks.length?picks.map((row,index)=>courseCard(row,index)).join(''):'<p class="score-empty">No verified course listings in that area yet. Try Des Moines metro.</p>';
  bindCards($('discoveryResults'));
}
function renderExplore(){const query=$('exploreSearch').value.trim().toLowerCase();const rows=courses.filter(course=>course.verifiedOn&&`${course.name} ${course.city}`.toLowerCase().includes(query));$('exploreList').innerHTML=rows.length?rows.map(course=>courseCard(course)).join(''):'<p>No matching courses.</p>';bindCards($('exploreList'));}
function renderSaved(){const ids=savedIds(),rows=courses.filter(course=>course.verifiedOn&&ids.includes(course.id));$('savedList').innerHTML=rows.length?rows.map(course=>courseCard(course)).join(''):'<p class="score-empty">Save a course with the heart on its details page.</p>';bindCards($('savedList'));}
function updateHeart(){const saved=savedIds().includes(activeCourse.id);$('saveCourse').textContent=saved?'♥':'♡';$('saveCourse').setAttribute('aria-pressed',String(saved));$('saveCourse').setAttribute('aria-label',`${saved?'Unsave':'Save'} ${activeCourse.name}`);}
function openCourse(course){if(!course?.verifiedOn)return;courseReturn=document.querySelector('.screen.active')?.id||'home';activeCourse=course;$('courseName').textContent=course.name;$('courseCity').textContent=course.city;$('courseVerified').textContent=`Name, location and website checked against the official site on ${course.verifiedOn}.`;const phone=$('coursePhoneLink');phone.hidden=!course.phone;if(course.phone){phone.href='tel:'+course.phone.replace(/\D/g,'');phone.textContent=`Call clubhouse · ${course.phone}`;}$('courseDate').value=$('planningDate').value;$('courseDate').min=FlyoverDiscovery.localDate();$('checkAvailability').href=course.website;$('courseDateStatus').textContent='';$('planStatus').textContent='';updateHeart();showScreen('course');}
function renderPlans(){const rows=readLocal(PLANS);$('plansList').innerHTML=Array.isArray(rows)&&rows.length?rows.map(row=>`<article class="round-card"><h2>${escapeHTML(row.courseName)}</h2><p>${escapeHTML(row.date)} · Availability check opened</p><p class="score-help">Not a reservation. Confirm directly with the course.</p><button class="round-button" type="button" data-remove-plan="${escapeHTML(row.id)}">Remove plan</button></article>`).join(''):'<p class="score-help">Courses you check will appear here with your planning date.</p>';$('plansList').querySelectorAll('[data-remove-plan]').forEach(button=>button.onclick=()=>{try{writeLocal(PLANS,readLocal(PLANS).filter(row=>row.id!==button.dataset.removePlan));renderPlans();}catch{$('scoreStatus').textContent='Could not remove this plan. Check browser storage.';}});}
$('checkAvailability').onclick=event=>{const date=$('courseDate').value;if(!validPlanDate(date)){event.preventDefault();$('courseDateStatus').textContent='Choose today or a future date before continuing.';return;}$('planningDate').value=date;try{const id=`${activeCourse.id}-${date}`,rows=readLocal(PLANS);writeLocal(PLANS,[{id,courseName:activeCourse.name,date},...rows.filter(row=>row.id!==id)].slice(0,100));$('planStatus').textContent=`Plan saved for ${date}. Choose that date on the course website.`;renderPlans();}catch{$('planStatus').textContent='Opening the course website. Your browser could not save this plan.';}};
$('copyPlan').onclick=async()=>{if(!validPlanDate($('courseDate').value)){$('courseDateStatus').textContent='Choose a valid planning date.';return;}try{await navigator.clipboard.writeText(`${activeCourse.name}\nPlanned date: ${$('courseDate').value}\nCheck availability: ${activeCourse.website}\nNot a confirmed reservation.`);$('planStatus').textContent='Plan copied.';}catch{$('planStatus').textContent='Copy is unavailable here. Your selected date is shown above.';}};
$('saveCourse').onclick=()=>{try{const ids=savedIds();writeLocal(FAVORITES,ids.includes(activeCourse.id)?ids.filter(id=>id!==activeCourse.id):[...ids,activeCourse.id]);updateHeart();renderSaved();}catch{$('planStatus').textContent='Could not save this favorite. Check browser storage.';}};
$('backHome').onclick=()=>showScreen(courseReturn);
$('planningDate').min=FlyoverDiscovery.localDate();$('planningDate').value=FlyoverDiscovery.localDate();
for(const city of [...new Set(courses.filter(course=>course.verifiedOn).map(course=>course.city))].sort()){const option=document.createElement('option');option.value=city;option.textContent=city;$('planningCity').append(option);}
$('discoveryForm').onsubmit=event=>{event.preventDefault();refreshScout();};$('exploreSearch').oninput=renderExplore;
document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>{if(button.dataset.nav==='explore')renderExplore();if(button.dataset.nav==='saved')renderSaved();if(button.dataset.nav==='rounds')renderPlans();showScreen(button.dataset.nav);});
$('reviewFromScout').onclick=()=>document.querySelector('[data-nav="rounds"]').click();
document.querySelectorAll('[data-help]').forEach(button=>button.onclick=()=>{helpReturn=document.querySelector('.screen.active')?.id||'home';showScreen('help');});$('closeHelp').onclick=()=>showScreen(helpReturn);
window.clearFlyoverLocal=()=>{for(const key of [FAVORITES,PLANS,'flyover-scored-rounds-v1','flyover-booking-handoffs'])localStorage.removeItem(key);renderSaved();renderPlans();};
refreshScout();renderExplore();renderSaved();renderPlans();
