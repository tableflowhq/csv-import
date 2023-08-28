import { Template } from "../api/types";

const demoTemplate: Template = {
  id: "template1",
  name: "Demo Template",
  columns: [
    { id: "1", name: "First Name", key: "first_name", required: true },
    { id: "2", name: "Last Name", key: "last_name", required: true },
    { id: "3", name: "Email", key: "email", required: true },
    { id: "4", name: "Phone Number", key: "Phone Numbe", required: true },
    { id: "5", name: "First Contacted", key: "first_contacted" },
    { id: "6", name: "Market Segment", key: "market_segment" },
  ],
};

const template = {
  ...demoTemplate,
  fields: demoTemplate.columns.map((item) => ({ ...item, required: item?.required ?? false })),
};

export default template;
