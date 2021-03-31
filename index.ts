import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";

const getShows = async () => {
  const decoder = new TextDecoder('utf-8');
  const data = await Deno.readFile('./mocks/newShows.json');
  return JSON.parse(decoder.decode(data)).map((obj: any) => {
    return {
      name: obj.name,
      showName: obj.showName,
      listDateTime: obj.listDateTime,
      description: obj.description
    }
  });
};

const getStations = async () => {
  const decoder = new TextDecoder('utf-8');
  const data = await Deno.readFile('./mocks/lineups.json');
  return JSON.parse(decoder.decode(data));
};

const app = new Application();
const router = new Router();

router
  .get("/", (ctx) => {
    ctx.response.body = "base route";
  })
  .get("/shows", async (ctx) => {
    ctx.response.body = await getShows();
  })
  .get("/stations", async (ctx) => {
    ctx.response.body = await getStations();
  })

app.use(router.routes());
app.use(router.allowedMethods());

console.log('server listening on port 8000');
await app.listen({ port: 8000 });

