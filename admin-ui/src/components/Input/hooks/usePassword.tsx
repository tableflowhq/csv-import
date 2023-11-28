import { useState } from "react";
import { inputTypes } from "../types";
import { PiEyeBold, PiEyeSlash } from "react-icons/pi";

export default function usePassword() {
  const [show, setShow] = useState(false);

  return {
    type: (show ? "text" : "password") as inputTypes,
    iconAfter: (
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={0}>
        {show ? <PiEyeBold /> : <PiEyeSlash />}
      </button>
    ),
    placeholder: show ? "A.#Kj8*/" : "••••••••",
  };
}
