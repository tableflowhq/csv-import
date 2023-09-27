export interface Step {
  label: string;
  id: string;
}

export enum Steps {
  Upload = "upload",
  RowSelection = "row-selection",
  MapColumns = "map-columns",
  Review = "review",
}
