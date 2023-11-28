import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import useLocalStorage from "../../hooks/useLocalStorage";
import { colors } from "../../settings/theme";
import classes from "../../utils/classes";
import Tag from "./components/Tag";
import { TagEditorProps } from "./types";
import style from "./style/TagEditor.module.scss";
import { PiWarning } from "react-icons/pi";

export default function TagEditor({
  placeholder = "",
  storageKey = "tag-editor_key",
  clearOnUnmount,
  validation,
  className,
  onUpdate,
  error,
  initialValue,
  clearNow,
  ...props
}: TagEditorProps) {
  const ref = useRef(null);

  const [tags, setTags] = useLocalStorage(storageKey, []);

  const [input, setInput] = useState("");

  const breakInput = (value: string) => {
    const parts = value.split(/[\s\t\n,]+/).filter((part) => part);

    if (parts.length) setTags((tags: string[]) => [...(tags || []), ...parts]);

    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;
    const { key } = e;

    if (key === "Enter") {
      e.stopPropagation();
      breakInput(value);
    }

    if (key === "Backspace" || key === "Delete") {
      if (!value) {
        removeTag(tags?.length - 1);
      }
    }
  };

  const onInputChange = (e: FormEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    if ([" ", ",", "\n"].some((str) => value?.indexOf(str) > -1)) {
      breakInput(value);
    } else {
      setInput(value);
    }
  };

  const removeTag = (id: number) => {
    setTags((tags: string[]) => tags.filter((tag, i) => id !== i));
  };

  const editTag = (id: number, tag: string) => {
    setTags(tags.map((t: string, i: number) => (i === id ? tag : t)));
  };

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        setTags([]);
      }
    };
  }, []);

  useEffect(() => {
    onUpdate && onUpdate(tags);
  }, [tags]);

  useEffect(() => {
    !tags.length && setTags(initialValue);
  }, [initialValue]);

  useEffect(() => {
    clearNow && setTags([]);
  }, [clearNow]);

  return (
    <>
      <div className={classes([style.container, className])} {...props}>
        <div className={style.backDrop} onClick={() => (ref?.current as any)?.focus()} />
        {tags?.map((text: string, i: number) => (
          <Tag key={text + i} {...{ text, removeTag, editTag, validation, id: i }} />
        ))}
        <input
          placeholder={placeholder}
          onChange={onInputChange}
          value={input}
          ref={ref}
          onFocus={(event) => event.target.select()}
          onKeyDownCapture={handleKeyPress}
        />
      </div>

      {error && (
        <div className={style.error}>
          <PiWarning color={colors.error} /> {error}
        </div>
      )}

      <div className={style.spacer} />
    </>
  );
}
