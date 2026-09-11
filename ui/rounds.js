/* API-backed scores are separate from browser-local booking handoffs. */
(() => {
  const el = id => document.getElementById(id);
  let rounds = [], editing = null, requestId = null, busy = false, generation = 0;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  async function api(path, method = "GET", body) {
    if(window.FLYOVER_STORAGE_MODE==="device") return window.flyoverDeviceStore.request(path,method,body);
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api${path}`, {method, headers:{"Content-Type":"application/json"}, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(10000)});
    } catch { throw Error("Unable to reach your rounds. Check your connection and try again."); }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw Error(data?.error?.message || "Your rounds service is unavailable. Please try again.");
    return data;
  }
  function renderStats(stats) {
    el("roundStats").innerHTML = [["18 holes", stats.eighteenHoles],["9 holes", stats.nineHoles]].map(([label, stat]) => `<section class="stat-format"><h3>${label}</h3><strong>${stat.averageScore ?? "—"}</strong><p>Average score</p><p>Best ${stat.bestScore ?? "—"}</p><small>${stat.rounds} round${stat.rounds===1?"":"s"}</small></section>`).join("");
  }
  function renderHistory() {
    const sorted = [...rounds].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    el("playedRounds").innerHTML = sorted.length ? sorted.map(round => `<article class="round-card"><div class="round-card-top"><div><span class="round-status">${round.score ? "SCORE SAVED" : "AWAITING SCORE"}</span><h2>${escape(round.courseName)}</h2></div><strong class="round-card-price">${round.score?.strokes ?? "—"}<small>strokes</small></strong></div><div class="round-details">${escape(round.date)} · ${round.holes} holes${round.tees?` · ${escape(round.tees)} tees`:""}${round.score?.par!=null?` · ${round.score.strokes-round.score.par>0?"+":""}${round.score.strokes-round.score.par} to par`:""}</div><button type="button" class="round-button" data-edit-score="${escape(round.id)}">${round.score?"Edit score":"Enter score"}</button></article>`).join("") : '<div class="score-empty"><strong>Your first score starts here.</strong><p>Log a round to build your history and see your averages.</p></div>';
    el("playedRounds").querySelectorAll("[data-edit-score]").forEach(button => button.onclick=()=>open(rounds.find(round=>round.id===button.dataset.editScore)));
  }
  async function load(message) {
    const version=++generation;
    el("scoreStatus").textContent="Loading your rounds…";
    el("retryRounds").hidden=true;
    try {
      const [history, summary]=await Promise.all([api("/rounds"),api("/stats")]);
      if(version!==generation)return;
      rounds=history.rounds;
      renderStats(summary.stats);renderHistory();
      el("scoreStatus").textContent=(window.FLYOVER_STORAGE_MODE==="device"?"Saved on this device only. ":"")+(message||`${summary.stats.completedRounds} scored round${summary.stats.completedRounds===1?"":"s"}. Averages stay separate for 9 and 18 holes.`);
      return true;
    } catch(error) {
      if(version!==generation)return;
      el("scoreStatus").textContent=message?`${message} ${error.message}`:error.message;
      el("retryRounds").hidden=false;
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
    el("scoreCourse").value=round?.courseId||courses[0].providerCourseId;
    const today=new Date().toISOString().slice(0,10);
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
    const score={strokes:Number(el("scoreStrokes").value),par:el("scorePar").value===""?null:Number(el("scorePar").value)};
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
  load();
})();
