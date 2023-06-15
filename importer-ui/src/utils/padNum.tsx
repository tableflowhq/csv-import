const padNum = (num: number, size: number): string => {
  const s = "00000000" + num;
  return s.substr(s.length - size);
};

export default padNum;
