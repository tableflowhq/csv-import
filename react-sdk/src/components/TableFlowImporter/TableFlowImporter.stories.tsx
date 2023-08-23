import { useState } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import defaults from "../../settings/defaults";
import ImporterComponent from ".";
import { TableFlowImporterProps } from "./types";

export default {
  title: "User Interface/Importer",
  component: ImporterComponent,
  argTypes: {
    primaryColor: {
      control: { type: "color" },
    },
    labelColor: {
      control: { type: "color" },
    },
  },
} as ComponentMeta<typeof ImporterComponent>;

const Template: ComponentStory<typeof ImporterComponent> = (args: TableFlowImporterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Import</button>
      <ImporterComponent {...args} isOpen={isOpen} onRequestClose={() => setIsOpen(false)} />
    </div>
  );
};

export const Importer = Template.bind({});
Importer.args = {
  ...defaults,
};
