import classes from "../../utils/classes";
import { IconMap, IconProps } from "./types";
import style from "./style/Icon.module.scss";
import { ReactComponent as ArrowDown } from "../../assets/icons/arrowHeadDown.svg";
import { ReactComponent as ArrowHeadDown } from "../../assets/icons/arrowHeadDown.svg";
import { ReactComponent as ArrowHeadUp } from "../../assets/icons/arrowHeadUp.svg";
import { ReactComponent as ArrowLeft } from "../../assets/icons/arrowLeft.svg";
import { ReactComponent as ArrowRight } from "../../assets/icons/arrowRight.svg";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrowUp.svg";
import { ReactComponent as Bell } from "../../assets/icons/bell.svg";
import { ReactComponent as Check } from "../../assets/icons/check.svg";
import { ReactComponent as Clock } from "../../assets/icons/clock.svg";
import { ReactComponent as Code } from "../../assets/icons/code.svg";
import { ReactComponent as Copy } from "../../assets/icons/copy.svg";
import { ReactComponent as Cross } from "../../assets/icons/cross.svg";
import { ReactComponent as Cube } from "../../assets/icons/cube.svg";
import { ReactComponent as Database } from "../../assets/icons/database.svg";
import { ReactComponent as Delete } from "../../assets/icons/delete.svg";
import { ReactComponent as DownloadFile } from "../../assets/icons/download-file.svg";
import { ReactComponent as Download } from "../../assets/icons/download.svg";
import { ReactComponent as Edit } from "../../assets/icons/edit.svg";
import { ReactComponent as Ellipsis } from "../../assets/icons/ellipsis.svg";
import { ReactComponent as Error } from "../../assets/icons/error.svg";
import { ReactComponent as EyeClosed } from "../../assets/icons/eye-closed.svg";
import { ReactComponent as EyeOpen } from "../../assets/icons/eye-open.svg";
import { ReactComponent as File } from "../../assets/icons/file.svg";
import { ReactComponent as Gear } from "../../assets/icons/gear.svg";
import { ReactComponent as Help } from "../../assets/icons/help.svg";
import { ReactComponent as Info } from "../../assets/icons/info.svg";
import { ReactComponent as Insert } from "../../assets/icons/insert.svg";
import { ReactComponent as Link } from "../../assets/icons/link.svg";
import { ReactComponent as LogOut } from "../../assets/icons/logOut.svg";
import { ReactComponent as Moon } from "../../assets/icons/moon.svg";
import { ReactComponent as Search } from "../../assets/icons/search.svg";
import { ReactComponent as Select } from "../../assets/icons/select.svg";
import { ReactComponent as Share } from "../../assets/icons/share.svg";
import { ReactComponent as Github } from "../../assets/icons/social/github.svg";
import { ReactComponent as Google } from "../../assets/icons/social/google.svg";
import { ReactComponent as Sort } from "../../assets/icons/sort.svg";
import { ReactComponent as Sun } from "../../assets/icons/sun.svg";
import { ReactComponent as Trash } from "../../assets/icons/trash.svg";
import { ReactComponent as Update } from "../../assets/icons/update.svg";
import { ReactComponent as Upload } from "../../assets/icons/upload.svg";
import { ReactComponent as UserSimple } from "../../assets/icons/user-simple.svg";

const iconMap: IconMap = {
  arrowDown: ArrowDown,
  arrowHeadDown: ArrowHeadDown,
  arrowHeadUp: ArrowHeadUp,
  arrowUp: ArrowUp,
  cross: Cross,
  ellipsis: Ellipsis,
  error: Error,
  eyesClosed: EyeClosed,
  eyesOpen: EyeOpen,
  google: Google,
  github: Github,
  help: Help,
  moon: Moon,
  sun: Sun,
  sort: Sort,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  bell: Bell,
  gear: Gear,
  search: Search,
  trash: Trash,
  select: Select,
  insert: Insert,
  update: Update,
  delete: Delete,
  database: Database,
  clock: Clock,
  userSimple: UserSimple,
  check: Check,
  upload: Upload,
  download: Download,
  downloadFile: DownloadFile,
  logOut: LogOut,
  share: Share,
  edit: Edit,
  cube: Cube,
  code: Code,
  link: Link,
  copy: Copy,
  file: File,
  info: Info,
};

export default function Icon({ icon, className, size, ...props }: IconProps) {
  const IconComponent = icon && iconMap?.[icon];
  const iconClass = classes([style.icon, size && style?.[size], className]);
  return IconComponent ? <IconComponent {...props} className={iconClass} /> : null;
}
