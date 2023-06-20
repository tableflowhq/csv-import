import { Link, useNavigate } from "react-router-dom";
import { Button, Dialog, Tableflow, ThemeToggle } from "@tableflowhq/ui-library";
import { DialogItem } from "@tableflowhq/ui-library/build/Dialog/types";
import checkIsEmailVerified from "../../utils/verification";
import MainMenu from "./components/MainMenu";
import style from "./style/TopBar.module.scss";
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { signOut } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function TopBar() {
  const sessionContext = useSessionContext() as any;
  const { doesSessionExist, invalidClaims } = sessionContext;
  const isEmailVerified = checkIsEmailVerified(doesSessionExist, invalidClaims);

  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    navigate("/");
  }

  const userMenu: DialogItem[] = [
    {
      children: "Log out",
      onClick: () => onLogout(),
      icon: "cross",
      iconPosition: "left",
    },
  ];
  if (doesSessionExist && isEmailVerified) {
    userMenu.unshift({
      children: "My profile",
      action: () => navigate("/profile"),
      icon: "userSimple",
      iconPosition: "left",
    });
  }

  return (
    <div className={style.topBar}>
      <div className="container">
        <Link to="/" className={style.logo}>
          <Tableflow color />
        </Link>

        {doesSessionExist === true && isEmailVerified && <MainMenu />}

        <div className={style.separator} />

        <ThemeToggle />

        {doesSessionExist === true && isEmailVerified && (
          <Button icon="gear" variants={["tertiary", "small"]} onClick={() => navigate("/settings")} className={style.settingsButton} />
        )}

        {doesSessionExist === true && <Dialog items={userMenu} icon="userSimple" variants={["tertiary", "small"]} className={style.profileButton} />}
      </div>
    </div>
  );
}
