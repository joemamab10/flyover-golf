// Browser and Worker share this module; no demo inventory enters discovery.
export function localDate(now=new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
export function validDate(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function discover(catalog,preferences={},rounds=[]){
  const city=preferences.city||"all";
  return catalog.filter(course=>course.verifiedOn&&(city==="all"||course.city===city)).map(course=>{
    const reviews=rounds.filter(round=>(round.courseId===course.id||course.aliases?.includes(round.courseId))&&round.status==="completed"&&round.feedback).sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||b.createdAt||"").localeCompare(a.updatedAt||a.createdAt||""));
    const latest=reviews[0];let priority=0,reason="Explore a course in your selected area.";
    if(latest){priority=latest.feedback.playAgain==="yes"?1:latest.feedback.playAgain==="no"?-1:0;reason=priority===1?`You said you’d return after your ${latest.date} round.`:priority===-1?`You preferred another course after your ${latest.date} round.`:`You were unsure about returning after your ${latest.date} round.`;}
    return {...course,priority,reason,reviewedOn:latest?.date??null};
  }).sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
}
