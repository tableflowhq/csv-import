import { ReactPortal, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PortalProps } from "./types";

export default function Portal({ children, className = "root-portal", el = "div" }: PortalProps): ReactPortal {
  const [container] = useState(() => {
    // This will be executed only on the initial render
    // https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
    return document.createElement(el);
  });

  useEffect(() => {
    container.classList.add(className);
    container.setAttribute("role", "complementary");
    container.setAttribute("aria-label", "Notifications");
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  return createPortal(children, container);
}
