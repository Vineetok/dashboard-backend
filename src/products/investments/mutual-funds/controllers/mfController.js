import * as mfApiService from '../services/mfApiService.js';

/**
 * GET /search?q=...
 */
export const searchFunds = async (req, res) => {
    try {
        const { q } = req.query;
        // Allow empty query for initial load/explore
        const results = await mfApiService.searchFunds(q || '');
        res.json(results);
    } catch (error) {
        console.error('MF Search Error:', error);
        res.status(500).json({ error: 'Failed to search funds' });
    }
};

/**
 * GET /details/:schemeCode
 */
export const getFundDetails = async (req, res) => {
    try {
        const { schemeCode } = req.params;
        if (!schemeCode) {
            return res.status(400).json({ error: 'Scheme code is required' });
        }
        const details = await mfApiService.getFullFundDetails(schemeCode);
        if (!details) {
            return res.status(404).json({ error: 'Fund not found' });
        }
        res.json(details);
    } catch (error) {
        console.error('MF Details Error:', error);
        res.status(500).json({ error: 'Failed to fetch fund details' });
    }
};

/**
 * GET /top-performing
 */
export const getTopPerforming = async (req, res) => {
    try {
        const results = await mfApiService.getTopPerformingFunds();
        res.json(results);
    } catch (error) {
        console.error('MF Top Performing Error:', error);
        res.status(500).json({ error: 'Failed to fetch top performing funds' });
    }
};
