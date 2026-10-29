import { Card, CardBody, CardHeader } from "@/components/ui/card";

type Row = { label: string; value: number; secondary?: { label: string; value: number } };

/**
 * Single-series horizontal bar chart in plain HTML: one validated hue (--chart-1),
 * value labels on every bar (few bars), hover/focus tooltip, and a table view.
 */
export function BarChart({ title, description, rows, unit = "students" }: { title: string; description?: string; rows: Row[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const tableId = title.replace(/\W+/g, "-").toLowerCase();
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {rows.every((r) => r.value === 0) ? (
          <p className="text-muted">No data for the current filters.</p>
        ) : (
          <ul className="space-y-2" aria-describedby={`${tableId}-table`}>
            {rows.map((r) => (
              <li key={r.label} className="group grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3">
                <span className="truncate text-small text-fg" title={r.label}>
                  {r.label}
                </span>
                <span className="relative h-5 rounded-r-[4px] bg-chart-track/60" tabIndex={0} aria-label={`${r.label}: ${r.value} ${unit}${r.secondary ? `, ${r.secondary.value} ${r.secondary.label}` : ""}`}>
                  <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-chart-1 transition-[width]" style={{ width: `${(r.value / max) * 100}%` }} />
                  <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden rounded-md border border-border bg-surface px-2 py-1 text-small whitespace-nowrap text-fg shadow-lg group-hover:block group-focus-within:block">
                    <strong>{r.label}</strong>: {r.value} {unit}
                    {r.secondary && ` · ${r.secondary.value} ${r.secondary.label}`}
                  </span>
                </span>
                <span className="w-8 text-right font-mono text-small text-fg tabular">{r.value}</span>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer content-center text-small font-medium text-muted">View as table</summary>
          <table id={`${tableId}-table`} className="mt-2 w-full text-small">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-medium">Name</th>
                <th className="py-1 text-right font-medium">Total</th>
                {rows[0]?.secondary && <th className="py-1 text-right font-medium">{rows[0].secondary.label}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-1">{r.label}</td>
                  <td className="py-1 text-right font-mono tabular">{r.value}</td>
                  {r.secondary && <td className="py-1 text-right font-mono tabular">{r.secondary.value}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardBody>
    </Card>
  );
}
