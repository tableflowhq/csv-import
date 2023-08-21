import { FormEvent, useEffect, useState } from "react";
// import { Radio } from "@mantine/core";
import { Button, Table } from "@tableflow/ui-library";
import { RowSelectionProps } from "./types";
import style from "./style/RowSelection.module.scss";
import mockData from "./mockData";

export default function RowSelection({ upload, onSuccess, onCancel }: RowSelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedId(String(e.target.value));
  };

  const dataWithRadios = mockData.map((row) => ({
    ...row,
    __select: {
      ...row.__select,
      content: <input type="radio" name="rowSelection" value={row.id} onChange={handleRadioChange} />,
    },
  }));

  const handleNextClick = () => {
    if (upload && selectedId) {
      onSuccess(upload?.id, selectedId);
    }
  };

  return (
    <div className={style.content}>
      <form>
        {upload ? (
          <div className={style.tableWrapper}>
            <Table
              data={dataWithRadios}
              background="dark"
              columnWidths={["20%", "30%", "30%", "20%"]}
              columnAlignments={["", "", "", "center"]}
              fixHeader
            />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            Cancel
          </Button>
          <Button variants={["primary"]} onClick={handleNextClick}>
            Next
          </Button>
        </div>
      </form>
    </div>
  );
}
