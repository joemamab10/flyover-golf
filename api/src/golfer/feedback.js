import { InputError } from "./service.js";
export function validateFeedback(input, round) {
  if(round.status!=="completed")throw new InputError("Save a completed round before reviewing it.");
  if(!input||typeof input!=="object"||Array.isArray(input))throw new InputError("Enter round feedback.");
  if(!["yes","maybe","no"].includes(input.playAgain))throw new InputError("Choose whether you would play here again.");
  const result={playAgain:input.playAgain};
  for(const field of ["value","conditions","pace"]){
    const value=input[field];
    if(value!=null&&(!Number.isInteger(value)||value<1||value>5))throw new InputError(`${field} must be a rating from 1 to 5.`);
    result[field]=value??null;
  }
  return result;
}
// Most recent completed review per course; repeated rounds never stack bonuses.
export function courseExperience(courseId, rounds) {
  const reviewed=rounds.filter(round=>round.courseId===courseId&&round.status==="completed"&&round.feedback)
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||b.createdAt).localeCompare(a.updatedAt||a.createdAt));
  const latest=reviewed[0];
  if(!latest)return null;
  const feedback=latest.feedback;
  let adjustment=feedback.playAgain==="yes"?6:feedback.playAgain==="no"?-12:0;
  const reasons=[feedback.playAgain==="yes"?"You said you’d play here again.":feedback.playAgain==="no"?"You said you wouldn’t play here again.":"You were unsure about playing here again."];
  for(const field of ["value","conditions","pace"]){
    if(feedback[field]>=4){adjustment+=1;reasons.push(`You rated ${field} ${feedback[field]}/5.`);}
    else if(feedback[field]!=null&&feedback[field]<=2){adjustment-=2;reasons.push(`You rated ${field} ${feedback[field]}/5.`);}
  }
  return {adjustment,reasons,reviewedOn:latest.date,playAgain:feedback.playAgain};
}
