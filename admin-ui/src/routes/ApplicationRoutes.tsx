import { Navigate, Routes } from "react-router-dom";
import Imports from "../features/imports";
import Main from "../features/layouts/main";
import SettingsPage from "../features/settingsPage";
import Welcome from "../features/welcome";
import parseRoutes from "./utils/parseRoutes";
import { RoutesType } from "./types";
import ImporterRoutes from "./ImporterRoutes";

export const routes: RoutesType = [
  {
    paths: "importers/*",
    children: <ImporterRoutes />,
  },
  {
    paths: "data",
    layout: Main,
    children: <Imports />,
  },
  {
    paths: "settings",
    layout: Main,
    children: <SettingsPage />,
  },
  {
    paths: "welcome",
    layout: Main,
    children: <Welcome />,
  },
  {
    paths: "*",
    children: <Navigate to={"welcome"} />,
  },
];

export default function ApplicationRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
