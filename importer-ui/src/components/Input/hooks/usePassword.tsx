import { useState } from "react";
import { inputTypes } from "../types";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

export default function usePassword() {
  const [show, setShow] = useState(false);

  return {
    type: (show ? "text" : "password") as inputTypes,
    iconAfter: (
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={0}>
        {show ? <FaEye /> : <FaEyeSlash />}
      </button>
    ),
    placeholder: show ? "A.#Kj8*/" : "••••••••",
  };
}
