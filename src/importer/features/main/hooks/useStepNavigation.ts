import { useEffect, useState } from "react";
import useStepper from "../../../components/Stepper/hooks/useStepper";
import { Steps } from "../types";
import useMutableLocalStorage from "./useMutableLocalStorage";

export const StepEnum = {
  Upload: 0,
  RowSelection: 1,
  MapColumns: 2,
  Complete: 3,
};

const calculateNextStep = (nextStep: number, skipHeader: boolean) => {
  if (skipHeader) {
    switch (nextStep) {
      case StepEnum.Upload:
      case StepEnum.RowSelection:
        return StepEnum.MapColumns;
      case StepEnum.MapColumns:
        return StepEnum.Complete;
      default:
        return nextStep;
    }
  }
  return nextStep;
};

const getStepConfig = (skipHeader: boolean) => {
  return [
    { label: "Upload", id: Steps.Upload },
    { label: "Select Header", id: Steps.RowSelection, disabled: skipHeader },
    { label: "Map Columns", id: Steps.MapColumns },
  ];
};

function useStepNavigation(initialStep: number, skipHeader: boolean) {
  const stepper = useStepper(getStepConfig(skipHeader), StepEnum.Upload, skipHeader);
  const [storageStep, setStorageStep] = useMutableLocalStorage(`tf_steps`, "");
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goBack = (backStep = 0) => {
    backStep = backStep || currentStep - 1 || 0;
    setStep(backStep);
  };

  const goNext = (nextStep = 0) => {
    nextStep = nextStep || currentStep + 1 || 0;
    const calculatedStep = calculateNextStep(nextStep, skipHeader);
    setStep(calculatedStep);
  };

  const setStep = (newStep: number) => {
    setCurrentStep(newStep);
    setStorageStep(newStep);
    stepper.setCurrent(newStep);
  };

  useEffect(() => {
    stepper.setCurrent(storageStep || 0);
    setCurrentStep(storageStep || 0);
  }, [storageStep]);

  return {
    currentStep: storageStep || currentStep,
    setStep,
    goBack,
    goNext,
    stepper,
    stepId: stepper?.step?.id,
    setStorageStep,
  };
}

export default useStepNavigation;
