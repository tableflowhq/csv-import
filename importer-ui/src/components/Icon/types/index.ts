export type IconType =
  | "arrowDown"
  | "arrowHeadDown"
  | "arrowHeadUp"
  | "arrowUp"
  | "cross"
  | "ellipsis"
  | "error"
  | "eyesClosed"
  | "eyesOpen"
  | "google"
  | "github"
  | "help"
  | "moon"
  | "sun"
  | "sort"
  | "arrowLeft"
  | "arrowRight"
  | "bell"
  | "gear"
  | "search"
  | "trash"
  | "database"
  | "clock"
  | "userSimple"
  | "check"
  | "upload"
  | "download"
  | "downloadFile"
  | "logOut"
  | "share"
  | "edit"
  | "cube"
  | "code"
  | "link"
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "copy"
  | "file"
  | "info";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  icon?: IconType;
  size?: "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl";
};

export type IconMap = {
  [key in IconType]: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
};

const iconsArray = [
  "arrowDown",
  "arrowHeadDown",
  "arrowHeadUp",
  "arrowUp",
  "cross",
  "ellipsis",
  "error",
  "eyesClosed",
  "eyesOpen",
  "google",
  "github",
  "help",
  "moon",
  "sun",
  "sort",
  "arrowLeft",
  "arrowRight",
  "bell",
  "gear",
  "search",
  "trash",
  "database",
  "clock",
  "userSimple",
  "check",
  "upload",
  "download",
  "downloadFile",
  "logOut",
  "share",
  "edit",
  "cube",
  "code",
  "link",
  "select",
  "insert",
  "update",
  "delete",
  "copy",
  "file",
  "info",
].sort() as IconType[];

export { iconsArray };
