(() => {
  const key="flyover-scored-rounds-v1";
  function read() {
    const state=JSON.parse(localStorage.getItem(key)||'{"rounds":[]}');
    if(!Array.isArray(state.rounds))throw Error("Saved rounds could not be read. Your stored data has not been changed.");
    return state;
  }
  const group=(rounds,holes)=>{
    const rows=rounds.filter(row=>row.holes===holes&&row.score),scores=rows.map(row=>row.score.strokes);
    return {rounds:rows.length,averageScore:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:null,bestScore:scores.length?Math.min(...scores):null};
  };
  window.flyoverDeviceStore={
    experience(courseId){
      try{
        const round=read().rounds.filter(row=>row.courseId===courseId&&row.feedback&&row.score).sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||b.createdAt).localeCompare(a.updatedAt||a.createdAt))[0];
        if(!round)return null;
        const f=round.feedback;let adjustment=f.playAgain==="yes"?6:f.playAgain==="no"?-12:0;
        for(const key of ["value","conditions","pace"]){if(f[key]>=4)adjustment++;else if(f[key]!=null&&f[key]<=2)adjustment-=2;}
        return {adjustment,reason:f.playAgain==="yes"?"you said you’d play here again":f.playAgain==="no"?"you’d prefer another course":"you were unsure about returning"};
      }catch{return null;}
    },
    played(courseId){try{return read().rounds.some(row=>row.courseId===courseId&&row.score);}catch{return false;}},
    async request(path,method,body){
      if(method==="GET"){
        const {rounds}=read();
        if(path==="/rounds")return {rounds};
        if(path==="/account/export")return {format:"flyover-rounds-v1",exportedAt:new Date().toISOString(),profile:{},rounds};
        if(path==="/stats")return {stats:{completedRounds:rounds.filter(row=>row.score).length,nineHoles:group(rounds,9),eighteenHoles:group(rounds,18)}};
      }
      const mutate=()=>{
        const state=read();
        if(method==="DELETE"){
          if(path==="/account"){
            if(body.confirmation!=="DELETE")throw Error("Type DELETE to confirm.");
            localStorage.removeItem(key);return {ok:true};
          }
          const id=decodeURIComponent(path.split("/")[2]);
          const round=state.rounds.find(row=>row.id===id);
          if(!round)throw Error("Round not found. Refresh Rounds.");
          if(round.version!==body.version)throw Error("This round changed. Refresh before deleting it.");
          state.rounds=state.rounds.filter(row=>row.id!==id);
          localStorage.setItem(key,JSON.stringify(state));return {ok:true};
        }
        let round;
        if(method==="POST"&&path==="/rounds"){
          const existing=state.rounds.find(row=>row.requestId===body.requestId);
          if(existing)return {round:existing};
          const course=courses.find(course=>course.providerCourseId===body.courseId);
          if(!course)throw Error("Choose a course.");
          round={...body,id:crypto.randomUUID(),courseName:course.name,createdAt:new Date().toISOString(),status:"completed"};
        }else if(method==="PUT"){
          round=state.rounds.find(row=>row.id===decodeURIComponent(path.split('/')[2]));
          if(!round)throw Error("Round not found. Refresh your rounds and try again.");
          if(path.endsWith("/feedback")){
            if(!round.score||!["yes","maybe","no"].includes(body.playAgain))throw Error("Save a score and choose whether you would play here again.");
            const feedback={playAgain:body.playAgain};
            for(const field of ["value","conditions","pace"]){const value=body[field];if(value!=null&&(!Number.isInteger(value)||value<1||value>5))throw Error("Ratings must be from 1 to 5.");feedback[field]=value??null;}
            round={...round,feedback,updatedAt:new Date().toISOString()};
          }else round={...round,score:body,updatedAt:new Date().toISOString(),status:"completed"};
        }else throw Error("Unsupported request.");
        round.version=(round.version||0)+1;
        const {strokes,par}=round.score;
        if(![9,18].includes(round.holes)||!Number.isInteger(strokes)||strokes<round.holes||strokes>round.holes*15)throw Error("Enter a valid total score.");
        if(par!==null&&(!Number.isInteger(par)||par<round.holes*3||par>round.holes*6))throw Error("Enter a valid par or leave it blank.");
        if(!/^\d{4}-\d{2}-\d{2}$/.test(round.date)||!Number.isFinite(Date.parse(round.date))||new Date(round.date).toISOString().slice(0,10)!==round.date||round.date>FlyoverDiscovery.localDate())throw Error("Choose a valid date on or before today.");
        const index=state.rounds.findIndex(row=>row.id===round.id);
        if(index<0)state.rounds.unshift(round);else state.rounds[index]=round;
        try{localStorage.setItem(key,JSON.stringify(state));}catch{throw Error("Your browser could not save this score. Free up storage or allow site storage and try again.");}
        return {round};
      };
      return navigator.locks?navigator.locks.request(key,mutate):mutate();
    }
  };
})();
