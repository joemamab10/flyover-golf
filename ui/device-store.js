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
    played(courseId){try{return read().rounds.some(row=>row.courseId===courseId&&row.score);}catch{return false;}},
    async request(path,method,body){
      if(method==="GET"){
        const {rounds}=read();
        if(path==="/rounds")return {rounds};
        if(path==="/stats")return {stats:{completedRounds:rounds.filter(row=>row.score).length,nineHoles:group(rounds,9),eighteenHoles:group(rounds,18)}};
      }
      const mutate=()=>{
        const state=read();
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
          round={...round,score:body,updatedAt:new Date().toISOString(),status:"completed"};
        }else throw Error("Unsupported request.");
        const {strokes,par}=round.score;
        if(![9,18].includes(round.holes)||!Number.isInteger(strokes)||strokes<round.holes||strokes>round.holes*15)throw Error("Enter a valid total score.");
        if(par!==null&&(!Number.isInteger(par)||par<round.holes*3||par>round.holes*6))throw Error("Enter a valid par or leave it blank.");
        if(!/^\d{4}-\d{2}-\d{2}$/.test(round.date)||!Number.isFinite(Date.parse(round.date))||new Date(round.date).toISOString().slice(0,10)!==round.date||round.date>new Date().toISOString().slice(0,10))throw Error("Choose a valid date on or before today.");
        const index=state.rounds.findIndex(row=>row.id===round.id);
        if(index<0)state.rounds.unshift(round);else state.rounds[index]=round;
        try{localStorage.setItem(key,JSON.stringify(state));}catch{throw Error("Your browser could not save this score. Free up storage or allow site storage and try again.");}
        return {round};
      };
      return navigator.locks?navigator.locks.request(key,mutate):mutate();
    }
  };
})();
