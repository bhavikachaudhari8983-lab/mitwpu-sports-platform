import type { TallyRow } from "@/lib/competition";

/** Gold / silver / bronze by institution. Medal colour is never the only cue: each column is labelled. */
export function MedalTable({ rows }: { rows: TallyRow[] }) {
  if (!rows.length) return <p className="text-muted">No medals yet. They appear once an event&apos;s results are finalised.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-small">
        <caption className="sr-only">Medal tally by institution</caption>
        <thead className="border-b border-border text-muted">
          <tr>
            <th scope="col" className="py-2 pr-2 font-medium">#</th>
            <th scope="col" className="py-2 pr-2 font-medium">Institution</th>
            <th scope="col" className="px-1 py-2 text-center font-medium"><span className="mx-auto block size-3 rounded-full bg-[#C9A227]" aria-hidden /> <span className="sr-only">Gold</span><span aria-hidden>G</span></th>
            <th scope="col" className="px-1 py-2 text-center font-medium"><span className="mx-auto block size-3 rounded-full bg-[#9AA3AE]" aria-hidden /> <span className="sr-only">Silver</span><span aria-hidden>S</span></th>
            <th scope="col" className="px-1 py-2 text-center font-medium"><span className="mx-auto block size-3 rounded-full bg-[#B0703A]" aria-hidden /> <span className="sr-only">Bronze</span><span aria-hidden>B</span></th>
            <th scope="col" className="py-2 pl-1 text-center font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.institution} className={i === 0 && r.gold > 0 ? "border-b border-border bg-volt/15 last:border-0" : "border-b border-border last:border-0"}>
              <td className="py-2 pr-2">
                {i < 3 && r.total > 0 ? (
                  <span className="grid size-6 place-items-center rounded-full font-mono text-xs font-bold text-[#0e1430] tabular" style={{ background: ["#E8C547", "#C5CCD4", "#D49A6A"][i] }}>
                    {i + 1}
                  </span>
                ) : (
                  <span className="block w-6 text-center font-mono tabular text-muted">{i + 1}</span>
                )}
              </td>
              <td className={i === 0 && r.gold > 0 ? "py-2 pr-2 font-bold break-words" : "py-2 pr-2 font-medium break-words"}>{r.institution}</td>
              <td className="px-1 py-2 text-center font-mono tabular">{r.gold}</td>
              <td className="px-1 py-2 text-center font-mono tabular">{r.silver}</td>
              <td className="px-1 py-2 text-center font-mono tabular">{r.bronze}</td>
              <td className="py-2 pl-1 text-center font-mono font-semibold tabular">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
