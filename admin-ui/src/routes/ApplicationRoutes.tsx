import { Navigate, Routes } from "react-router-dom";
import Invite from "../features/forms/Invite";
import Frame from "../features/layouts/frame";
import Main from "../features/layouts/main";
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
    children: (
      <div>
        <h1>Data</h1>
      </div>
    ),
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
