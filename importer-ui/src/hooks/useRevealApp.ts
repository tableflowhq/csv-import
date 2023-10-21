import { useEffect } from "react";

document.getElementsByTagName("html")[0].style.display = "none";

export default function useRevealApp() {
  useEffect(() => {
    document.getElementsByTagName("html")[0].style.display = "block";
  }, []);
}
