export interface Step {
  label: string;
  id: string;
}

export enum Steps {
  Upload = "upload",
  RowSelection = "row-selection",
  Review = "review",
  Complete = "complete",
}
