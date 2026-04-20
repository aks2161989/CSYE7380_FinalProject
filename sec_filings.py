"""
sec_filings.py -- Fetch Berkshire Hathaway 13F filings from SEC EDGAR
and compute quarterly investment activity (new/added/reduced/sold).
"""

import xml.etree.ElementTree as ET
from urllib.request import Request, urlopen
import json

CIK = "0001067983"  # Berkshire Hathaway
BASE = "https://data.sec.gov"
ARCHIVES = "https://www.sec.gov/Archives/edgar/data/1067983"
NS = {"ns": "http://www.sec.gov/edgar/document/thirteenf/informationtable"}
HEADERS = {"User-Agent": "BuffettRAG/1.0 (student-project@university.edu)"}


def _fetch(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req) as resp:
        return resp.read()


def _get_recent_13f_filings(count=2):
    """Return the accession numbers and dates of the most recent 13F-HR filings."""
    data = json.loads(_fetch(f"{BASE}/submissions/CIK{CIK}.json"))
    filings = data["filings"]["recent"]
    results = []
    for i in range(len(filings["form"])):
        if filings["form"][i] == "13F-HR":
            results.append({
                "accession": filings["accessionNumber"][i],
                "date": filings["filingDate"][i],
                "period": filings["reportDate"][i],
            })
            if len(results) >= count:
                break
    return results


def _find_infotable_xml(accession):
    """Find the XML info table file in a 13F filing."""
    acc_clean = accession.replace("-", "")
    index = json.loads(_fetch(f"{ARCHIVES}/{acc_clean}/index.json"))
    for item in index["directory"]["item"]:
        name = item["name"]
        if name.endswith(".xml") and name != "primary_doc.xml":
            return f"{ARCHIVES}/{acc_clean}/{name}"
    return None


def _parse_holdings(xml_bytes):
    """Parse 13F XML into {cusip: {name, shares, value}} aggregated by CUSIP."""
    root = ET.fromstring(xml_bytes)
    holdings = {}
    for entry in root.findall("ns:infoTable", NS):
        name = entry.find("ns:nameOfIssuer", NS).text
        cusip = entry.find("ns:cusip", NS).text
        value = int(entry.find("ns:value", NS).text)
        shares = int(entry.find("ns:shrsOrPrnAmt/ns:sshPrnamt", NS).text)
        if cusip in holdings:
            holdings[cusip]["shares"] += shares
            holdings[cusip]["value"] += value
        else:
            holdings[cusip] = {"name": name, "shares": shares, "value": value}
    return holdings


def _fmt_shares(n):
    """Format share count for display."""
    abs_n = abs(n)
    if abs_n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if abs_n >= 1_000:
        return f"{n / 1_000:.0f}K"
    return str(n)


def _fmt_value(v):
    """Format dollar value for display."""
    if v >= 1_000_000_000:
        return f"${v / 1_000_000_000:.1f}B"
    if v >= 1_000_000:
        return f"${v / 1_000_000:.0f}M"
    return f"${v:,.0f}"


def _quarter_label(period_date):
    """Convert '2025-12-31' to 'Q4 2025'."""
    parts = period_date.split("-")
    year = parts[0]
    month = int(parts[1])
    q = (month - 1) // 3 + 1
    return f"Q{q} {year}"


# Map CUSIPs to ticker symbols for well-known stocks
CUSIP_TO_TICKER = {
    "037833100": "AAPL", "025816109": "AXP", "060505104": "BAC",
    "191216100": "KO", "166764100": "CVX", "674599105": "OXY",
    "500754106": "KHC", "615369105": "MCO", "23918K108": "DVA",
    "92343E102": "VRSN", "21036P108": "STZ", "25754A201": "DPZ",
    "73278L105": "POOL", "78462F103": "SIRI", "171340102": "CHUBB",
    "02005N100": "ALLY", "38259P508": "GOOGL", "501044101": "KR",
    "92826C839": "V", "57636Q104": "MA", "21036P108": "STZ",
    "139898102": "CPOF",  "91324P102": "UNH",
}

