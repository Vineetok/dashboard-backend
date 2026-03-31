import pool from "../config/db.js";

export const generateAdvId = async () => {
  const query = `SELECT adv_id FROM partners ORDER BY id DESC LIMIT 1`;
  const { rows } = await pool.query(query);

  let newNumber = 1;
  if (rows.length > 0) {
    const lastAdvId = rows[0].adv_id;
    const lastNum = parseInt(lastAdvId.split("_")[1]);
    newNumber = lastNum + 1;
  }

  return `ADV_${String(newNumber).padStart(3, "0")}`;
};
