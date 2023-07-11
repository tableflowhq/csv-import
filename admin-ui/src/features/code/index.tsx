import { useMemo } from "react";
import { Button, Input, useLocalStorage } from "@tableflow/ui-library";
import notification from "../../utils/notification";
import getCodeReact from "./utils/getCodeReact";
import getCodeVanilla from "./utils/getCodeVanilla";
import { CodeProps } from "./types";
import style from "./style/Code.module.scss";

export default function Code(props: CodeProps) {
  const [framework, setFramework] = useLocalStorage("frameworka", "react");

  const options = {
    React: { value: "react" },
    "Vanilla JS": { value: "vanilla" },
  };

  const code = useMemo(() => (framework === "react" ? getCodeReact(props) : getCodeVanilla(props)), [JSON.stringify(props), framework]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notification({ type: "success", message: "Copied to clipboard" });
  };

  return (
    <div className={style.container}>
      <Input
        label="Which project are you embedding the file uploader into?"
        options={options}
        value={framework}
        onChange={(v) => setFramework(v)}
        icon="code"
        className={style.dropdown}
      />

      <div className={style.top}>
        <p>Copy and paste the code below into your application:</p>
        <Button icon="copy" variants={["tertiary"]} onClick={() => copyToClipboard(code)}>
          Copy code
        </Button>
      </div>

      <textarea value={code} readOnly />
    </div>
  );
}
