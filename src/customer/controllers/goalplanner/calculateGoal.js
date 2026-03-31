import pool from '../../../config/db.js';
/* ===============================
   GOAL CALCULATOR
================================= */
export const calculateGoal = async (req, res) => {
  try {
    const target_amount = Number (req.body.target_amount);
    const target_years = Number (req.body.target_years);
    const expected_return = Number (req.body.expected_return);
    const current_savings = Number (req.body.current_savings || 0);

    if (!target_amount || !target_years || !expected_return) {
      return res.status (400).json ({
        success: false,
        message: 'Please provide target_amount, target_years and expected_return',
      });
    }

    const monthlyRate = expected_return / 12 / 100;
    const months = target_years * 12;

    const futureSavings = current_savings * Math.pow (1 + monthlyRate, months);

    const remainingAmount = target_amount - futureSavings;

    const sip =
      remainingAmount * monthlyRate / (Math.pow (1 + monthlyRate, months) - 1);

    res.status (200).json ({
      success: true,
      message: 'Goal calculation successful',
      data: {
        monthly_investment_required: Math.ceil (sip),
        future_value_of_current_savings: Math.ceil (futureSavings),
        remaining_amount: Math.ceil (remainingAmount),
      },
    });
  } catch (error) {
    console.error ('Calculate Goal Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Calculation failed',
    });
  }
};
