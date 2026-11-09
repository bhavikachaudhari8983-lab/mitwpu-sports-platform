// Every important admin / official / coach / medical button, with the demo data from `npm run db:seed`.
import { click, confirmDialog, go, hasText, newPage, noSidewaysScroll, path, staffLogin, suite, wait, waitPath, waitText } from "./helpers.mjs";

async function openStudent(page, name) {
  await go(page, `/admin?q=${encodeURIComponent(name)}#students`);
  await page.locator(`#students table a::-p-text(${name})`).click();
  await page.waitForFunction(() => location.pathname.startsWith("/admin/students/"));
  await waitText(page, "Audit history");
}
async function reasonDialog(page, buttonText, reason) {
  await click(page, "button", buttonText);
  await page.waitForSelector("dialog[open] textarea");
  await page.type("dialog[open] textarea", reason);
  await confirmDialog(page);
}

export async function adminSuite(browser) {
  const t = suite("admin");
  const a = await newPage(browser, 1280);
  await staffLogin(a, "admin", "/admin");

  // ---------- Dashboard ----------
  await t.step("Dashboard: banner, numbers, attention list, live & upcoming", a, async () => {
    for (const x of ["need", "Registrations", "Needs your attention", "Live & upcoming", "Recent medals", "Registration pipeline"]) await waitText(a, x);
  });
  await t.step("Dashboard: every attention item opens its page", a, async () => {
    const hrefs = await a.$$eval("section ~ div a[href], main ul a[href]", (as) => [...new Set(as.map((x) => x.getAttribute("href")))].filter((h) => h.startsWith("/")));
    for (const h of hrefs.slice(0, 15)) {
      await go(a, h);
      if (await hasText(a, "Access denied") || (await hasText(a, "could not be found"))) throw new Error(`${h} broken`);
    }
    return `${Math.min(15, hrefs.length)} links`;
  });
  await t.step("Students: search, status filter, sport → event filter, clear", a, async () => {
    await go(a, "/admin#students");
    await a.type("#students input[type=search]", "Aarav");
    await a.waitForFunction(() => location.search.includes("q=Aarav"));
    await waitText(a, "Aarav Kulkarni");
    const pick = async (placeholder, label) => {
      const sel = await a.evaluateHandle((p) => [...document.querySelectorAll("#students select")].find((s) => s.options[0]?.text.startsWith(p)), placeholder);
      const v = await sel.evaluate((s, l) => [...s.options].find((o) => o.text.startsWith(l))?.value, label);
      await sel.select(v);
    };
    await click(a, "button", "Clear filters");
    await a.waitForFunction(() => !location.search.includes("q="));
    await pick("All submitted", "Approved");
    await a.waitForFunction(() => location.search.includes("status=APPROVED"));
    await pick("All sports", "Football");
    await a.waitForFunction(() => location.search.includes("sport="));
    await wait(500);
    await pick("All events", "11-a-side — Men");
    await a.waitForFunction(() => location.search.includes("event="));
    await pick("All genders", "Male");
    await pick("All schools", "School of Computer Science");
    await a.waitForFunction(() => location.search.includes("school="));
    await wait(600);
    const rows = await a.$$eval("#students table tbody tr", (r) => r.length);
    await click(a, "button", "Clear filters");
    await a.waitForFunction(() => location.search === "" || location.search === "?");
    return `${rows} CS footballers`;
  });
  await t.step("Students: safe CSV export downloads; full export needs a reason", a, async () => {
    const href = await a.$eval('a[href^="/api/admin/export"]', (x) => x.getAttribute("href"));
    const r = await a.evaluate(async (h) => { const x = await fetch(h); return [x.status, (await x.text()).split("\n")[0]]; }, href);
    if (r[0] !== 200 || r[1].includes("DOB")) throw new Error(r.join(" "));
    await click(a, "button", "Full export…");
    await confirmDialog(a);
    await waitText(a, "Give a reason");
    await click(a, "dialog[open] button", "Cancel");
  });

  // ---------- Student record ----------
  await t.step("Student record: documents open in the viewer", a, async () => {
    await openStudent(a, "Aarav Kulkarni");
    await (await a.$$("button::-p-text(Medical fitness certificate), button::-p-text(Passport-size photo)"))[0].click();
    await a.waitForSelector("dialog[open]");
    await wait(500);
    await a.keyboard.press("Escape");
  });
  await t.step("Student record: flag needs a reason; flag, then resolve", a, async () => {
    await openStudent(a, "Kavya Iyer");
    await click(a, "button", "Flag");
    await confirmDialog(a);
    await waitText(a, "Give a reason");
    await a.type("dialog[open] textarea", "Guardian consent letter is unsigned (test).");
    await confirmDialog(a);
    await waitText(a, "Reason shown to student");
    await reasonDialog(a, "Resolve flag", "Signed consent received at the office (test).");
    await a.waitForFunction(() => !document.body.innerText.includes("Reason shown to student"));
  });
  await t.step("Student record: propose DOB correction → second admin approves", a, async () => {
    await openStudent(a, "Sneha");
    await click(a, "button", "Propose DOB correction");
    await a.waitForSelector("#newDob");
    await a.$eval("#newDob", (e) => (e.value = ""));
    await a.type("#newDob", "05052004");
    await a.type("dialog[open] textarea", "Birth certificate checked at office (test).");
    await confirmDialog(a);
    await waitText(a, "DOB correction waiting for a second admin");
    const studentUrl = a.url();
    const b = await newPage(browser);
    await staffLogin(b, "admin2", "/admin");
    await b.goto(studentUrl, { waitUntil: "load" });
    await reasonDialog(b, "Approve correction", "Checked independently (test).");
    await waitText(b, "DOB corrected");
    await b.browserContext().close();
  });
  await t.step("Student record: confirm an outside college", a, async () => {
    await go(a, "/admin?type=OUTSIDE_INDIAN&status=PENDING#students");
    await a.locator("#students table tbody a").click();
    await a.waitForFunction(() => location.pathname.startsWith("/admin/students/"));
    await click(a, "button", "Confirm college");
    await confirmDialog(a);
    await waitText(a, "Saved");
  });
  await t.step("Ready to approve: bulk approve", a, async () => {
    await go(a, "/admin/ready");
    if (await hasText(a, "Nothing waiting")) return "nothing waiting";
    await click(a, "label", "Select all");
    await (await a.$$("button::-p-text(selected)"))[0].click();
    await confirmDialog(a);
    await waitText(a, "Approved");
  });

  // ---------- Desk & scanner (official tools, as admin) ----------
  await t.step("Desk: search, measure, verify a pending athlete", a, async () => {
    await go(a, "/desk?q=Kavya");
    await a.locator("main a::-p-text(Kavya)").click();
    await a.waitForSelector("#heightCm");
    await a.type("#heightCm", "158");
    await a.type("#weightKg", "49.5");
    await click(a, "form button[type=submit]", "Save");
    await waitText(a, "158 cm");
    await wait(1200); // let the page finish refreshing before the next click
    await a.waitForFunction(() => ![...document.querySelectorAll("button")].find((b) => b.innerText.includes("Mark as verified"))?.disabled);
    await click(a, "button", "Mark as verified");
    await confirmDialog(a);
    await waitText(a, "Verified");
  });
  await t.step("Scanner: manual Sports ID → VALID; fake → INVALID", a, async () => {
    const sid = await a.evaluate(async () => {
      const r = await fetch("/api/admin/export");
      const line = (await r.text()).split("\n").find((l) => l.includes("Aarav Kulkarni"));
      return line?.split(",")[0].replace(/"/g, "");
    });
    await go(a, "/scan");
    await a.type('input[placeholder="SS-26-XXXXXX"]', sid);
    await click(a, "button", "Check");
    await waitText(a, "VALID");
    await click(a, "button", "Scan next");
    await a.type('input[placeholder="SS-26-XXXXXX"]', "SS-26-FAKE00");
    await click(a, "button", "Check");
    await waitText(a, "INVALID");
    return sid;
  });

  // ---------- Sports, competition, announcements ----------
  await t.step("Sports & events: a count opens the filtered list; entry sheet prints", a, async () => {
    await go(a, "/admin/sports");
    await a.locator("a::-p-text(athletes)").click();
    await a.waitForFunction(() => location.pathname === "/admin" && location.search.includes("sport="));
    await go(a, "/admin/sports");
    await click(a, "a", "Entry sheet");
    await a.waitForFunction(() => location.pathname.endsWith("/sheet"));
    await a.evaluate(() => (window.print = () => (window.__printed = true)));
    await click(a, "button", "Print");
    await a.waitForFunction(() => window.__printed === true);
  });
  await t.step("Competition: save a format for an event", a, async () => {
    await go(a, "/admin/competition");
    await a.locator("a::-p-text(Rapid — Open)").click();
    await a.waitForSelector("#fmt");
    await a.select("#fmt", "KNOCKOUT");
    await click(a, "button", "Save format");
    await waitText(a, "Format saved");
  });
  await t.step("Announcements: validation, then send to one event", a, async () => {
    await go(a, "/admin/announcements");
    await click(a, "button", "Send announcement");
    await a.waitForSelector("#an-title[aria-invalid=true]");
    await a.type("#an-title", "Kit check at 9 am");
    await a.type("#an-body", "Bring your registered jersey.");
    await a.select("#an-aud", "EVENT");
    await a.waitForSelector("#an-ev");
    const v = await a.$eval("#an-ev", (s) => s.options[1].value);
    await a.select("#an-ev", v);
    await click(a, "button", "Send announcement");
    await waitText(a, "Announcement sent");
  });
  await t.step("Audit log: search and action filter", a, async () => {
    await go(a, "/admin/audit");
    await a.type('input[name="q"]', "Asha");
    await a.keyboard.press("Enter");
    await a.waitForFunction(() => location.search.includes("q=Asha"));
    await a.select('select[name="action"]', "LOGIN");
    await click(a, "form button", "Search");
    await a.waitForFunction(() => location.search.includes("action=LOGIN"));
    await click(a, "a", "Clear");
    await a.waitForFunction(() => !location.search.includes("action="));
  });

  // ---------- Settings ----------
  await t.step("Settings: save general settings", a, async () => {
    await go(a, "/admin/settings");
    await a.waitForSelector("#meetName");
    await click(a, "button", "Save settings");
    await waitText(a, "saved");
  });
  await t.step("Settings: age category, sport on/off, event limits", a, async () => {
    await (await a.$$("#age button"))[0].click();
    await waitText(a, "updated");
    const first = async () => (await a.$$("#sports details"))[0]; // re-query: the list re-renders after each save
    await (await first()).evaluate((d) => (d.open = true));
    await (await (await first()).$("::-p-text(Disable sport)")).click();
    await waitText(a, "disabled");
    await wait(1000);
    await (await (await first()).$("::-p-text(Enable sport)")).click();
    await waitText(a, "enabled");
    await wait(1000);
    await (await first()).evaluate((d) => (d.open = true));
    await (await (await first()).$("::-p-text(Save)")).click();
    await waitText(a, "Event limits saved");
  });
  await t.step("Settings: add staff user, reset a password", a, async () => {
    await a.type("#st-name", "Test Official");
    await a.type("#st-email", `test.official.${Date.now()}@sportssphere.example`);
    await a.select("#st-role", "OFFICIAL");
    await a.type("#st-password", "Official@99999");
    await click(a, "button", "Create account");
    await waitText(a, "Test Official");
    await (await a.$$("button::-p-text(Reset password)"))[0].click();
    await a.waitForSelector("#reset-pw");
    await confirmDialog(a);
    await a.waitForSelector("#reset-pw[aria-invalid=true]").catch(async () => waitText(a, "10+ characters"));
    await click(a, "dialog[open] button", "Cancel");
  });

  // ---------- Layout ----------
  await t.step("Sidebar: collapse and expand", a, async () => {
    await go(a, "/admin");
    await a.click('button[aria-label="Collapse sidebar"]');
    await a.waitForSelector('button[aria-label="Expand sidebar"]');
    await a.click('button[aria-label="Expand sidebar"]');
  });
  await t.step("Every sidebar link opens", a, async () => {
    const hrefs = await a.$$eval("aside nav a", (as) => as.map((x) => x.getAttribute("href")));
    for (const h of hrefs) {
      await go(a, h);
      if (await hasText(a, "Access denied")) throw new Error(`${h} denied`);
    }
    return `${hrefs.length} links`;
  });
  const m = await newPage(browser, 390);
  await staffLogin(m, "admin", "/admin");
  await t.step("[phone] menu drawer opens, navigates and closes", m, async () => {
    await m.click('button[aria-label="Open navigation"]');
    await m.waitForSelector("#staff-drawer");
    await click(m, "#staff-drawer a", "Competition");
    await waitPath(m, "/admin/competition");
    if (await m.$("#staff-drawer")) throw new Error("drawer stayed open after navigating");
  });
  for (const p of ["/admin", "/admin/students", "/admin/settings", "/desk", "/admin/audit"]) {
    await t.step(`[phone] ${p} fits without sideways scroll`, m, async () => {
      await go(m, p);
      await wait(300);
      if (!(await noSidewaysScroll(m))) throw new Error(`${await m.evaluate(() => document.documentElement.scrollWidth)}px wide`);
    });
  }

  // ---------- Other staff roles ----------
  const c = await newPage(browser);
  await staffLogin(c, "coach", "/coach");
  await t.step("Coach: players, notices, age-concern form validates", c, async () => {
    await waitText(c, "My players");
    await click(c, "button", "Report an age concern");
    await confirmDialog(c);
    await c.waitForSelector("#concern-sid[aria-invalid=true]");
    await click(c, "dialog[open] button", "Cancel");
  });
  const md = await newPage(browser);
  await staffLogin(md, "medical", "/medical");
  await t.step("Medical: sees certificates and can open one", md, async () => {
    await waitText(md, "Medical");
    const b = await md.$("main button");
    if (b) {
      await b.click();
      await md.waitForSelector("dialog[open]").catch(() => {});
    }
  });

  void path;
  const errs = [a, m, c, md].flatMap((x) => x.jsErrors);
  t.results.push({ ok: errs.length === 0, label: "No JavaScript errors during staff tests", note: errs.join(" | ") });
  return t.results;
}
