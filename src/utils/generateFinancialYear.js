// FOR CUSTOMER & DETAIL LEADS
export const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
};

// FOR DETAIL LEADS ONLY
export const getSubCategoryPrefix = (subCategory) => {
  if (!subCategory) return "XX";
  if (subCategory === "Marine Insurance") return "MAR";
  if (subCategory === "Corporate Insurance") return "COR";

  const words = subCategory.toUpperCase().replace(/_/g, " ").split(" ");

  if (words.length === 1) return words[0][0];
  return words[0][0] + words[1][0];
};

// FOR CUSTOMER DETAIL LEADS ONLY
export const getCustomerSubCategoryPrefix = (subCategory) => {
  if (!subCategory) return "XCL";

  const words = subCategory.toUpperCase().split(" ");
  const first = words[0]?.[0] || "X";
  const second = words[1]?.[0] || "X";

  return `${first}${second}C`;
};
