const classes = (a: any[], separator = " "): string =>
  a
    .filter((c) => c)
    .map((c) => c.toString().trim())
    .join(separator);

export default classes;
