import pool from '../../../config/db.js';
export const updateGoal = async (req, res) => {
  try {
    const { goal_id } = req.params;
    const {
      goal_name,
      target_amount,
      target_years,
      expected_return,
      current_savings
    } = req.body;

    const result = await pool.query(
      `UPDATE tbl_goals
       SET goal_name = COALESCE($1, goal_name),
           target_amount = COALESCE($2, target_amount),
           target_years = COALESCE($3, target_years),
           expected_return = COALESCE($4, expected_return),
           current_savings = COALESCE($5, current_savings),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, goal_name, target_amount, target_years, expected_return, current_savings, updated_at`,
      [
        goal_name ?? null,
        target_amount ?? null,
        target_years ?? null,
        expected_return ?? null,
        current_savings ?? null,
        goal_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Goal not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Update Goal Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update goal"
    });
  }
};