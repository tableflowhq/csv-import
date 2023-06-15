import { Template } from "../api/types";

const demoTemplate: Template = {
  id: "template1",
  name: "Demo Template",
  template_columns: [
    { id: "1", name: "First Name", required: true },
    { id: "2", name: "Last Name", required: true },
    { id: "3", name: "Email", required: true },
    { id: "4", name: "Phone Number", required: true },
    { id: "5", name: "First Contacted" },
    { id: "6", name: "Market Segment" },
  ],
};

const template = {
  ...demoTemplate,
  fields: demoTemplate.template_columns.map((item) => ({ ...item, required: item?.required ?? false })),
};

export default template;
