import pool from '../../../config/db.js';

export const createGoal = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      goal_name,
      target_amount,
      target_years,
      expected_return,
      current_savings,
    } = req.body;

    const result = await pool.query (
      `INSERT INTO tbl_goals
      (user_id, goal_name, target_amount, target_years, expected_return, current_savings)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        user_id,
        goal_name,
        target_amount,
        target_years,
        expected_return,
        current_savings || 0,
      ]
    );

    res.status (201).json ({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error ('Create Goal Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Failed to create goal',
    });
  }
};
export default createGoal;
