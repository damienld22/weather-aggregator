import type { IMeteocielAdapter } from "../adapters/MeteocielAdapter.ts";

export {};

declare module "awilix" {
  interface Cradle {
    pathMeteociel: string;
    port: string;
    meteocielAdapter: IMeteocielAdapter;
  }
}
