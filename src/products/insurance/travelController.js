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