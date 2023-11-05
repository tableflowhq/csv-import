import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../Icon";
import useClickOutside from "../../../hooks/useClickOutside";
import classes from "../../../utils/classes";
import { TagProps } from "../types";
import style from "../style/TagEditor.module.scss";

export default function Tag({ text, id, removeTag, editTag, validation }: TagProps) {
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(false);

  const [prevMemoText, setPrevMemoText] = useState(text);
  const memoText = useMemo(() => {
    return !selected ? (setPrevMemoText(text), text) : prevMemoText;
  }, [text, selected, prevMemoText]);

  useEffect(() => {
    validation && setError(validation(text));
  }, [text]);

  const setIsSelected = () => {
    setSelected(true);
  };

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.textContent;

    editTag(id, value || "");
  };

  const ref = useRef(null);

  useClickOutside(ref, () => setSelected(false));

  return (
    <div className={classes([style.tag, error && style.hasError])} tabIndex={0} title={error} onFocus={setIsSelected} ref={ref}>
      {selected ? (
        <span contentEditable autoFocus onInput={onChange} className={style.input} suppressContentEditableWarning={true}>
          {memoText}
        </span>
      ) : (
        memoText
      )}
      {error && <Icon icon="error" />}
      <button type="button" onClick={() => removeTag(id)}>
        <Icon icon="cross" />
      </button>
    </div>
  );
}
