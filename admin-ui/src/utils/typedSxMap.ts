import { CSSWithMultiValues } from '@chakra-ui/react';

type ThemeSxProps = CSSWithMultiValues

type SxMap<ClassKey extends string> = Record<ClassKey, ThemeSxProps>;

export const typedSxMap = <ClassKey extends string>(sxMap: SxMap<ClassKey>) => {
  return sxMap;
};