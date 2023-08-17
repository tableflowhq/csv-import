import { Navigate, Routes } from "react-router-dom";
import Imports from "../features/imports";
import Main from "../features/layouts/main";
import SettingsPage from "../features/settingsPage";
import parseRoutes from "./utils/parseRoutes";
import { RoutesType } from "./types";
import ImporterRoutes from "./ImporterRoutes";

const routes: RoutesType = [
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
    paths: "*",
    children: <Navigate to={"importers"} />,
  },
];

export default function ApplicationRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
