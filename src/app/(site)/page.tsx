import { ButtonLink } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="hero-pattern text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h1>Register. Verify. Play.</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/register" size="lg">Register now</ButtonLink>
          <ButtonLink href="/status" size="lg" variant="outline">Check status</ButtonLink>
        </div>
      </div>
    </section>
  );
}
