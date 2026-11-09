// Browser tests. Start the app first (any port), reseed, then:
//   npm run db:seed && BASE=http://localhost:3000 npm run test:e2e
// Pass suite names to run only some: npm run test:e2e -- signin student
import { launch, report } from "./helpers.mjs";
import { signinSuite } from "./signin.mjs";
import { studentSuite } from "./student.mjs";
import { adminSuite } from "./admin.mjs";

const SUITES = { signin: signinSuite, student: studentSuite, admin: adminSuite };
const pick = process.argv.slice(2).filter((a) => a in SUITES);
const browser = await launch();
const all = [];
for (const name of pick.length ? pick : Object.keys(SUITES)) {
  try {
    all.push([name, await SUITES[name](browser)]);
  } catch (e) {
    all.push([name, [{ ok: false, label: "suite crashed", note: String(e?.message ?? e).split("\n")[0] }]]);
  }
}
await browser.close();
process.exitCode = report(all) ? 1 : 0;
