import { Spinner } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center">
      <Spinner />
    </div>
  );
}
