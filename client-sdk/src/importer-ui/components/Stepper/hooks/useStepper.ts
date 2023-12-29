import { useMemo, useState } from "react";
import { Step, StepperProps } from "../types";

export default function useStepper(steps: Step[], initialStep = 0, skipHeader: boolean): StepperProps {
  const [current, setCurrent] = useState(initialStep);

  const step = useMemo(() => steps[current], [current, steps]);

  return { steps, current, step, setCurrent, skipHeader };
}
