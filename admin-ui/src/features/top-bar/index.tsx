import {Link, useNavigate} from "react-router-dom";
import {Button, Tableflow, ThemeToggle} from "@tableflowhq/ui-library";
import checkIsEmailVerified from "../../utils/verification";
import MainMenu from "./components/MainMenu";
import style from "./style/TopBar.module.scss";
import {useSessionContext} from "supertokens-auth-react/recipe/session";
import {signOut} from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function TopBar() {
  const sessionContext = useSessionContext() as any;
  const {doesSessionExist, invalidClaims} = sessionContext;
  const isEmailVerified = checkIsEmailVerified(doesSessionExist, invalidClaims);

  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <div className={style.topBar}>
      <div className="container">
        <Link to="/" className={style.logo}>
          <Tableflow color/>
        </Link>

        {doesSessionExist === true && isEmailVerified && <MainMenu/>}

        <div className={style.separator}/>

        {doesSessionExist === true && (
          <Button variants={["bare", "small"]} onClick={onLogout}>
            Log out
          </Button>
        )}

        <ThemeToggle/>
      </div>
    </div>
  );
}
