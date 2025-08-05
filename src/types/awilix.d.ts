import type { IMeteocielAdapter } from "../adapters/MeteocielAdapter.ts";
import type { IMeteocielScrapper } from "../scrappers/MeteocielScrapper.ts";

export {};

declare module "awilix" {
  interface Cradle {
    pathMeteociel: string;
    port: string;
    meteocielAdapter: IMeteocielAdapter;
    meteocielScrapper: IMeteocielScrapper;
  }
}
