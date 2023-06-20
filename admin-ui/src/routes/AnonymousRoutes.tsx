import { Routes } from "react-router-dom";
import Login from "../features/forms/Login";
import PasswordReset from "../features/forms/PasswordReset";
import SignUp from "../features/forms/SignUp";
import EmailVerification from "../components/emailVerification";
import VerifyEmail from "../components/verifyEmail";
import Frame from "../features/layouts/frame";
import parseRoutes from "./utils/parseRoutes";
import { RoutesType } from "./types";

const routes: RoutesType = [
  {
    paths: "auth/reset-password",
    layout: Frame,
    children: <PasswordReset />,
  },
  {
    paths: "email-verification",
    layout: Frame,
    children: <VerifyEmail />,
  },
  {
    paths: "signup",
    layout: Frame,
    children: <SignUp />,
  },
  {
    paths: "/",
    layout: Frame,
    children: <Login />,
  },
  {
    paths: "auth/verify-email",
    layout: Frame,
    children: <EmailVerification />,
  },
  {
    paths: "*",
    layout: Frame,
    children: <Login />,
  },
];

export default function AnonymousRoutes() {
  return <Routes>{parseRoutes(routes)}</Routes>;
}
