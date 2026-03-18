import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SEC_SUBMISSIONS_BASE = "https://data.sec.gov/submissions";
const SEC_SEARCH_BASE = "https://efts.sec.gov/LATEST/search-index";
const SEC_USER_AGENT = "Traverse Journal admin@traversejournal.com";

type SecHolding = {
  nameOfIssuer: string;
  titleOfClass: string;
  value: number;
  shares: number;
  type: string;
};

// Pad CIK to 10 digits with leading zeros (SEC requirement)
// Returns null if input is not numeric (prevents SSRF via URL injection)
function padCik(cik: string): string | null {
  const cleaned = cik.replace(/^0+/, "");
  if (!/^\d{1,10}$/.test(cleaned)) return null;
  return cleaned.padStart(10, "0");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`market:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const cik = searchParams.get("cik");
  const search = searchParams.get("search");

  if (!cik && !search) {
    return NextResponse.json(
      { error: "Provide either ?cik= or ?search= parameter" },
      { status: 400 }
    );
  }

  const headers = {
    "User-Agent": SEC_USER_AGENT,
    Accept: "application/json",
  };

  try {
    // Search mode: find filers by name
    if (search) {
      const searchRes = await fetch(
        `${SEC_SEARCH_BASE}?q=${encodeURIComponent(search)}&dateRange=custom&startdt=2024-01-01&forms=13-F`,
        { headers, next: { revalidate: 86400 } }
      );

      if (!searchRes.ok) {
        console.error("[market/sec-13f] SEC search returned", searchRes.status);
        return NextResponse.json(
          { error: "SEC EDGAR search failed" },
          { status: 502 }
        );
      }

      const searchData = await searchRes.json();
      const hits = searchData?.hits?.hits ?? [];

      const results = hits.slice(0, 20).map(
        (hit: {
          _source?: {
            entity_name?: string;
            entity_cik?: string;
            file_date?: string;
            file_num?: string;
            form_type?: string;
          };
        }) => ({
          name: hit._source?.entity_name ?? "Unknown",
          cik: hit._source?.entity_cik ?? "",
          filingDate: hit._source?.file_date ?? "",
          fileNumber: hit._source?.file_num ?? "",
          formType: hit._source?.form_type ?? "13-F",
        })
      );

      const response = NextResponse.json({
        mode: "search",
        query: search,
        results,
        timestamp: Date.now(),
      });
      response.headers.set(
        "Cache-Control",
        "s-maxage=86400, stale-while-revalidate=172800"
      );
      return response;
    }

    // CIK mode: fetch the filer's submissions and parse 13-F holdings
    const paddedCik = padCik(cik!);
    if (!paddedCik) {
      return NextResponse.json(
        { error: "CIK must be a numeric value (1-10 digits)" },
        { status: 400 }
      );
    }

    const submissionsRes = await fetch(
      `${SEC_SUBMISSIONS_BASE}/CIK${paddedCik}.json`,
      { headers, next: { revalidate: 86400 } }
    );

    if (!submissionsRes.ok) {
      if (submissionsRes.status === 404) {
        return NextResponse.json(
          { error: `No SEC filings found for CIK ${cik}` },
          { status: 404 }
        );
      }
      console.error("[market/sec-13f] SEC submissions returned", submissionsRes.status);
      return NextResponse.json(
        { error: "SEC EDGAR API error" },
        { status: 502 }
      );
    }

    const submissionsData = await submissionsRes.json();

    const filer = {
      name: submissionsData.name ?? "Unknown Filer",
      cik: submissionsData.cik ?? cik,
      sic: submissionsData.sic ?? "",
      sicDescription: submissionsData.sicDescription ?? "",
      stateOfIncorporation: submissionsData.stateOfIncorporation ?? "",
    };

    // Find the most recent 13-F filing
    const recentFilings = submissionsData.filings?.recent ?? {};
    const forms: string[] = recentFilings.form ?? [];
    const accessionNumbers: string[] = recentFilings.accessionNumber ?? [];
    const filingDates: string[] = recentFilings.filingDate ?? [];
    const primaryDocuments: string[] = recentFilings.primaryDocument ?? [];

    let filingIndex = -1;
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] === "13-F-HR" || forms[i] === "13-F") {
        filingIndex = i;
        break;
      }
    }

    if (filingIndex === -1) {
      const response = NextResponse.json({
        mode: "cik",
        filer,
        filingDate: null,
        holdings: [],
        message: "No 13-F filings found for this filer",
        timestamp: Date.now(),
      });
      response.headers.set(
        "Cache-Control",
        "s-maxage=86400, stale-while-revalidate=172800"
      );
      return response;
    }

    const accession = accessionNumbers[filingIndex].replace(/-/g, "");
    const filingDate = filingDates[filingIndex];
    const primaryDoc = primaryDocuments[filingIndex];

    // Try to fetch the XML info table for detailed holdings
    const accessionDashed = accessionNumbers[filingIndex];
    const infoTableUrl = `https://www.sec.gov/Archives/edgar/data/${paddedCik.replace(/^0+/, "")}/${accession}/infotable.xml`;

    let holdings: SecHolding[] = [];

    const infoTableRes = await fetch(infoTableUrl, {
      headers,
      next: { revalidate: 86400 },
    });

    if (infoTableRes.ok) {
      const xmlText = await infoTableRes.text();

      // Parse XML info table entries using regex (no XML parser needed for this structured format)
      const entryPattern =
        /<infoTable[^>]*>([\s\S]*?)<\/infoTable>/gi;
      const namePattern = /<nameOfIssuer>(.*?)<\/nameOfIssuer>/i;
      const titlePattern = /<titleOfClass>(.*?)<\/titleOfClass>/i;
      const valuePattern = /<value>(.*?)<\/value>/i;
      const sharesPattern =
        /<sshPrnamt>(.*?)<\/sshPrnamt>/i;
      const typePattern =
        /<sshPrnamtType>(.*?)<\/sshPrnamtType>/i;

      let match;
      while ((match = entryPattern.exec(xmlText)) !== null) {
        const entry = match[1];
        const nameMatch = entry.match(namePattern);
        const titleMatch = entry.match(titlePattern);
        const valueMatch = entry.match(valuePattern);
        const sharesMatch = entry.match(sharesPattern);
        const typeMatch = entry.match(typePattern);

        holdings.push({
          nameOfIssuer: nameMatch?.[1]?.trim() ?? "Unknown",
          titleOfClass: titleMatch?.[1]?.trim() ?? "COM",
          value: Number(valueMatch?.[1]?.replace(/,/g, "") ?? 0) * 1000, // SEC reports in thousands
          shares: Number(sharesMatch?.[1]?.replace(/,/g, "") ?? 0),
          type: typeMatch?.[1]?.trim() ?? "SH",
        });
      }

      // Sort by value descending
      holdings.sort((a, b) => b.value - a.value);
    }

    const response = NextResponse.json({
      mode: "cik",
      filer,
      filingDate,
      accessionNumber: accessionDashed,
      primaryDocument: primaryDoc,
      holdings: holdings.slice(0, 100), // Top 100 holdings
      totalHoldings: holdings.length,
      totalValue: holdings.reduce((sum, h) => sum + h.value, 0),
      timestamp: Date.now(),
    });

    response.headers.set(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate=172800"
    );
    return response;
  } catch (err) {
    console.error("[market/sec-13f]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch SEC 13-F data" },
      { status: 500 }
    );
  }
}
