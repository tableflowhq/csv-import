import Providers from "../../importer-ui/providers";
import defaults from "../../settings/defaults";
import ImporterComponent from "../index";
import { TableFlowImporterProps } from "../../types";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { useState } from "react";

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
      <Providers>
        <ImporterComponent key={props.isModal?.toString()} {...props} />
      </Providers>
    </div>
  );
};

export const Importer = Template.bind({});
Importer.args = {
  ...defaults,
};
