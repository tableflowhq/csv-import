// IMPORTING CSS
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import LayoutWelcome from "./pages/LayoutWelcome";
import "./styles/style.css";

// IMPORTING ROUTER AND SWITCH
import { Redirect, Route, Switch } from "react-router-dom";
import { useEffect, useState } from "react";
import LayoutAction from "./pages/LayoutAction";
import LayoutActionTable from "./pages/LayoutActionTable";
import LoadingOverlay from "react-loading-overlay";
import ConnectDatabase from "./pages/ConnectDatabase";
import LayoutSettings from "./pages/LayoutSettings";
import LayoutAuditTable from "./pages/LayoutAuditTable";
import NotFound from "./pages/NotFound";

// import the health check component, serivng as a protection guard to ensure BE uptime
import CheckBEHealth from "./util/HealthCheck";

function App() {
  const [mode, setMode] = useState(1);
  const [loading, setLoading] = useState(false);

  let localMode = localStorage.getItem("modeLocal");

  useEffect(() => {
    if (!localMode) {
      localStorage.setItem("modeLocal", "1");
      setMode(1);
    }
    if (!localMode) {
      document.body.style.background = "#f5f6f8";
    } else if (localMode === "1") {
      document.body.style.background = "#f5f6f8";
    } else if (localMode && localMode === "2") {
      document.body.style.background = "#212121";
    }
  }, [localMode, mode]);

  return (
    <div
      className={`${
        (!localMode && "light") || (localMode === "1" && "light") || "dark"
      }`}
    >
      <LoadingOverlay
        active={loading}
        // spinner={<BounceLoader />}
        spinner={true}
        text="Loading..."
      >
        <Switch>
          <Route exact path="/" component={LayoutActionTable} />
          <Route exact path="/audit" component={LayoutAuditTable} />
          <Route exact path="/welcome">
            {/* CheckBEHealth to ensure uptime before routing, pass in the component as props */}
            <CheckBEHealth>
              <LayoutWelcome setLoading={setLoading} />
            </CheckBEHealth>
          </Route>
          <Route exact path="/connect-database">
            <CheckBEHealth>
              <ConnectDatabase setLoading={setLoading} />
            </CheckBEHealth>
          </Route>
          <Route exact path="/settings">
            <LayoutSettings
              localMode={localMode}
              mode={mode}
              setMode={setMode}
            />
          </Route>
          <Route exact path="/create-action">
            <CheckBEHealth>
              <LayoutAction
                localMode={localMode}
                setLoading={setLoading}
                type="Create"
              />
            </CheckBEHealth>
          </Route>
          <Route exact path="/edit-action">
            <CheckBEHealth>
              <LayoutAction
                localMode={localMode}
                setLoading={setLoading}
                type="Edit"
              />
            </CheckBEHealth>
          </Route>
          <Route path="/404" component={NotFound} />
          <Redirect to="/404" />
        </Switch>
      </LoadingOverlay>
    </div>
  );
}

export default App;
