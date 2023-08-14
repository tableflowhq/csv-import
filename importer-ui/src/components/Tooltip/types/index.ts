export type AsMap = {
  div: React.HTMLProps<HTMLDivElement>;
  span: React.HTMLProps<HTMLSpanElement>;
  p: React.HTMLProps<HTMLParagraphElement>;
};

export type PropsWithAs<T extends keyof AsMap = "span"> = {
  as?: T;
} & AsMap[T];
