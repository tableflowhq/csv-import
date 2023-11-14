import { useEffect, useState } from "react";
import useStepper from "../../../components/Stepper/hooks/useStepper";
import { Steps } from "../types";
import useModifiedSteps from "./useModifiedSteps";
import useMutableLocalStorage from "./useMutableLocalStorage";

export const StepEnum = {
  Upload: 0,
  RowSelection: 1,
  MapColumns: 2,
  Review: 3,
};

const calculateCurrentStep = (currentStep: number, skipHeader: boolean) => {
  if (skipHeader) {
    switch (currentStep) {
      case StepEnum.Upload:
      case StepEnum.RowSelection:
        return StepEnum.MapColumns;
      case StepEnum.MapColumns:
        return StepEnum.Review;
      default:
        return currentStep;
    }
  } else {
    switch (currentStep) {
      case StepEnum.Upload:
        return StepEnum.RowSelection;
      case StepEnum.RowSelection:
        return StepEnum.MapColumns;
      case StepEnum.MapColumns:
        return StepEnum.Review;
      default:
        return currentStep;
    }
  }
};

export const stepsConfig = [
  { label: "Upload", id: Steps.Upload },
  { label: "Select Header", id: Steps.RowSelection },
  { label: "Map Columns", id: Steps.MapColumns },
  { label: "Review", id: Steps.Review },
];

function useStepNavigation(initialStep: number, skipHeader: boolean, importerId: string) {
  const steps = useModifiedSteps(stepsConfig, skipHeader);
  const stepper = useStepper(steps, 0);
  const [storageStep, setStorageStep] = useMutableLocalStorage(`tf_steps_${importerId}`, "");
  const [currentStep, setCurrentStep] = useState(initialStep);

  const setStep = (newStep: number) => {
    setCurrentStep(newStep);
    setStorageStep(newStep);
  };

  useEffect(() => {
    setCurrentStep((prevStep: number) => calculateCurrentStep(prevStep, skipHeader));
  }, [skipHeader]);

  return {
    currentStep: storageStep ? parseInt(storageStep) : currentStep,
    setStep,
    stepper,
    setStorageStep,
    storageStep,
  };
}

export default useStepNavigation;
