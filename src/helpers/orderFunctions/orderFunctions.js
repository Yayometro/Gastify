export function sortItemsByName(arr) {
    if (!(arr instanceof Array))
    throw new Error("the arr shoudl be a instance of Array");
  return arr.sort((a, b) => {
    
    return (a.name || a.type).localeCompare(b.name || b.type)
  });
}
