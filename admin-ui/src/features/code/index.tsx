import { useMemo } from "react";
import { Button, Input, useLocalStorage } from "@tableflow/ui-library";
import notification from "../../utils/notification";
import getCodeReact from "./utils/getCodeReact";
import getCodeJavaScript from "./utils/getCodeJavaScript";
import { CodeProps } from "./types";
import style from "./style/Code.module.scss";

export default function Code(props: CodeProps) {
  const [framework, setFramework] = useLocalStorage("frameworka", "react");

  const options = {
    React: { value: "react" },
    "JavaScript": { value: "javascript" },
  };

  const code = useMemo(() => (framework === "react" ? getCodeReact(props) : getCodeJavaScript(props)), [JSON.stringify(props), framework]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notification({ type: "success", message: "Copied to clipboard" });
  };

  return (
    <div className={style.container}>
      <Input
        label="Select a frontend framework:"
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
