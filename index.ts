import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const { args } = Deno;
const DEFAULT_PORT = 8000;
const START_TIME_HOURS = 17;
const argPort = parse(args).port;

const BLACKLISTED_STATIONS = [1035, 11];

type Listing = {
  airdate: string,
  airtime: string,
  runtime: number,
  summary: string,
  show: {
    id: number,
    name: string,
    network: {
      id: number,
      name: string
    },
    image: {
      medium: string
    }
  }
};

const getHours = (time: string): number => {
  return parseInt(time.split(':')[0]);
};

const formatListDateTime = (dateTime: string): string => {
  const dateTimeTokens: string[] = dateTime.split(' ');
  let date: string, time: string;
  [date, time] = dateTimeTokens;
  const hours: number = getHours(time);
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

const formatSummary = (summary: string) => {
  if (!summary) return null;
  const desc = summary;
  const regex = /<[^>]*>/ig;
  const stringWithoutTags = desc.replace(regex, '');
  return stringWithoutTags.length > 144 ? `${stringWithoutTags.substring(0, 144)}...` : stringWithoutTags;
};

const getShows = async () => {
    let date = new Date().toISOString().slice(0, 10)
    const stationsUrl = `http://api.tvmaze.com/schedule?country=US&date=${date}`;
    const response = await fetch(stationsUrl);
    const data = await response.json();
    return data
      .filter((obj: Listing) => getHours(obj?.airtime) >= START_TIME_HOURS)
      .filter((obj: Listing) =>
        obj.show.network.id !== BLACKLISTED_STATIONS[0]
        && obj.show.network.id !== BLACKLISTED_STATIONS[1])
      .map((obj: Listing) => {
      return {
        stationId: obj?.show?.network?.id,
        stationName: obj?.show?.network?.name,
        showId: obj?.show?.id,
        showName: obj?.show?.name,
        airdate: formatListDateTime(`${obj?.airdate} ${obj?.airtime}`),
        runtime: `${obj?.runtime} minutes`,
        summary: formatSummary(obj?.summary),
        imageUrl: obj?.show?.image?.medium
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

app.use(oakCors({ origin: "*" }),);
app.use(router.allowedMethods());
app.use(router.routes());

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${hostname ??
    "localhost"}:${port}`,
  );
});

await app.listen({ port: argPort ? Number(argPort) : DEFAULT_PORT });

