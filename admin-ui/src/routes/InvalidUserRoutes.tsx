import { Navigate, Routes } from "react-router-dom";
import EmailVerification from "../components/emailVerification";
import VerifyEmail from "../components/verifyEmail";
import Frame from "../features/layouts/frame";
import parseRoutes from "./utils/parseRoutes";
import { RoutesType } from "./types";

const routes: RoutesType = [
  {
    paths: "email-verification",
    layout: Frame,
    children: <VerifyEmail />,
  },
  {
    paths: "auth/verify-email",
    layout: Frame,
    children: <EmailVerification />,
  },
  {
    paths: "*",
    children: <Navigate to={"/email-verification"} />,
  },
];

export default function InvalidUserRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
