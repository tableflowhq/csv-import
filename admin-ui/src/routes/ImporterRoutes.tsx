import { Routes } from "react-router-dom";
import ImporterBase from "../features/importer/components/ImporterBase";
import Importers from "../features/importers";
import Main from "../features/layouts/main";
import parseRoutes from "./utils/parseRoutes";
import { RoutesType } from "./types";

const routes: RoutesType = [
  {
    paths: [":importerId/:importerTab", ":importerId/*"],
    layout: Main,
    children: <ImporterBase />,
  },
  {
    paths: [":tab", "*"],
    layout: Main,
    children: <Importers />,
  },
];

export default function ImporterRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
