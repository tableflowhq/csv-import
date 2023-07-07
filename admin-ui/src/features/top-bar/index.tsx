import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Dialog, Tableflow, ThemeToggle } from "@tableflow/ui-library";
import { DialogItem } from "@tableflow/ui-library/build/Dialog/types";
import { AuthContext } from "../../providers/Auth";
import MainMenu from "./components/MainMenu";
import style from "./style/TopBar.module.scss";

export default function TopBar() {
  const sessionContext = useContext(AuthContext);
  const { sessionExists, verified, showProfile, signOut } = sessionContext;

  const navigate = useNavigate();

  async function onLogout() {
    signOut && signOut();
  }

  const userMenu: DialogItem[] = [
    ...(sessionExists && verified
      ? [
          {
            children: "My profile",
            onClick: () => navigate("/profile"),
            icon: "userSimple",
            iconPosition: "left",
          } as DialogItem,
        ]
      : []),
    {
      children: "Log out",
      onClick: () => onLogout(),
      icon: "logOut",
      iconPosition: "left",
    },
  ];

  return (
    <div className={style.topBar}>
      <div className="container">
        <Link to="/" className={style.logo}>
          <Tableflow color />
        </Link>

        {sessionExists && verified && <MainMenu />}

        <div className={style.separator} />

        <ThemeToggle />

        {sessionExists && verified && (
          <Button icon="gear" variants={["tertiary", "small"]} onClick={() => navigate("/settings")} className={style.settingsButton} />
        )}

        {sessionExists && showProfile && (
          <Dialog items={userMenu} icon="userSimple" variants={["tertiary", "small"]} className={style.profileButton} />
        )}
      </div>
    </div>
  );
}
