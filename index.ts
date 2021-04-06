import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const { args } = Deno;
const DEFAULT_PORT = 8000;
const argPort = parse(args).port;

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
    const stationsUrl = `http://api.tvmaze.com/schedule?country=US&date=2021-04-07`;
    const response = await fetch(stationsUrl);
    const data = await response.json();
    return data
    .map((obj: any) => {
    return {
      stationId: obj?.show?.network?.id,
      stationName: obj?.show?.network?.name,
      showId: obj?.show?.id,
      showName: obj?.show?.name,
      airdate: formatListDateTime(`${obj?.airdate} ${obj?.airtime}`),
      runtime: `${obj?.runtime} minutes`,
      summary: obj?.show?.summary
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
    console.log('/stations', ctx.response.status);
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

