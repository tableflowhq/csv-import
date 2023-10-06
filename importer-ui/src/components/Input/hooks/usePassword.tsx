import { useState } from "react";
import Icon from "../../Icon";
import { inputTypes } from "../types";

export default function usePassword() {
  const [show, setShow] = useState(false);

  return {
    type: (show ? "text" : "password") as inputTypes,
    iconAfter: (
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={0}>
        <Icon icon={show ? "eyesOpen" : "eyesClosed"} />
      </button>
    ),
    placeholder: show ? "A.#Kj8*/" : "••••••••",
  };
}
