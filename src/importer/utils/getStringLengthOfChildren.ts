import { isValidElement } from "react";

export default function getStringLengthOfChildren(children: React.ReactNode): number {
  if (typeof children === "string") return children.length;

  if (Array.isArray(children)) return children.reduce((sum, child) => sum + getStringLengthOfChildren(child), 0);

  // If child is a React element, process its children recursively
  if (isValidElement(children)) return getStringLengthOfChildren(children.props.children);

  // If none of the above, return 0
  return 0;
}
