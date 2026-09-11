/* API-backed scores are separate from browser-local booking handoffs. */
(() => {
  const el = id => document.getElementById(id);
  let rounds = [], editing = null, requestId = null, busy = false, generation = 0, reviewing = null, deleting = null;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  async function api(path, method = "GET", body) {
    if(window.FLYOVER_STORAGE_MODE==="device") return window.flyoverDeviceStore.request(path,method,body);
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api${path}`, {method, headers:{"Content-Type":"application/json"}, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(10000)});
    } catch { throw Error("Unable to reach your rounds. Check your connection and try again."); }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      const error=Error((data?.error?.message || "Your rounds service is unavailable. Please try again.") + (data?.error?.requestId ? ` Reference: ${data.error.requestId}` : ""));error.status=response.status;throw error;
    }
    return data;
  }
  function renderStats(stats) {
    el("roundStats").innerHTML = [["18 holes", stats.eighteenHoles],["9 holes", stats.nineHoles]].map(([label, stat]) => `<section class="stat-format"><h3>${label}</h3><strong>${stat.averageScore ?? "—"}</strong><p>Average score</p><p>Best ${stat.bestScore ?? "—"}</p><small>${stat.rounds} round${stat.rounds===1?"":"s"}</small></section>`).join("");
  }
  function renderHistory() {
    const sorted = [...rounds].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    el("playedRounds").innerHTML = sorted.length ? sorted.map(round => `<article class="round-card"><div class="round-card-top"><div><span class="round-status">${round.score ? "SCORE SAVED" : "AWAITING SCORE"}</span><h2>${escape(round.courseName)}</h2></div><strong class="round-card-price">${round.score?.strokes ?? "—"}<small>strokes</small></strong></div><div class="round-details">${escape(round.date)} · ${round.holes} holes${round.tees?` · ${escape(round.tees)} tees`:""}${round.score?.par!=null?` · ${round.score.strokes-round.score.par>0?"+":""}${round.score.strokes-round.score.par} to par`:""}</div><button type="button" class="round-button" data-edit-score="${escape(round.id)}">${round.score?"Edit score":"Enter score"}</button>${round.score?`<button type="button" class="round-button review-round" data-review-round="${escape(round.id)}">${round.feedback?"Edit review":"How was it?"}</button>`:""}${round.feedback?`<p class="feedback-note">${round.feedback.playAgain==="yes"?"You’d play here again":round.feedback.playAgain==="no"?"You’d prefer another course":"You might play here again"} · Scout remembers</p>`:""}<button type="button" class="text-danger" data-delete-round="${escape(round.id)}">Delete round</button></article>`).join("") : '<div class="score-empty"><strong>Your first score starts here.</strong><p>Log a round to build your history and see your averages.</p></div>';
    el("playedRounds").querySelectorAll("[data-edit-score]").forEach(button => button.onclick=()=>open(rounds.find(round=>round.id===button.dataset.editScore)));
  }
  function openFeedback(round){
    reviewing=round;el("feedbackForm").reset();el("feedbackCourse").textContent=`${round.courseName} · ${round.date}`;
    el("feedbackAgain").value=round.feedback?.playAgain||"";
    for(const name of ["Value","Conditions","Pace"])el("feedback"+name).value=round.feedback?.[name.toLowerCase()]??"";
    el("feedbackError").textContent="";el("feedbackDialog").showModal();el("feedbackAgain").focus();
  }
  el("playedRounds").addEventListener("click",event=>{const button=event.target.closest("[data-review-round]");if(button)openFeedback(rounds.find(round=>round.id===button.dataset.reviewRound));});
  el("closeFeedback").onclick=()=>{if(!busy)el("feedbackDialog").close();};
  el("feedbackDialog").addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  el("feedbackForm").onsubmit=async event=>{
    event.preventDefault();if(busy)return;busy=true;el("saveFeedback").disabled=true;el("feedbackError").textContent="";
    try{
      const feedback={playAgain:el("feedbackAgain").value,version:reviewing.version};
      for(const name of ["Value","Conditions","Pace"])feedback[name.toLowerCase()]=el("feedback"+name).value?Number(el("feedback"+name).value):null;
      await api(`/rounds/${encodeURIComponent(reviewing.id)}/feedback`,"PUT",feedback);
      el("feedbackDialog").close();await load("Review saved. Scout now reflects your experience.");await refreshScout();
    }catch(error){el("feedbackError").textContent=error.message;}
    finally{busy=false;el("saveFeedback").disabled=false;}
  };
  async function load(message) {
    const version=++generation;
    el("scoreStatus").textContent="Loading your rounds…";
    el("retryRounds").hidden=true;
    try {
      if(window.FLYOVER_STORAGE_MODE==="cloud"){
        const {user}=await api("/session");
        el("accountTitle").textContent=user?"Your synced account":"Take your rounds with you";
        el("accountText").textContent=user?user.email:"Sign in to keep your scores together on your laptop and phone.";
        el("accountSignIn").hidden=Boolean(user);el("accountSignOut").hidden=!user;
        el("exportAccount").hidden=!user;el("deleteAccount").hidden=!user;el("importScores").hidden=!user;el("addRound").disabled=!user;
        if(!user){rounds=[];el("roundStats").replaceChildren();el("playedRounds").replaceChildren();el("scoreStatus").textContent="Sign in to view and save synced scores.";return;}
      }
      const [history, summary]=await Promise.all([api("/rounds"),api("/stats")]);
      if(version!==generation)return;
      rounds=history.rounds;
      renderStats(summary.stats);renderHistory();
      el("scoreStatus").textContent=(window.FLYOVER_STORAGE_MODE==="device"?"Saved on this device only. ":window.FLYOVER_STORAGE_MODE==="cloud"?"Synced to your account. ":"")+(message||`${summary.stats.completedRounds} scored round${summary.stats.completedRounds===1?"":"s"}. Averages stay separate for 9 and 18 holes.`);
      return true;
    } catch(error) {
      if(version!==generation)return;
      el("scoreStatus").textContent=message?`${message} ${error.message}`:error.message;
      el("retryRounds").hidden=false;
      if(window.FLYOVER_STORAGE_MODE==="cloud"){
        rounds=[];el("roundStats").replaceChildren();el("playedRounds").replaceChildren();el("exportAccount").hidden=true;el("deleteAccount").hidden=true;
        if(error.status===401){el("addRound").disabled=true;el("accountSignIn").hidden=false;el("accountSignOut").hidden=true;el("accountText").textContent="Sign in again to access your scores.";el("importScores").hidden=true;}
      }
      return false;
    }
  }
  function limits() {
    const holes=Number(el("scoreHoles").value);
    el("scoreStrokes").min=holes;el("scoreStrokes").max=holes*15;
    el("scorePar").min=holes*3;el("scorePar").max=holes*6;
  }
  function open(round=null) {
    editing=round;requestId=crypto.randomUUID();
    el("scoreForm").reset();
    el("scoreDialogTitle").textContent=round?"Edit round score":"Log a round";
    el("scoreFormError").textContent="";
    el("scoreCourse").value=(courses.find(course=>course.id===round?.courseId||course.aliases?.includes(round?.courseId))?.id)||courses[0].providerCourseId;
    const today=FlyoverDiscovery.localDate();
    el("scoreDate").max=today;el("scoreDate").value=round?.date||today;
    el("scoreHoles").value=round?.holes||18;el("scoreTees").value=round?.tees||"";
    el("scoreStrokes").value=round?.score?.strokes||"";el("scorePar").value=round?.score?.par||"";
    ["scoreCourse","scoreDate","scoreHoles","scoreTees"].forEach(id=>el(id).disabled=Boolean(round));
    limits();el("scoreDialog").showModal();
    el(round?"scoreStrokes":"scoreCourse").focus();
  }
  el("scoreCourse").innerHTML=courses.map(course=>`<option value="${escape(course.providerCourseId)}">${escape(course.name)}</option>`).join("");
  el("addRound").onclick=()=>open();
  el("closeScore").onclick=()=>{if(!busy)el("scoreDialog").close();};
  el("scoreDialog").addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  el("scoreHoles").onchange=limits;
  el("retryRounds").onclick=()=>load();
  el("scoreForm").onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    busy=true;el("saveScore").disabled=true;el("saveScore").textContent="Saving…";el("scoreFormError").textContent="";
    const score={strokes:Number(el("scoreStrokes").value),par:el("scorePar").value===""?null:Number(el("scorePar").value),version:editing?.version};
    try {
      if(editing)await api(`/rounds/${encodeURIComponent(editing.id)}/score`,"PUT",score);
      else await api("/rounds","POST",{courseId:el("scoreCourse").value,date:el("scoreDate").value,holes:Number(el("scoreHoles").value),tees:el("scoreTees").value.trim()||null,score,requestId});
      el("scoreDialog").close();
      await load("Score saved.");
      await refreshScout();
    } catch(error) {el("scoreFormError").textContent=error.message;}
    finally {busy=false;el("saveScore").disabled=false;el("saveScore").textContent="Save score";}
  };
  document.querySelector('[data-nav="rounds"]').addEventListener("click",()=>load());
  if(window.FLYOVER_STORAGE_MODE==="device"){
    el("accountSignIn").href="https://flyover-golf.joeb442.chatgpt.site/ui/#rounds";
    el("accountSignIn").textContent="Open synced Flyover";
    el("accountText").textContent="Export your scores here, then sign in to the synced app and import that file. Your device copy stays here.";
    el("exportScores").hidden=false;el("exportAccount").hidden=false;el("deleteAccount").hidden=false;
  }else if(window.FLYOVER_STORAGE_MODE!=="cloud")el("accountPanel").hidden=true;
  el("exportScores").onclick=async()=>{
    try{
      const {rounds}=await window.flyoverDeviceStore.request("/rounds","GET");
      if(!rounds.length){el("accountMessage").textContent="There are no device scores to export yet.";return;}
      const link=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify({format:"flyover-rounds-v1",rounds},null,2)],{type:"application/json"}));
      link.href=url;link.download="flyover-rounds.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      el("accountMessage").textContent="Export downloaded. Open synced Flyover and choose Import device scores.";
    }catch{el("accountMessage").textContent="Could not export your device scores. Your saved data has not been changed.";}
  };
  el("importScores").onclick=()=>el("importScoresFile").click();
  el("importScoresFile").onchange=async()=>{
    const file=el("importScoresFile").files[0];if(!file)return;
    el("importScores").disabled=true;
    try{
      if(file.size>200000)throw Error("Choose a Flyover export under 200 KB (up to 100 rounds).");
      const imported=JSON.parse(await file.text());
      if(imported.format!=="flyover-rounds-v1"||!Array.isArray(imported.rounds))throw Error("Choose a Flyover rounds export file.");
      await api("/rounds/import","POST",{rounds:imported.rounds});
      el("accountMessage").textContent="Import complete. Rounds already in your account were kept without duplication.";
      await load();await refreshScout();
    }catch(error){el("accountMessage").textContent=error instanceof SyntaxError?"This file is not a valid Flyover export.":error.message;}
    finally{el("importScores").disabled=false;el("importScoresFile").value="";}
  };
  function confirmDeletion(round=null){
    deleting=round;el("deleteForm").reset();el("deleteError").textContent="";
    el("deleteTitle").textContent=round?"Delete this round?":"Delete my Flyover data?";
    el("deleteDescription").textContent=round?`${round.courseName} · ${round.date}. This removes its score and review. Export first if you want a copy.`:"This removes all your Flyover rounds, reviews and profile, plus favorites, plans and scores saved in this browser. Your ChatGPT account stays active. Export first if you want a copy.";
    el("deleteDialog").showModal();el("deleteConfirmation").focus();
  }
  el("playedRounds").addEventListener("click",event=>{const button=event.target.closest("[data-delete-round]");if(button)confirmDeletion(rounds.find(round=>round.id===button.dataset.deleteRound));});
  el("deleteAccount").onclick=()=>confirmDeletion();
  el("cancelDelete").onclick=()=>{if(!busy)el("deleteDialog").close();};
  el("deleteDialog").addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  el("deleteForm").onsubmit=async event=>{
    event.preventDefault();if(busy||el("deleteConfirmation").value!=="DELETE")return;
    busy=true;el("confirmDelete").disabled=true;
    try{
      if(deleting)await api(`/rounds/${encodeURIComponent(deleting.id)}`,"DELETE",{version:deleting.version});
      else {await api("/account","DELETE",{confirmation:"DELETE"});window.clearFlyoverLocal();}
      el("deleteDialog").close();await load(deleting?"Round deleted.":"Your Flyover data was deleted.");await refreshScout();
    }catch(error){el("deleteError").textContent=error.message;}
    finally{busy=false;el("confirmDelete").disabled=false;}
  };
  el("exportAccount").onclick=async()=>{
    el("exportAccount").disabled=true;
    try{
      const data=await api("/account/export");
      const localKeys=["flyover-saved-courses","flyover-availability-plans"];
      data.browserData=Object.fromEntries(localKeys.map(key=>[key,localStorage.getItem(key)]));
      const link=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
      link.href=url;link.download="flyover-data.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      el("accountMessage").textContent="Export downloaded. Import restores rounds and reviews; profile and browser data are included for your records.";
    }catch(error){el("accountMessage").textContent=error.message;}
    finally{el("exportAccount").disabled=false;}
  };
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!busy&&!el("scoreDialog").open&&!el("feedbackDialog").open&&el("rounds").classList.contains("active"))load();});
  window.addEventListener("pageshow",event=>{if(event.persisted)load();});
  if(location.hash==="#rounds")showScreen("rounds");
  load();
})();
