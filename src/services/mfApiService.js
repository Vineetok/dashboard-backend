import axios from 'axios';
import * as fundClassifier from '../utils/fundClassifier.js';


const AMFI_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';
const MFAPI_BASE = 'https://api.mfapi.in';
const AMFI_CACHE_MS = 60 * 60 * 1000; // 1 hour
const MF_DETAILS_CACHE_MS = 30 * 60 * 1000; // 30 minutes

let amfiCache = null;
let amfiList = []; // Array index for faster searching
const mfDetailsCache = {};

/**
 * Parses AMFI NAVAll.txt into a JSON map.
 */
function parseAmfiText(text) {
    const result = {};
    const list = [];
    let fundHouse = '';

    const lines = text.split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (!line.includes(';')) {
            if (!line.startsWith('Open Ended') && !line.startsWith('Close Ended') && !line.startsWith('Interval')) {
                fundHouse = line;
            }
            continue;
        }

        const parts = line.split(';');
        if (parts.length < 6) continue;

        const schemeCode = parts[0].trim();
        const name = parts[3].trim();
        const nav = parts[4].trim();
        const date = parts[5].trim();

        if (!schemeCode || isNaN(Number(schemeCode)) || !name || nav === 'N.A.' || !nav) continue;

        const fund = { schemeCode, name, nav, date, fundHouse };
        result[schemeCode] = fund;
        list.push(fund);
    }
    return { map: result, list };
}

/**
 * Fetches AMFI NAV data with in-memory cache.
 */
export async function fetchAMFINav() {
    if (amfiCache && Date.now() - amfiCache.timestamp < AMFI_CACHE_MS) {
        return amfiCache.data;
    }

    try {
        const response = await axios.get(AMFI_URL, { timeout: 30000 });
        const parsed = parseAmfiText(response.data);

        amfiCache = { data: parsed.map, timestamp: Date.now() };
        amfiList = parsed.list;

        return parsed.map;
    } catch (error) {
        console.error('Error fetching AMFI data:', error.message);
        return amfiCache ? amfiCache.data : {};
    }
}

/**
 * Searches funds in AMFI dataset.
 */
export async function searchFunds(query) {
    if (!amfiList.length) await fetchAMFINav();
    const q = query.toLowerCase();

    return amfiList
        .filter((f) => {
            const name = f.name.toLowerCase();
            if (name.includes('direct')) return false;
            const isRegular = name.includes('growth') || name.includes('idcw') || name.includes('dividend');
            return isRegular && (!q || name.includes(q));
        })
        .slice(0, 100)
        .map((f) => ({
            ...f,
            category: fundClassifier.getFundCategory(f.name),
            type: fundClassifier.getFundType(f.name),
            risk: fundClassifier.getFundRisk(f.name),
            riskWidth: fundClassifier.getRiskWidth(f.name)
        }));
}

/**
 * Fetches fund details from mfapi.in with truncation and cache.
 */
export async function getFullFundDetails(schemeCode) {
    const cached = mfDetailsCache[schemeCode];
    if (cached && Date.now() - cached.timestamp < MF_DETAILS_CACHE_MS) {
        return cached.data;
    }

    try {
        const response = await axios.get(`${MFAPI_BASE}/mf/${schemeCode}`, { timeout: 20000 });
        const data = response.data;

        if (data && data.meta) {
            const name = data.meta.scheme_name;
            data.meta.category = fundClassifier.getFundCategory(name);
            data.meta.type = fundClassifier.getFundType(name);
            data.meta.risk = fundClassifier.getFundRisk(name);
            data.meta.riskWidth = fundClassifier.getRiskWidth(name);
        }

        if (data && data.data && Array.isArray(data.data)) {
            const latestDateStr = data.data[0]?.date;
            if (latestDateStr) {
                const [d, m, y] = latestDateStr.split('-').map(Number);
                const latestDate = new Date(y, m - 1, d);
                const fiveYearsAgo = new Date(latestDate);
                fiveYearsAgo.setFullYear(latestDate.getFullYear() - 5);

                data.data = data.data.filter(entry => {
                    const [ed, em, ey] = entry.date.split('-').map(Number);
                    const entryDate = new Date(ey, em - 1, ed);
                    return entryDate >= fiveYearsAgo;
                });
            }
        }

        if (!mfDetailsCache[schemeCode]) {
            mfDetailsCache[schemeCode] = {};
        }
        mfDetailsCache[schemeCode] = { data, timestamp: Date.now() };
        return data;
    } catch (error) {
        console.error(`Error fetching fund details for ${schemeCode}:`, error.message);
        return cached ? cached.data : null;
    }
}

/**
 * Top performing funds (simple filter for now).
 */
export async function getTopPerformingFunds() {
    const results = await searchFunds('Bluechip');
    return results.slice(0, 4);
}
