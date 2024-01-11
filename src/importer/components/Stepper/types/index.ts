export type Step = {
  label: string;
  id?: string | number;
  disabled?: boolean;
};

export type StepperProps = {
  steps: Step[];
  current: number;
  setCurrent: (step: number) => void;
  step: Step;
  clickable?: boolean;
  skipHeader: boolean;
};
