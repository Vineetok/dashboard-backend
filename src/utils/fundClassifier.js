export function getFundIndex(name) {
  const n = name.toLowerCase();

  if (n.includes("nifty 50")) return "nifty";
  if (n.includes("nifty next 50")) return "nifty";
  if (n.includes("nifty midcap")) return "nifty";
  if (n.includes("nifty smallcap")) return "nifty";

  if (n.includes("sensex")) return "sensex";

  if (n.includes("bank nifty") || n.includes("banknifty")) return "banknifty";

  return "others";
}

export function getFundType(name) {
  const n = name.toLowerCase();
  
  let plan = "Regular Plan";
  if (n.includes("direct")) {
    plan = "Direct Plan";
  }
  
  let option = "Growth";
  if (n.includes("idcw") || n.includes("dividend") || n.includes("income distribution")) {
    option = "IDCW";
  } else if (n.includes("payout")) {
    option = "Payout";
  }

  return `${plan} • ${option}`;
}

export function getFundCategory(name) {
  const n = name.toLowerCase()

  if (n.includes("liquid")) return "Liquid Fund"
  if (n.includes("overnight")) return "Overnight Fund"
  if (n.includes("ultra short")) return "Ultra Short Duration"
  if (n.includes("short duration")) return "Short Duration"

  if (n.includes("large cap")) return "Large Cap"
  if (n.includes("mid cap")) return "Mid Cap"
  if (n.includes("small cap")) return "Small Cap"

  if (n.includes("flexi cap")) return "Flexi Cap"
  if (n.includes("multi cap")) return "Multi Cap"

  if (n.includes("elss") || n.includes("tax saver")) return "ELSS"

  if (n.includes("index")) return "Index Fund"
  if (n.includes("etf")) return "ETF"

  if (n.includes("hybrid") || n.includes("balanced")) return "Hybrid Fund"
  if (n.includes("arbitrage")) return "Arbitrage Fund"

  if (n.includes("corporate bond")) return "Corporate Bond"
  if (n.includes("gilt")) return "Gilt Fund"

  if (n.includes("idcw") || n.includes("dividend") || n.includes("income distribution"))
    return "IDCW"

  return "Other"
}

export function getFundRisk(name) {
  const category = getFundCategory(name)

  switch (category) {
    case "Overnight Fund":
    case "Liquid Fund":
      return "Low"

    case "Ultra Short Duration":
    case "Short Duration":
    case "Corporate Bond":
      return "Low to Moderate"

    case "Arbitrage Fund":
    case "Hybrid Fund":
      return "Moderate"

    case "Large Cap":
    case "Index Fund":
      return "Moderate to High"

    case "Mid Cap":
      return "High"

    case "Small Cap":
      return "Very High"

    case "Flexi Cap":
    case "Multi Cap":
    case "ELSS":
      return "High"

    default:
      return "Moderate"
  }
}

export function getRiskWidth(name) {
  const risk = getFundRisk(name)

  if (risk === "Low") return "20%"
  if (risk === "Low to Moderate") return "35%"
  if (risk === "Moderate") return "50%"
  if (risk === "Moderate to High") return "65%"
  if (risk === "High") return "80%"
  if (risk === "Very High") return "95%"

  return "50%"
}
