import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MeteocielAdapter } from "./MeteocielAdapter.ts";
import { JSDOM } from "jsdom";

describe("MeteocielAdapter", () => {
  const mockScrapperHTMLList = vi.fn();
  const mockScrapperUpdatedAt = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("In case of HTML table with some rain, the proper rain values should be returned", async () => {
    const meteocielAdapter = new MeteocielAdapter({
      meteocielScrapper: {
        fetchHTMLTrList: mockScrapperHTMLList,
        fetchUpdatedAtText: mockScrapperUpdatedAt,
      },
    });

    const mockHtml = `<html><body><table><tbody><tr bgcolor="#CCFFFF"><td rowspan="9" align="center" valign="center">Mar<br>05<br></td><td>15:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/nne.png" alt="Nord-Nord-Est : 15 °" title="Nord-Nord-Est : 15 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">--</td><td align="center" bgcolor="#a5a5a5">49 %</td><td align="center">1020 hPa</td><td align="center"><img alt="Ciel clair" title="Ciel clair" src="//static.meteociel.fr/prevision/test/picto/soleil.gif"></td></tr><tr bgcolor="#CCFFFF"><td>16:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/n.png" alt="Nord : 6 °" title="Nord : 6 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">3.8 mm</td><td align="center" bgcolor="#a5a5a5">47 %</td><td align="center">1019 hPa</td><td align="center"><img alt="Peu nuageux" title="Peu nuageux" src="//static.meteociel.fr/prevision/test/picto/peu_nuageux.gif"></td></tr></tbody></table></body></html>`;
    const dom = new JSDOM(mockHtml.toString());
    const document = dom.window.document;
    mockScrapperHTMLList.mockResolvedValue(document.querySelectorAll("tr"));
    mockScrapperUpdatedAt.mockResolvedValue("Dernière mise à jour à 18:00");

    vi.setSystemTime(new Date("2025-08-05T19:00:00Z"));

    const result = await meteocielAdapter.getNext24HoursRain();

    expect(result.data).toStrictEqual([
      { hour: "2025-08-05T15:00:00.000Z", value: 0.0 },
      { hour: "2025-08-05T16:00:00.000Z", value: 3.8 },
    ]);
    expect(result.updatedAt).toBe("2025-08-05T16:00:00.000Z");
  });

  test("In case of we are in the end of the month, the date should be the proper one", async () => {
    const meteocielAdapter = new MeteocielAdapter({
      meteocielScrapper: {
        fetchHTMLTrList: mockScrapperHTMLList,
        fetchUpdatedAtText: mockScrapperUpdatedAt,
      },
    });

    const mockHtml = `<html><body><table><tbody><tr bgcolor="#CCFFFF"><td rowspan="9" align="center" valign="center">Mar<br>01<br></td><td>15:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/nne.png" alt="Nord-Nord-Est : 15 °" title="Nord-Nord-Est : 15 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">--</td><td align="center" bgcolor="#a5a5a5">49 %</td><td align="center">1020 hPa</td><td align="center"><img alt="Ciel clair" title="Ciel clair" src="//static.meteociel.fr/prevision/test/picto/soleil.gif"></td></tr><tr bgcolor="#CCFFFF"><td>16:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/n.png" alt="Nord : 6 °" title="Nord : 6 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">3.8 mm</td><td align="center" bgcolor="#a5a5a5">47 %</td><td align="center">1019 hPa</td><td align="center"><img alt="Peu nuageux" title="Peu nuageux" src="//static.meteociel.fr/prevision/test/picto/peu_nuageux.gif"></td></tr></tbody></table></body></html>`;
    const dom = new JSDOM(mockHtml.toString());
    const document = dom.window.document;
    mockScrapperHTMLList.mockResolvedValue(document.querySelectorAll("tr"));
    mockScrapperUpdatedAt.mockResolvedValue("Dernière mise à jour à 18:00");

    vi.setSystemTime(new Date("2025-07-31T19:00:00Z"));

    const result = await meteocielAdapter.getNext24HoursRain();

    expect(result.data).toStrictEqual([
      { hour: "2025-08-01T15:00:00.000Z", value: 0.0 },
      { hour: "2025-08-01T16:00:00.000Z", value: 3.8 },
    ]);
    expect(result.updatedAt).toBe("2025-07-31T16:00:00.000Z");
  });

  test("In case of the data has been updated yesterday, the date should be the proper one", async () => {
    const meteocielAdapter = new MeteocielAdapter({
      meteocielScrapper: {
        fetchHTMLTrList: mockScrapperHTMLList,
        fetchUpdatedAtText: mockScrapperUpdatedAt,
      },
    });

    const mockHtml = `<html><body><table><tbody><tr bgcolor="#CCFFFF"><td rowspan="9" align="center" valign="center">Mar<br>01<br></td><td>15:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/nne.png" alt="Nord-Nord-Est : 15 °" title="Nord-Nord-Est : 15 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">--</td><td align="center" bgcolor="#a5a5a5">49 %</td><td align="center">1020 hPa</td><td align="center"><img alt="Ciel clair" title="Ciel clair" src="//static.meteociel.fr/prevision/test/picto/soleil.gif"></td></tr><tr bgcolor="#CCFFFF"><td>16:00</td><td align="center" bgcolor="#FF3300">26 °C</td><td align="center" bgcolor="#CC0000" class="wndchill"><font color="#ffaaaa">30</font></td><td align="center" bgcolor="#33CCFF"><img src="//static.meteociel.fr/prevision/test/vent/n.png" alt="Nord : 6 °" title="Nord : 6 °"></td><td align="center" bgcolor="#33CCFF">10</td><td bgcolor="#0099FF" align="center">30</td><td align="center">3.8 mm</td><td align="center" bgcolor="#a5a5a5">47 %</td><td align="center">1019 hPa</td><td align="center"><img alt="Peu nuageux" title="Peu nuageux" src="//static.meteociel.fr/prevision/test/picto/peu_nuageux.gif"></td></tr></tbody></table></body></html>`;
    const dom = new JSDOM(mockHtml.toString());
    const document = dom.window.document;
    mockScrapperHTMLList.mockResolvedValue(document.querySelectorAll("tr"));
    mockScrapperUpdatedAt.mockResolvedValue("Dernière mise à jour à 18:00");

    vi.setSystemTime(new Date("2025-07-31T03:00:00Z"));

    const result = await meteocielAdapter.getNext24HoursRain();

    expect(result.data).toStrictEqual([
      { hour: "2025-08-01T15:00:00.000Z", value: 0.0 },
      { hour: "2025-08-01T16:00:00.000Z", value: 3.8 },
    ]);
    expect(result.updatedAt).toBe("2025-07-30T16:00:00.000Z");
  });
});
