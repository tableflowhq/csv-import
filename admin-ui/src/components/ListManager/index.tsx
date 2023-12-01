import { useEffect, useRef, useState } from "react";
import { ListManagerProps } from "./types";
import style from "./style/ListManager.module.scss";
import Button from "../Button";
import Errors from "../Errors";
import Input from "../Input";
import { PiTrash } from "react-icons/pi";

const validateUrl = (url: string) => {
  return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url);
};

const arraysEqual = (a: string[], b: string[]): boolean => {
  return a.length === b.length && a.every((val, index) => val === b[index]);
};

export default function ListManager({ formStyle, buttonText, ...props }: ListManagerProps) {
  const { placeholder, required, icon, onChange, value: discardValue, ...inputProps } = props;
  const [newValue, setNewValue] = useState<string>("");
  const [list, setList] = useState<string[]>((discardValue as string[]) || []);
  const [error, setError] = useState<string | null>(null);
  const userActionRef = useRef(false);

  useEffect(() => {
    // Check if discardValue is different from the current list
    if (Array.isArray(discardValue) && !arraysEqual(discardValue, list)) {
      setList(discardValue);
    }
  }, [discardValue]);

  const facade = { placeholder, required, icon };

  const addItem = () => {
    if (!newValue) setError("Please enter a URL");
    else if (list.includes(newValue)) setError("The URL already exists");
    else if (newValue.length > 255) setError("The URL is too long");
    else if (!validateUrl(newValue)) setError("Please enter a URL with the format: example.com");
    else {
      setError(null);
      setNewValue("");
      setList((list) => [...list, newValue]);
    }
    userActionRef.current = true;
  };

  const removeItem = (text: string) => {
    setList((list) => list.filter((item) => item !== text));
    userActionRef.current = true;
  };

  useEffect(() => {
    if (userActionRef.current) {
      onChange && onChange(list);
      userActionRef.current = false;
    }
  }, [list, onChange]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addItem();
      }}>
      <div className={formStyle}>
        <Input {...(facade as any)} className={style.input} onChange={(e) => setNewValue(e.target.value.trim())} value={newValue} />

        <input {...inputProps} value={list} type="hidden" />

        <Button className={style.button} variants={["primary"]}>
          {buttonText ?? "+ Add Item"}
        </Button>
      </div>
      {error && <Errors error={error} />}
      {!!list?.length && (
        <div className={style.list}>
          {list.map((item) => (
            <div key={item} className={style.item}>
              <span>{item}</span>{" "}
              <Button type="button" icon={<PiTrash />} variants={["tertiary"]} onClick={() => removeItem(item)} className={style.icon} />
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
