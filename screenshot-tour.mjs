import puppeteer from "puppeteer";

const TOUR_STEPS = 18;
const OUTPUT_DIR = "/tmp/tour-screenshots";
const BASE_URL = "http://localhost:3000";

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 800 });

  // Set dev-only bypass cookie + onboarding gate bypass
  await page.setCookie({
    name: "screenshot-bypass",
    value: "1",
    domain: "localhost",
    path: "/",
  });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("stargate-onboarded", "true");
  });

  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2", timeout: 30000 });

  // Clear tour localStorage to trigger fresh tour
  await page.evaluate(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("stargate-tour-") || key.startsWith("stargate-onboard") || key === "stargate-onboarded" || key === "stargate-features-seen")) {
        localStorage.removeItem(key);
      }
    }
  });

  // Reload to trigger fresh tour
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2", timeout: 30000 });

  // Wait for tour to auto-start (1000ms delay + render + animation)
  await new Promise((r) => setTimeout(r, 3000));

  for (let i = 0; i < TOUR_STEPS; i++) {
    const stepNum = String(i + 1).padStart(2, "0");

    // Wait for the card to be visible
    try {
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-name="nextstep-pointer"]');
        return el && el.getBoundingClientRect().width > 0;
      }, { timeout: 5000 });
    } catch {
      console.log(`Step ${i + 1}: pointer element not found, taking screenshot anyway`);
    }

    // Extra settle time for animation
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({ path: `${OUTPUT_DIR}/step-${stepNum}.png`, fullPage: false });
    console.log(`Captured step ${i + 1}/${TOUR_STEPS}`);

    if (i < TOUR_STEPS - 1) {
      // Click the Next button inside the tour card
      const clicked = await page.evaluate(() => {
        const pointer = document.querySelector('[data-name="nextstep-pointer"]');
        if (!pointer) return false;
        const btns = pointer.querySelectorAll("button");
        for (const btn of btns) {
          const text = btn.textContent?.trim();
          if (text === "Next" || text === "Done") {
            btn.click();
            return true;
          }
        }
        const allBtns = document.querySelectorAll("button");
        for (const btn of allBtns) {
          if (btn.textContent?.trim() === "Next") {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not find Next button at step ${i + 1}, stopping`);
        break;
      }

      // Wait for transition animation to complete
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUTPUT_DIR}/`);
}

main().catch(console.error);
