import { Navigate, Routes } from "react-router-dom";
import ApiKey from "../features/forms/ApiKey";
import Invite from "../features/forms/Invite";
import Imports from "../features/imports";
import Frame from "../features/layouts/frame";
import Main from "../features/layouts/main";
import Profile from "../features/profile";
import Users from "../features/users";
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
    paths: "profile",
    layout: Main,
    children: <Profile />,
  },
  {
    paths: "settings",
    layout: Main,
    children: <ApiKey />,
  },
  {
    paths: "users",
    layout: Main,
    children: <Users />,
  },
  {
    paths: "invite",
    layout: Frame,
    children: <Invite disableSkip disableIntro />,
  },
  {
    paths: "*",
    children: <Navigate to={"importers"} />,
  },
];

export default function ApplicationRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