# Map CUSIPs to sectors
CUSIP_TO_SECTOR = {
    "037833100": "Technology", "025816109": "Financial Services",
    "060505104": "Financial Services", "191216100": "Consumer Staples",
    "166764100": "Energy", "674599105": "Energy",
    "500754106": "Consumer Staples", "615369105": "Financial Services",
    "23918K108": "Healthcare", "92343E102": "Technology",
    "21036P108": "Consumer Staples", "25754A201": "Consumer Discretionary",
    "73278L105": "Consumer Discretionary", "78462F103": "Communication",
    "171340102": "Financial Services", "02005N100": "Financial Services",
    "38259P508": "Technology", "501044101": "Consumer Staples",
    "92826C839": "Financial Services", "57636Q104": "Financial Services",
    "91324P102": "Healthcare",
}


def fetch_investment_activity():
    """
    Fetch the two most recent 13F filings and compute investment activity.
    Returns a dict with 'quarter', 'prev_quarter', and 'activity' list.
    """
    filings = _get_recent_13f_filings(2)
    if len(filings) < 2:
        return None

    current_filing = filings[0]
    previous_filing = filings[1]

    # Fetch and parse both filings
    current_xml_url = _find_infotable_xml(current_filing["accession"])
    previous_xml_url = _find_infotable_xml(previous_filing["accession"])

    if not current_xml_url or not previous_xml_url:
        return None

    current_holdings = _parse_holdings(_fetch(current_xml_url))
    previous_holdings = _parse_holdings(_fetch(previous_xml_url))

    current_q = _quarter_label(current_filing["period"])
    prev_q = _quarter_label(previous_filing["period"])

    activity = []

    # Find new and changed positions
    for cusip, curr in current_holdings.items():
        prev = previous_holdings.get(cusip)
        ticker = CUSIP_TO_TICKER.get(cusip, "")
        sector = CUSIP_TO_SECTOR.get(cusip, "Other")
        display_name = curr["name"].title()
        if ticker:
            display_name = f"{display_name} ({ticker})"

        if prev is None:
            # New position
            activity.append({
                "quarter": current_q,
                "action": "New",
                "company": display_name,
                "shares": _fmt_shares(curr["shares"]),
                "value": _fmt_value(curr["value"]),
                "sector": sector,
                "sortValue": curr["value"],
            })
        elif curr["shares"] > prev["shares"]:
            diff = curr["shares"] - prev["shares"]
            activity.append({
                "quarter": current_q,
                "action": "Added",
                "company": display_name,
                "shares": f"+{_fmt_shares(diff)}",
                "value": f"{_fmt_value(curr['value'])} total",
                "sector": sector,
                "sortValue": curr["value"],
            })
        elif curr["shares"] < prev["shares"]:
            diff = prev["shares"] - curr["shares"]
            activity.append({
                "quarter": current_q,
                "action": "Reduced",
                "company": display_name,
                "shares": f"-{_fmt_shares(diff)}",
                "value": f"{_fmt_value(curr['value'])} remaining",
                "sector": sector,
                "sortValue": curr["value"],
            })

    # Find sold positions (in previous but not in current)
    for cusip, prev in previous_holdings.items():
        if cusip not in current_holdings:
            ticker = CUSIP_TO_TICKER.get(cusip, "")
            sector = CUSIP_TO_SECTOR.get(cusip, "Other")
            display_name = prev["name"].title()
            if ticker:
                display_name = f"{display_name} ({ticker})"
            activity.append({
                "quarter": current_q,
                "action": "Sold",
                "company": display_name,
                "shares": "Full exit",
                "value": "--",
                "sector": sector,
                "sortValue": 0,
            })

    # Sort: New first, then Added, Reduced, Sold — within each group by value desc
    action_order = {"New": 0, "Added": 1, "Reduced": 2, "Sold": 3}
    activity.sort(key=lambda x: (action_order.get(x["action"], 9), -x["sortValue"]))

    # Remove sortValue from output
    for item in activity:
        item.pop("sortValue", None)

    return {
        "quarter": current_q,
        "prev_quarter": prev_q,
        "filing_date": current_filing["date"],
        "activity": activity,
    }


if __name__ == "__main__":
    result = fetch_investment_activity()
    if result:
        print(f"Latest: {result['quarter']} (filed {result['filing_date']})")
        print(f"Compared to: {result['prev_quarter']}")
        print(f"\n{'Action':<10} {'Company':<35} {'Shares':<15} {'Value':<20} {'Sector'}")
        print("-" * 100)
        for a in result["activity"]:
            print(f"{a['action']:<10} {a['company']:<35} {a['shares']:<15} {a['value']:<20} {a['sector']}")
    else:
        print("Failed to fetch filing data")
