import axios from "axios";

const BASE_URL = process.env.YAHOO_BASE_URL;

export const fetchMarketIndices = async () => {
  const symbols = [
    "^NSEI",
    "^BSESN",
    "^NSEBANK",
    "^CNXIT",
    "^NSMIDCP50",
    "^NSEMDCP50",
    "GOLDBEES.NS",
  ];

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await axios.get(
          `${BASE_URL}/${symbol}?interval=1d&range=1d`
        );

        const result = response.data.chart.result[0];
        const meta = result.meta;

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;

        if (!price || !prevClose) return null;

        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        let name = symbol;

        if (symbol === "^NSEI") name = "Nifty 50";
        if (symbol === "^BSESN") name = "Sensex";
        if (symbol === "^NSEBANK") name = "Bank Nifty";
        if (symbol === "^CNXIT") name = "Nifty IT";
        if (symbol === "^NSMIDCP50") name = "Nifty Next 50";
        if (symbol === "^NSEMDCP50") name = "Nifty Midcap 50";

        if (symbol === "GOLDBEES.NS") {
          name = "Gold (10g)";
          const multiplier = 1000;

          return {
            name,
            price: (price * multiplier).toFixed(2),
            change: (change * multiplier).toFixed(2),
            changePercent: changePercent.toFixed(2),
            trend: change >= 0 ? "up" : "down",
          };
        }

        return {
          name,
          price: price.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          trend: change >= 0 ? "up" : "down",
        };
      } catch (err) {
        console.error(`Error fetching ${symbol}`, err.message);
        return null;
      }
    })
  );

  return results.filter(Boolean);
};
