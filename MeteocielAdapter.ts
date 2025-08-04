import type { RainPerHour } from "./domain/RainPerHour.ts";
import { JSDOM } from "jsdom";

export class MeteocielAdapter {
  // url = "https://www.meteociel.fr/previsions-arome-1h/12368/la_bouexiere.htm";
  url = "https://www.meteociel.fr/previsions-arome-1h/22365/calais.htm";

  constructor() {}

  private async fetchHtml(): Promise<string> {
    const htmlResponse = await fetch(this.url);
    const html = await htmlResponse.text();
    return html;
  }

  private parseHtml(html: string): RainPerHour[] {
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

    const allRows = table?.querySelectorAll("tr") || [];
    const isHeaderRow = (row: Element) =>
      row.getAttribute("bgcolor") === "#aaaaff";

    let currentDateOfRow: Date | null = null;
    const result: RainPerHour[] = [];

    for (const row of allRows) {
      if (!isHeaderRow(row)) {
        // Get the rain value
        const indexRain = row.querySelectorAll("td").length - 3;
        const rainText = row.querySelector(`td:nth-of-type(${indexRain})`);
        const rainValueAsText = rainText?.textContent?.trim()?.split(" ")[0];
        const rainValue =
          !rainValueAsText || rainValueAsText === "--"
            ? 0.0
            : parseFloat(rainValueAsText);

        // Get the date

        const firstCell = row.querySelector("td");
        const isCellWithDate = !!firstCell?.getAttribute("rowspan");
        if (isCellWithDate) {
          const dateText = firstCell?.textContent?.trim();
          const dateTextNumberPart = dateText?.replace(/^\D+/g, "");
          if (dateTextNumberPart) {
            currentDateOfRow = new Date();
            currentDateOfRow.setDate(parseInt(dateTextNumberPart));
          }
        }

        const indexHour = row.querySelectorAll("td").length - 9;
        const hourText = row.querySelector(
          `td:nth-of-type(${indexHour})`
        )?.textContent;
        if (hourText && currentDateOfRow) {
          const hourValueAsText = hourText.trim().split(":")[0];
          const hourValue = parseInt(hourValueAsText);
          const timezoneOffset = currentDateOfRow.getTimezoneOffset() / 60;
          currentDateOfRow.setHours(hourValue - timezoneOffset, 0, 0);
        }

        if (!currentDateOfRow) {
          console.error("No current date found for row:", row);
          continue;
        }

        result.push({
          value: rainValue,
          hour: currentDateOfRow.toISOString(),
        });
      }
    }

    return result;
  }

  async getNext24HoursRain(): Promise<RainPerHour[]> {
    const html = await this.fetchHtml();
    return this.parseHtml(html);
  }
}
