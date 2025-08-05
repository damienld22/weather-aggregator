import type { Cradle } from "awilix";
import type { RainPerHour } from "../domain/RainPerHour.ts";
import type { IMeteocielScrapper } from "../scrappers/MeteocielScrapper.ts";

export interface IMeteocielAdapter {
  getNext24HoursRain(): Promise<RainPerHour[]>;
}

export class MeteocielAdapter implements IMeteocielAdapter {
  meteocielScrapper: IMeteocielScrapper;
  constructor({ meteocielScrapper }: Pick<Cradle, "meteocielScrapper">) {
    this.meteocielScrapper = meteocielScrapper;
  }

  private parseHTMLTableFromScrapper(
    htmlTable: NodeListOf<HTMLTableRowElement> | never[]
  ): RainPerHour[] {
    const isHeaderRow = (row: Element) =>
      row.getAttribute("bgcolor") === "#aaaaff";

    let currentDateOfRow: Date | null = null;
    const result: RainPerHour[] = [];

    for (const row of htmlTable) {
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
    const listTr = await this.meteocielScrapper.fetchHTMLTrList();
    return this.parseHTMLTableFromScrapper(listTr);
  }
}
