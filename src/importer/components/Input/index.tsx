import { useRef, useState } from "react";
import { Portal } from "@chakra-ui/react";
import useClickOutside from "../../hooks/useClickOutside";
import useRect from "../../hooks/useRect";
import useWindowSize from "../../hooks/useWindowSize";
import classes from "../../utils/classes";
import { InputProps } from "./types";
import style from "./style/Input.module.scss";
import { PiCaretDown, PiInfo } from "react-icons/pi";

export default function Input({ as = "input", label, icon, iconAfter, error, options, className, variants = [], children, ...props }: InputProps) {
  const Element = as;

  const variantStyles = classes(variants.map((c: keyof typeof style) => style[c]));

  const containerClassName = classes([style.container, variantStyles, className]);

  const icon1 = icon && <span className={style.icon}>{icon}</span>;

  const icon2 = iconAfter ? (
    <span className={style.icon}>{iconAfter}</span>
  ) : (
    error && (
      <span className={style.icon}>
        <PiInfo />
      </span>
    )
  );

  const iconSelect = options && (
    <span className={classes([style.icon, style.dropdownIcon])}>
      <PiCaretDown />
    </span>
  );

  const selectElement = options && options && <Select options={options} {...props} />;

  const inputWrapper = (
    <div className={classes([style.inputWrapper, error && style.hasError])}>
      {icon1}
      {selectElement || <Element {...props} {...(options ? { type: "text" } : {})} />}
      {iconSelect}
      {icon2}
    </div>
  );

  return (
    <div className={containerClassName}>
      <label>
        {label ? <span className={style.label}>{label}</span> : null}
        {inputWrapper}
      </label>
      {error && <div className={style.error}>{error}</div>}
      {children && <div className={style.footer}>{children}</div>}
    </div>
  );
}

function Select({ options = {}, placeholder, ...props }: InputProps) {
  const [open, setOpen] = useState(false);

  const onChangeOption = (e: any) => {
    const { value } = e.target;
    props?.onChange && props?.onChange(value);
    e.stopPropagation();
    e.preventDefault();
    onBlur();
  };

  const selectedKey = Object.keys(options).find((k) => options[k].value === props.value) || "";

  const [setRef, size, updateRect] = useRect();
  const [setRefPortal, sizePortal, updatePortalRect] = useRect();
  const windowSize = useWindowSize();
  const top = size.y + sizePortal.height > windowSize[1] - 4 ? windowSize[1] - sizePortal.height - 4 : size.y + 4;

  const optionsPosition = {
    top: `${top}px`,
    left: `${size?.x}px`,
    width: `${size?.right - size?.left}px`,
  };

  const onFocus = () => {
    updateRect();
    updatePortalRect();
    setOpen(true);
  };

  const onBlur = () => {
    setOpen(false);
  };

  const ref = useRef(null);
  useClickOutside(ref, onBlur);

  return (
    <>
      <input
        {...props}
        value={selectedKey}
        className={classes([style.select, open && style.open])}
        readOnly
        onFocus={onFocus}
        placeholder={placeholder}
      />

      <div className={style.optionsRef} ref={setRef} />

      {open && (
        <div className={style.options} style={optionsPosition} ref={setRefPortal}>
          <div className={style.inner} ref={ref}>
            {placeholder && (
              <button key={-1} className={classes([style.option, style.placeholder])} onClick={onChangeOption}>
                {placeholder}
              </button>
            )}
            {Object.keys(options).map((k, i) => (
              <button
                key={k}
                className={classes([style.option, options[k].value === props.value && style.selected])}
                type="button"
                {...options[k]}
                onClick={onChangeOption}
                autoFocus={i === 0}>
                {k} {options[k].required && <span className={style.requiredMark}>*</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
