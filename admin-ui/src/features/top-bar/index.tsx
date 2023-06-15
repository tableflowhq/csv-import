import { Link, useNavigate } from "react-router-dom";
import { Button, Tableflow, ThemeToggle } from "@tableflowhq/ui-library";
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

  return (
    <div className={style.topBar}>
      <div className="container">
        <Link to="/" className={style.logo}>
          <Tableflow color />
        </Link>

        {doesSessionExist === true && <MainMenu />}

        <div className={style.separator} />

        {doesSessionExist === true && (
          <Button variants={["bare", "small"]} onClick={onLogout}>
            Log out
          </Button>
        )}

        <ThemeToggle />
      </div>
    </div>
  );
}
