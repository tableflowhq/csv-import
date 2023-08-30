import { useEffect, useState } from "react";
import { Button, Errors, Input } from "@tableflow/ui-library";
import { ListManagerProps } from "./types";
import style from "./style/ListManager.module.scss";

const validateUrl = (url: string) => {
  return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url);
};

export default function ListManager({ formStyle, ...props }: ListManagerProps) {
  const { placeholder, required, icon, onChange, value: discardValue, ...inputProps } = props;

  const [newValue, setNewValue] = useState<string>("");

  const [list, setList] = useState<string[]>((discardValue as string[]) || []);

  const [error, setError] = useState<string | null>(null);

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
  };

  const removeItem = (text: string) => {
    setList((list) => list.filter((item) => item !== text));
  };

  useEffect(() => {
    onChange && onChange(list);
  }, [list]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addItem();
      }}>
      <div className={formStyle}>
        <Input {...facade} className={style.input} onChange={(e) => setNewValue(e.target.value.trim())} value={newValue} />

        <input {...inputProps} value={list} type="hidden" />

        <Button className={style.button} variants={["primary"]}>
          + Add Item
        </Button>
      </div>
      {error && <Errors error={error} />}
      {!!list?.length && (
        <div className={style.list}>
          {list.map((item) => (
            <div key={item} className={style.item}>
              <span>{item}</span>{" "}
              <Button type="button" icon="trash" variants={["tertiary"]} onClick={() => removeItem(item)} className={style.icon} />
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
