import axios from "axios";
import cheerio from "cheerio";
import cron from "node-cron";
import pool from "../config/db.js";

// Clean share name
// const cleanShareName = (name) =>
//   name.replace(/\b(Unlisted Shares|Limited|Ltd|Share|Shares)\b/gi, "").trim();

// Convert share name → URL slug
const generateSlug = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-") +
  "-unlisted-shares";

export const fetchAndStoreNews = async () => {
  try {
    const sharesResult = await pool.query(
      "SELECT id, shares_name FROM shares"
    );

    const shares = sharesResult.rows;
    if (!shares.length) return;

    for (let share of shares) {
      const slug = generateSlug(share.shares_name);
      const url = `${process.env.UNLISTEDZONE_BASE_URL}${slug}/`;

      try {
        const { data } = await axios.get(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 10000
        });

        const $ = cheerio.load(data);

        const articles = [];

        $(".post-item").each((i, el) => {
          const title = $(el).find("h2 a").text().trim();
          const articleUrl = $(el).find("h2 a").attr("href");
          const date = $(el).find(".post-date").text().trim();

          if (title) {
            articles.push({ title, articleUrl, date });
          }
        });

        for (let article of articles) {
          await pool.query(
            `INSERT INTO corporate_actions
             (share_id, title, description, type, source, source_url, action_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (title) DO NOTHING`,
            [
              share.id,
              article.title,
              "Latest news update",
              "ARTICLE",
              "UnlistedZone",
              article.articleUrl,
              article.date ? new Date(article.date) : new Date(),
            ]
          );
        }

      } catch (err) {
        // Optional: keep silent OR log minimal error
        console.error(`News fetch failed for ${share.shares_name}`);
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
