const decoder = new TextDecoder('utf-8');
const data = await Deno.readFile('./mocks/newShows.json');
console.log(JSON.parse(decoder.decode(data)));
