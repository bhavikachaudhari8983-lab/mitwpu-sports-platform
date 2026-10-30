import { PageSkeleton } from "@/components/ui/feedback";

// Scoped to this page only: a group-level loading.tsx made same-page ?filter navigations hang (Next 15.5).
export default function Loading() {
  return <PageSkeleton />;
}
