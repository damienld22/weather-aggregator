import type { Cradle } from "awilix";
import type {
  RainPerHour,
  RainPerHourInformations,
} from "../domain/RainPerHour.ts";
import type { IMeteocielScrapper } from "../scrappers/MeteocielScrapper.ts";

export interface IMeteocielAdapter {
  getNext24HoursRain(): Promise<RainPerHourInformations>;
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

            // If the date is for the next month, we adjust

            if (new Date().getDate() > parseInt(dateTextNumberPart)) {
              currentDateOfRow.setMonth(currentDateOfRow.getMonth() + 1);
            }
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

  private parseUpdatedAtFromHtmlText(updatedAtText: string): string {
    const resultDate = new Date();

    const dateMatchRegexResult = updatedAtText.match(/\d{1,2}:\d{2}/);
    const dateMatch = dateMatchRegexResult ? dateMatchRegexResult[0] : null;
    if (!dateMatch) {
      throw new Error("No date found in updatedAtText");
    }

    const [hour, min] = dateMatch.split(":");
    resultDate.setHours(parseInt(hour), parseInt(min), 0);

    if (new Date().getTime() < resultDate.getTime()) {
      resultDate.setDate(resultDate.getDate() - 1);
    }

    return resultDate.toISOString();
  }

  async getNext24HoursRain(): Promise<RainPerHourInformations> {
    const listTr = await this.meteocielScrapper.fetchHTMLTrList();
    const updatedAtText = await this.meteocielScrapper.fetchUpdatedAtText();

    return {
      updatedAt: this.parseUpdatedAtFromHtmlText(updatedAtText),
      data: this.parseHTMLTableFromScrapper(listTr),
    };
  }
}
