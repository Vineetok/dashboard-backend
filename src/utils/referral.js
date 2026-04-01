export const generateReferralCode = (name, id) => {
    const cleanName = name.replace(/\s+/g, "").toUpperCase();
    return `DSA${id}${cleanName.substring(0, 3)}`;
};