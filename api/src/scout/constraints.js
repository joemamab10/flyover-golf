export function fitsConstraints(item, preferences={}) {
  const {maxPrice=65,maxDriveMinutes=30,when="morning",holes=18,ride="cart",players=4}=preferences;
  return item.price<=maxPrice&&item.course.driveMinutes<=maxDriveMinutes&&item.availablePlayers>=players
    &&(holes==="either"||item.holes===Number(holes))
    &&(ride==="either"||Boolean(item.course[ride]))
    &&(when==="any"||(when==="morning"?item.hour<12:item.hour>=12));
}
