import { FormEvent, useEffect } from "react";
import { Radio } from "@mantine/core";
import { Table } from "@tableflow/ui-library";

// import style from "./style/Review.module.scss";

// TODO: correct props
// TODO: Add types
export default function RowSelection({ upload, template, onSuccess, onCancel }: any) {
  const mockData = [
    {
      id: 1,
      __select: { raw: "", content: <input type="radio" /> }, // TODO: this can probably be taken from mantine?
      "Row Selection": "John Doe",
      __age: { raw: 33, content: "33" },
      __data: "john.doe@example.com",
    },
    {
      id: 2,
      __select: { raw: "", content: <input type="radio" /> }, // TODO: this can probably be taken from mantine?
      "Row Selection": "Jane Doe",
      __age: { raw: 33, content: "33" },
      __data: "red",
    },
  ];
  return <Table data={mockData} background="dark" columnWidths={["20%", "30%", "30%", "20%"]} columnAlignments={["", "", "", "center"]} fixHeader />;
}
