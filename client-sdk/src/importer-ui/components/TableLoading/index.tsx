import { Spinner } from "@chakra-ui/spinner";
import classes from "../../utils/classes";
import { TableLoadingProps } from "./types";
import style from "./style/TableLoading.module.scss";

export default function TableLoading({ hideBorder, children }: TableLoadingProps) {
  const className = classes([style.container, hideBorder && style.hideBorder]);

  return (
    <div className={className}>
      <Spinner />
      {children}
    </div>
  );
}
