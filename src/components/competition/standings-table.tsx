import type { StandingRow } from "@/lib/competition";

export function StandingsTable({ rows, caption }: { rows: StandingRow[]; caption: string }) {
  if (!rows.length) return <p className="text-muted">No table yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-small">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border text-muted">
          <tr>
            <th scope="col" className="py-2 pr-2 font-medium">#</th>
            <th scope="col" className="py-2 pr-2 font-medium">Team / athlete</th>
            {["P", "W", "D", "L", "+/−"].map((h) => (
              <th key={h} scope="col" className="px-1 py-2 text-center font-medium">
                <abbr title={{ P: "Played", W: "Won", D: "Drawn", L: "Lost", "+/−": "Scored minus conceded" }[h]} className="no-underline">
                  {h}
                </abbr>
              </th>
            ))}
            <th scope="col" className="py-2 pl-1 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className="border-b border-border last:border-0">
              <td className="py-2 pr-2 font-mono tabular text-muted">{i + 1}</td>
              <td className="py-2 pr-2">
                <span className="block font-medium">{r.name}</span>
                <span className="block text-muted">{r.institution}</span>
              </td>
              {[r.p, r.w, r.d, r.l].map((n, j) => (
                <td key={j} className="px-1 py-2 text-center font-mono tabular">
                  {n}
                </td>
              ))}
              <td className="px-1 py-2 text-center font-mono tabular">{r.f - r.a > 0 ? `+${r.f - r.a}` : r.f - r.a}</td>
              <td className="py-2 pl-1 text-center font-mono font-semibold tabular">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
