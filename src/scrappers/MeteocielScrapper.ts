import type { Cradle } from "awilix";
import { JSDOM } from "jsdom";

export interface IMeteocielScrapper {
  fetchHTMLTrList(): Promise<NodeListOf<HTMLTableRowElement> | never[]>;
  fetchUpdatedAtText(): Promise<string>;
}

export class MeteocielScrapper implements IMeteocielScrapper {
  pathMeteociel: string;
  htmlDocument: Document | null = null;

  constructor({ pathMeteociel }: Pick<Cradle, "pathMeteociel">) {
    this.pathMeteociel = pathMeteociel;
    this.fetchHtmlPage();
  }

  async fetchHtmlPage(): Promise<void> {
    // Fetch the HTML from the Meteociel URL
    const BASE_URL = "https://www.meteociel.fr/previsions-arome-1h";
    const url = `${BASE_URL}/${this.pathMeteociel}`;
    const htmlResponse = await fetch(url);
    const html = await htmlResponse.text();

    const dom = new JSDOM(html);
    this.htmlDocument = dom.window.document;
  }

  async fetchHTMLTrList(): Promise<NodeListOf<HTMLTableRowElement> | never[]> {
    if (!this.htmlDocument) {
      throw new Error("HTML document not loaded. Call fetchHtmlPage first.");
    }

    // Get the table containing the previsions (it is nested table at the 5th level)
    const table = this.htmlDocument
      .querySelector("table")
      ?.querySelector("td:nth-of-type(2)")
      ?.querySelector("table")
      ?.querySelector("table")
      ?.querySelector("table")
      ?.querySelector("table");

    return table?.querySelectorAll("tr") || [];
  }

  async fetchUpdatedAtText(): Promise<string> {
    if (!this.htmlDocument) {
      throw new Error("HTML document not loaded. Call fetchHtmlPage first.");
    }

    // Get the updated at text from the page
    const updatedAtElement =
      this.htmlDocument.querySelector("center")?.textContent;
    return updatedAtElement || "";
  }
}
