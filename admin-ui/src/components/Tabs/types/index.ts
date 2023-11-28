export type Tab = { [label: string]: string };

export type TabsProps = React.PropsWithChildren & {
  tabs: Tab;
  tab: string;
  setTab: (key: string) => void;
  onChange?: (key: string) => void;
};
