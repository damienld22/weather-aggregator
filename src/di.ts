import { createContainer, asValue, type Cradle, asClass } from "awilix";
import { MeteocielAdapter } from "./adapters/MeteocielAdapter.ts";

export const container = createContainer<Cradle>({
  injectionMode: "PROXY",
  strict: true,
});

container.register({
  pathMeteociel: asValue(process.env.PATH_METEOCIEL),
  port: asValue(process.env.PORT),
  meteocielAdapter: asClass(MeteocielAdapter),
});
