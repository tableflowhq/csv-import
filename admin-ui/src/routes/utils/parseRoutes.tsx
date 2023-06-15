import { Route } from "react-router";
import { RoutesType } from "../types";

export default function parseRoutes(routes: RoutesType) {
  return routes.map((route) => {
    const paths = Array.isArray(route.paths) ? route.paths : [route.paths];

    return paths.map((path) => {
      const { layout: Layout, layoutParams = {} } = route;
      const element = Layout ? <Layout {...layoutParams}>{route.children}</Layout> : route.children;
      return <Route key={path} path={path} element={element} />;
    });
  });
}
