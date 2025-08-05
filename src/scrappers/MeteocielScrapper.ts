import type { Cradle } from "awilix";
import { JSDOM } from "jsdom";

export interface IMeteocielScrapper {
  fetchHTMLTrList(): Promise<NodeListOf<HTMLTableRowElement> | never[]>;
}

export class MeteocielScrapper implements IMeteocielScrapper {
  pathMeteociel: string;

  constructor({ pathMeteociel }: Pick<Cradle, "pathMeteociel">) {
    this.pathMeteociel = pathMeteociel;
  }

  async fetchHTMLTrList(): Promise<NodeListOf<HTMLTableRowElement> | never[]> {
    // Fetch the HTML from the Meteociel URL
    const BASE_URL = "https://www.meteociel.fr/previsions-arome-1h";
    const url = `${BASE_URL}/${this.pathMeteociel}`;
    const htmlResponse = await fetch(url);
    const html = await htmlResponse.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get the table containing the previsions (it is nested table at the 5th level)
    const table = document
      .querySelector("table")
      ?.querySelector("td:nth-of-type(2)")
      ?.querySelector("table")
      ?.querySelector("table")
      ?.querySelector("table")
      ?.querySelector("table");

    return table?.querySelectorAll("tr") || [];
  }
}
