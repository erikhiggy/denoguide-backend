import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";

type Station = {
  callsign: string,
  name: string,
  stationID: number
}

type Show = {
  name: string,
  showName: string,
  listDateTime: string,
  description: string
}

const formatListDateTime = (dateTime: string): string => {
  const dateTimeTokens: string[] = dateTime.split(' ');
  let date: string, time: string;
  [date, time] = dateTimeTokens;
  const hours: number = parseInt(time.split(':')[0]);
  const minutes: number = parseInt(time.split(':')[1]);
  const formattedHours: number = (hours > 12 || hours === 0) ? Math.abs(hours - 12) : hours;
  const formattedMinutes: string = minutes.toString().length === 1 ? minutes.toString() + '0' : minutes.toString();
  time = hours > 12
    ? `${formattedHours.toString()}:${formattedMinutes} PM`
    : `${formattedHours.toString()}:${formattedMinutes} AM`;
  let day: string, month: string, year: string;
  [year, month, day] = date.split('-');
  date = `${month}-${day}-${year}`;
  return `${date}, ${time}`;
};

const getShows = async () => {
  const decoder = new TextDecoder('utf-8');
  const data = await Deno.readFile('./mocks/newShows.json');
  return JSON.parse(decoder.decode(data)).map((obj: Show) => {
    return {
      name: obj.name,
      showName: obj.showName,
      listDateTime: formatListDateTime(obj.listDateTime),
      description: obj.description
    }
  });
};

const getStations = async () => {
  const decoder = new TextDecoder('utf-8');
  const data = await Deno.readFile('./mocks/lineups.json');
  return JSON.parse(decoder.decode(data))
    .stations
    .map((obj: Station) => {
    return {
      callsign: obj.callsign,
      name: obj.name,
      stationID: obj.stationID
    }
  });
};

const app = new Application();
const router = new Router();

router
  .get("/", (ctx) => {
    ctx.response.body = "base route";
    console.log('/', ctx.response.status);
  })
  .get("/shows", async (ctx) => {
    ctx.response.body = await getShows();
    console.log('/shows', ctx.response.status);
  })
  .get("/stations", async (ctx) => {
    ctx.response.body = await getStations();
    console.log('/stations', ctx.response.status);
  })

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${hostname ??
    "localhost"}:${port}`,
  );
});

await app.listen({ port: 8000 });

