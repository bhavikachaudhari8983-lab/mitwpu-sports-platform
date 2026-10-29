import type { ComponentType } from "react";
import type { WizardStepId } from "@/lib/constants";
import { IdentityStep } from "./identity-step";

export type StepProps = { onGoTo: (step: number) => void };

function ComingNext() {
  return <p className="text-muted">This section is being built.</p>;
}

export const STEP_COMPONENTS: Record<WizardStepId, ComponentType<StepProps>> = {
  identity: IdentityStep,
  selfie: ComingNext,
  personal: ComingNext,
  academic: ComingNext,
  sports: ComingNext,
  medical: ComingNext,
  review: ComingNext,
};
