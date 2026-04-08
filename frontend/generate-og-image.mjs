import { createRequire } from "module";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const __dirname = dirname(fileURLToPath(import.meta.url));

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500;1,600&family=Lato:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: #08182E;
    font-family: 'Lato', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* Background grid pattern */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* Top gold line */
  .top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #D4AF37, #1FA2A8, #D4AF37);
  }

  /* Left accent bar */
  .left-bar {
    position: absolute;
    top: 60px; bottom: 60px; left: 60px;
    width: 3px;
    background: linear-gradient(180deg, #D4AF37 0%, rgba(212,175,55,0.1) 100%);
  }

  /* Main content */
  .content {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 80px 60px 100px;
  }

  /* Shield icon area */
  .logo-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 40px;
  }
  .logo-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .logo-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .logo-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px;
    font-style: italic;
    color: #1FA2A8;
    letter-spacing: 1px;
  }

  /* Eyebrow */
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .eyebrow-line {
    width: 36px;
    height: 1px;
    background: #D4AF37;
  }
  .eyebrow-text {
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* Headline */
  .headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 72px;
    font-weight: 700;
    color: #fff;
    line-height: 1.05;
    letter-spacing: -1px;
    margin-bottom: 24px;
    max-width: 700px;
  }
  .headline em {
    font-style: italic;
    color: #D4AF37;
    font-weight: 600;
  }

  /* Subheadline */
  .subheadline {
    font-size: 18px;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
    max-width: 600px;
    font-weight: 400;
    border-left: 2px solid #1FA2A8;
    padding-left: 18px;
    margin-bottom: 40px;
  }

  /* Feature pills */
  .pills {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pill {
    padding: 7px 16px;
    border: 1px solid rgba(212,175,55,0.35);
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: rgba(212,175,55,0.06);
  }

  /* Right visual */
  .right-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 380px;
    background: linear-gradient(135deg, rgba(10,31,68,0.8), rgba(8,24,46,0.95));
    border-left: 1px solid rgba(212,175,55,0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 40px 30px;
  }

  .score-ring {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 3px solid rgba(16,185,129,0.3);
    background: rgba(16,185,129,0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    position: relative;
  }
  .score-ring::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 1px solid rgba(16,185,129,0.15);
  }
  .score-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 56px;
    font-weight: 700;
    color: #10B981;
    line-height: 1;
  }
  .score-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .risk-badge {
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.4);
    color: #10B981;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 3px;
    padding: 8px 20px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .stats {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .stat-key {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.4);
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .stat-val {
    font-size: 11px;
    font-weight: 700;
    color: #10B981;
    letter-spacing: 1px;
  }

  /* Domain badge */
  .domain {
    position: absolute;
    bottom: 28px;
    right: 30px;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.3);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="top-bar"></div>
  <div class="left-bar"></div>

  <div class="content">
    <div class="logo-row">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      </svg>
      <div class="logo-text-wrap">
        <span class="logo-name">BhumiRakshak</span>
        <span class="logo-sub">Land Verification</span>
      </div>
    </div>

    <div class="eyebrow">
      <div class="eyebrow-line"></div>
      <span class="eyebrow-text">AI-Powered · Jharkhand</span>
    </div>

    <h1 class="headline">Verify Your Land<br>Before You <em>Buy.</em></h1>

    <p class="subheadline">
      Khatiyan analysis · CNT Act compliance · Tribal land detection · Forest boundary check
    </p>

    <div class="pills">
      <span class="pill">8-Factor Risk Score</span>
      <span class="pill">2-Minute Report</span>
      <span class="pill">Claude AI Vision</span>
    </div>
  </div>

  <div class="right-panel">
    <div class="score-ring">
      <span class="score-value">18</span>
      <span class="score-label">Risk Score</span>
    </div>
    <div class="risk-badge">● Low Risk</div>
    <div class="stats">
      <div class="stat-row">
        <span class="stat-key">CNT Compliance</span>
        <span class="stat-val">PASS</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Forest Check</span>
        <span class="stat-val">CLEAR</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Chain of Title</span>
        <span class="stat-val">VERIFIED</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Recommendation</span>
        <span class="stat-val">APPROVE</span>
      </div>
    </div>
  </div>

  <span class="domain">bhumirakshak.com</span>
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Wait for fonts
  await new Promise((r) => setTimeout(r, 1500));

  const screenshot = await page.screenshot({ type: "jpeg", quality: 95 });
  writeFileSync(join(__dirname, "public", "og-image.jpg"), screenshot);

  await browser.close();
  console.log("✅ og-image.jpg generated at public/og-image.jpg (1200x630 @2x)");
})();
