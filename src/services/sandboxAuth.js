import axios from "axios";

let cachedToken = null;
let tokenExpiry = null;

export const getSandboxToken = async () => {
  try {
    // If token exists and not expired, reuse
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/authenticate`,
      {},
      {
        headers: {
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-secret": process.env.SANDBOX_SECRET_KEY,
          "x-api-version": process.env.SANDBOX_API_VERSION,
        },
      },
    );

    const token = response.data?.data?.access_token;

    if (!token) {
      throw new Error("Failed to get access token");
    }

    cachedToken = token;

    // Token valid for 24 hrs → set 23 hrs safe expiry
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

    return token;
  } catch (error) {
    console.error(
      "Sandbox Auth Error:",
      error?.response?.data || error.message,
    );
    throw new Error("Sandbox authentication failed");
  }
};
