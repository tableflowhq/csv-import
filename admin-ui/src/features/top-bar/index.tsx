import { Link, useNavigate } from "react-router-dom";
import { Button, Dialog, Tableflow, ThemeToggle } from "@tableflowhq/ui-library";
import { DialogItem } from "@tableflowhq/ui-library/build/Dialog/types";
import MainMenu from "./components/MainMenu";
import { SessionContextUpdate } from "supertokens-auth-react/lib/build/recipe/session/types";
import style from "./style/TopBar.module.scss";
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { signOut } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function TopBar() {
  const { doesSessionExist } = useSessionContext() as SessionContextUpdate;

  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    navigate("/");
  }

  const userMenu: DialogItem[] = [
    {
      children: "My profile",
      action: () => navigate("/profile"),
      icon: "userSimple",
      iconPosition: "left",
    },
    {
      children: "Log out",
      onClick: () => onLogout(),
      icon: "cross",
      iconPosition: "left",
    },
  ];

  return (
    <div className={style.topBar}>
      <div className="container">
        <Link to="/" className={style.logo}>
          <Tableflow color />
        </Link>

        {doesSessionExist === true && <MainMenu />}

        <div className={style.separator} />

        <ThemeToggle />

        {doesSessionExist === true && (
          <Button icon="gear" variants={["tertiary", "small"]} onClick={() => navigate("/settings")} className={style.settingsButton} />
        )}

        {doesSessionExist === true && <Dialog items={userMenu} icon="userSimple" variants={["tertiary", "small"]} className={style.profileButton} />}
      </div>
    </div>
  );
}
