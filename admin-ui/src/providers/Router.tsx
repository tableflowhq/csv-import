import { BrowserRouter } from "react-router-dom";
import { RouterProps } from "./types";

export default function RouterProvider({ children }: RouterProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
