import { useEffect, useState } from "react";
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

  const { isModal } = args;

  const props = {
    ...(isModal ? { modalIsOpen: isOpen } : {}),
    ...(isModal ? { modalOnCloseTriggered: () => setIsOpen(false) } : {}),
    ...(isModal ? { modalCloseOnOutsideClick: args.modalCloseOnOutsideClick } : {}),
    ...args,
  };

  return (
    <div>
      {args.isModal && <button onClick={() => setIsOpen(true)}>Import</button>}
      <ImporterComponent key={props.isModal.toString()} {...props} />
    </div>
  );
};

export const Importer = Template.bind({});
Importer.args = {
  ...defaults,
};
