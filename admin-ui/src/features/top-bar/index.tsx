import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Dialog from "../../components/Dialog";
import { DialogItem } from "../../components/Dialog/types";
import Tableflow from "../../components/Tableflow";
import ThemeToggle from "../../components/ThemeToggle";
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
            children: "Docs",
            onClick: () => window.open("https://tableflow.com/docs", "_blank"),
            icon: "help",
            iconPosition: "left",
          } as DialogItem,
        ]
      : []),
    ...(sessionExists && verified
      ? [
          {
            children: "Settings",
            onClick: () => navigate("/settings"),
            icon: "gear",
            iconPosition: "left",
          } as DialogItem,
        ]
      : []),
    // ...(sessionExists && showProfile
    //   ? [
    //       {
    //         children: "Billing",
    //         onClick: () => navigate("/billing"),
    //         icon: "database",
    //         iconPosition: "left",
    //       } as DialogItem,
    //     ]
    //   : []),
    ...(sessionExists && showProfile
      ? [
          {
            children: "Log out",
            onClick: () => onLogout(),
            icon: "logOut",
            iconPosition: "left",
          } as DialogItem,
        ]
      : []),
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

        {sessionExists && verified && <Dialog items={userMenu} icon="userSimple" variants={["tertiary", "small"]} className={style.profileButton} />}
      </div>
    </div>
  );
}
