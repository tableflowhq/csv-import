import Spinner from "../../../components/Spinner";

function LoadingSpinner({ style }: any) {
  return <Spinner className={style.spinner}>Importing your data...</Spinner>;
}

export default LoadingSpinner;
