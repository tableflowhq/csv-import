export type Step = {
  label: string;
  id?: string | number;
};

export type StepperProps = {
  steps: Step[];
  current: number;
  setCurrent: (step: number) => void;
  step: Step;
  clickable?: boolean;
};
