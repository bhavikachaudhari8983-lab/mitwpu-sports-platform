import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export const metadata: Metadata = { title: "Verify a certificate" };

async function go(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  redirect(code ? `/verify/${encodeURIComponent(code)}` : "/verify");
}

export default function VerifyForm() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div className="text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" aria-hidden />
        <h1 className="mt-2 text-fg">Verify a certificate</h1>
        <p className="mt-1 text-muted">Enter the code printed on the certificate, or scan its QR code.</p>
      </div>
      <Card>
        <CardBody>
          <form action={go} className="space-y-4">
            <Field id="code" label="Certificate code" hint="e.g. CERT-26-4F7K2Q" required>
              <Input id="code" name="code" required autoCapitalize="characters" className="font-mono uppercase" aria-describedby="code-hint" />
            </Field>
            <Button type="submit" className="w-full">
              Check certificate
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
