import cron from "node-cron";
import pool from "../config/db.js";
import Parser from "rss-parser";

const parser = new Parser();

const cleanShareName = (name) =>
  name.replace(/\b(Unlisted Shares|Limited|Ltd|Share|Shares)\b/gi, "").trim();

export const fetchAndStoreNews = async () => {
  try {
    const sharesResult = await pool.query(
      "SELECT id, shares_name FROM tbl_shares"
    );
    const shares = sharesResult.rows;

    if (!shares.length) return;

    for (let share of shares) {
      const companyName = cleanShareName(share.shares_name);

      const rssUrl = `${process.env.GOOGLE_NEWS_RSS}${encodeURIComponent(
        companyName
      )}${process.env.GOOGLE_NEWS_PARAMS}`;


      const feed = await parser.parseURL(rssUrl);

      if (!feed.items || feed.items.length === 0) continue;

      for (let item of feed.items.slice(0, 5)) {
        await pool.query(
          `INSERT INTO tbl_corporate_actions
          (share_id, title, description, type, source, source_url, action_date)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (title) DO NOTHING`,
          [
            share.id,
            item.title,
            item.contentSnippet || "Latest news update",
            "ARTICLE",
            "Google News",
            item.link,
            item.pubDate ? new Date(item.pubDate) : new Date(),
          ]
        );
      }
    }

  } catch (error) {
    console.error("News Cron Error:", error.message);
  }
};

export const startNewsCron = () => {
  fetchAndStoreNews();

  cron.schedule("0 8 * * *", () => {
    fetchAndStoreNews();
  });
};
