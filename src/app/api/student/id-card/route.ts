import { route, ok, ApiError } from "@/lib/api";
import { getSessionUser } from "@/lib/rbac";
import { getIdCardData, renderIdCardPdf } from "@/lib/id-card";

/** ?format=pdf → card PDF; otherwise JSON card data (used to draw the PNG in the browser). */
export const GET = route(async (req) => {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") throw new ApiError(401, "Please sign in.");
  const card = await getIdCardData(user.id);
  if (!card) throw new ApiError(404, "Your Sports ID is issued once your registration is approved.");
  const format = new URL(req.url).searchParams.get("format");
  if (format === "pdf") {
    const pdf = await renderIdCardPdf(card);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sports-id-${card.sportsId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return ok(card);
});
