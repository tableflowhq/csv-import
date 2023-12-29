import { useMemo } from "react";
import { Step } from "../types";

export default function useModifiedSteps(allSteps: Step[], skipHeaderRowSelection: boolean): Step[] {
  return useMemo(() => {
    return skipHeaderRowSelection ? allSteps.filter((step) => step.id !== "row-selection") : allSteps;
  }, [allSteps, skipHeaderRowSelection]);
}
