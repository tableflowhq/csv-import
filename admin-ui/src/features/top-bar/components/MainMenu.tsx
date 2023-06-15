import { Link, useLocation } from "react-router-dom";
import { Button } from "@tableflowhq/ui-library";
import { ButtonProps, buttonVariant } from "@tableflowhq/ui-library/build/Button/types";
import style from "../style/MainMenu.module.scss";

type menuItem = {
  link: string;
  label: string;
};

const menuItems: menuItem[] = [
  {
    link: "/importers",
    label: "Importers",
  },
  {
    link: "/data",
    label: "Data",
  },
  // {
  //   link: "/users",
  //   label: "Users",
  // },
];

export default function MainMenu() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className={style.menu}>
      {menuItems.map((item, i) => {
        const active = pathname.includes(item.link);
        return <MenuItem key={i} {...item} variants={[...(active ? ["secondary"] : ["bare"]), "small"] as buttonVariant[]} type="button" />;
      })}
    </div>
  );
}

function MenuItem({ link, label, ...buttonProps }: menuItem & ButtonProps) {
  return (
    <Link to={link}>
      <Button {...buttonProps} tabIndex={-1}>
        {label}
      </Button>
    </Link>
  );
}
