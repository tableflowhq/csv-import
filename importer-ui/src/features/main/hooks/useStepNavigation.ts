import { useEffect, useState } from "react";

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

function useStepNavigation(initialStep: number, skipHeader: boolean) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const setStep = (newStep: number) => {
    setCurrentStep(newStep);
  };

  useEffect(() => {
    setCurrentStep((prevStep: number) => calculateCurrentStep(prevStep, skipHeader));
  }, [skipHeader]);

  return {
    currentStep,
    setStep,
  };
}

export default useStepNavigation;
