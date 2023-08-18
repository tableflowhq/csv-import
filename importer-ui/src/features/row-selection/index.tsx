import { FormEvent, useEffect, useState } from "react";
// import { Radio } from "@mantine/core";
import { Button, Table } from "@tableflow/ui-library";
import { RowSelectionProps } from "./types";
import style from "./style/RowSelection.module.scss";
import mockData from "./mockData";

export default function RowSelection({ upload, onSuccess, onCancel }: RowSelectionProps) {
  const [data, setData] = useState(mockData);

  const handleSelect = (id: number) => {
    setData((prevData) => prevData.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  return (
    <div className={style.content}>
      <form>
        {upload ? (
          <div className={style.tableWrapper}>
            <Table data={data} background="dark" columnWidths={["20%", "30%", "30%", "20%"]} columnAlignments={["", "", "", "center"]} fixHeader />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            Cancel
          </Button>
          <Button variants={["primary"]} onClick={() => upload && onSuccess(upload?.id)}>
            Next
          </Button>
        </div>
      </form>
    </div>
  );
}
