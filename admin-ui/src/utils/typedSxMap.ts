import { SystemProps, SystemStyleObject } from "@chakra-ui/react";

type ThemeSxProps = SystemStyleObject & SystemProps;

type SxMap<ClassKey extends string> = Record<ClassKey, ThemeSxProps>;

export const typedSxMap = <ClassKey extends string>(sxMap: SxMap<ClassKey>) => {
  return sxMap;
};
