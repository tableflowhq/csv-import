import { useParams } from "react-router";
import { Frame } from "@tableflow/ui-library";
import Error404 from "../../404";
import useGetImporter from "../../../api/useGetImporter";
import ImporterPage from "..";

export default function ImporterBase() {
  const { importerId } = useParams();

  const { data: importer, isLoading } = useGetImporter(importerId && importerId !== "new" ? importerId : "");

  if (isLoading) return null;

  return importer ? (
    <ImporterPage importer={importer} />
  ) : (
    <Frame>
      <Error404 />
    </Frame>
  );
}
