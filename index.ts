import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { parse } from 'https://deno.land/std/flags/mod.ts';

const API_KEY = Deno.env.get("API_KEY");

const { args } = Deno;
const DEFAULT_PORT = 8000;
const argPort = parse(args).port;

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

const getShows = async (stationID: string) => {
  const response = await fetch(`http://api.tvmedia.ca/tv/v4/lineups/36617/listings?
  api_key=${API_KEY}
  &timezone=America%2FNew_York
  &station=${stationID}
  &newShowsOnly=true
`);
  const data = await response.json();
  return data.map((obj: Show) => {
    return {
      name: obj.name,
      showName: obj.showName,
      listDateTime: formatListDateTime(obj.listDateTime),
      description: obj.description,
      stationID
    }
  });
};

const getStations = async () => {
    const response = await fetch(`http://api.tvmedia.ca/tv/v4/lineups/36617?api_key=${API_KEY}`);
    const data = await response.json();
    return data
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
  .get("/shows/:stationID", async (ctx) => {
    if (ctx?.params?.stationID) {
      ctx.response.body = await getShows(ctx.params.stationID);
    }
    console.log(`/shows/${ctx.params.stationID}`, ctx.response.status);
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

await app.listen({ port: argPort ? Number(argPort) : DEFAULT_PORT });

