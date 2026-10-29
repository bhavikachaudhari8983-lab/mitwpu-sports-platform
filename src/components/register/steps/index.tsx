import type { ComponentType } from "react";
import type { WizardStepId } from "@/lib/constants";
import { IdentityStep } from "./identity-step";
import { SelfieStep } from "./selfie-step";
import { PersonalStep } from "./personal-step";
import { AcademicStep } from "./academic-step";
import { SportsStep } from "./sports-step";
import { MedicalStep } from "./medical-step";
import { ReviewStep } from "./review-step";

export type StepProps = { onGoTo: (step: number) => void };

export const STEP_COMPONENTS: Record<WizardStepId, ComponentType<StepProps>> = {
  identity: IdentityStep,
  selfie: SelfieStep,
  personal: PersonalStep,
  academic: AcademicStep,
  sports: SportsStep,
  medical: MedicalStep,
  review: ReviewStep,
};
