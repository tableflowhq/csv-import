import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {BrowserRouter as Route} from "react-router-dom";

ReactDOM.render(
  <Route>
    <App/>
  </Route>,
  document.getElementById("root")
);
