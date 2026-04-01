import pool from '../../../config/db.js';

/* ===============================
   DELETE GOAL
================================= */

export const deleteGoal = async (req, res) => {
  try {
    const {goal_id} = req.params;

    const result = await pool.query (`DELETE FROM tbl_goals WHERE id = $1`, [
      goal_id,
    ]);

    if (result.rowCount === 0) {
      return res.status (404).json ({
        success: false,
        message: 'Goal not found',
      });
    }

    res.status (200).json ({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error ('Delete Goal Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Failed to delete goal',
    });
  }
};
