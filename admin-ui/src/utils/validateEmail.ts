const isValidEmail = (email: string): boolean => {
  return !!email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )?.length;
};

const validateEmails = (values: string[]): string | false =>
  !values?.length
    ? "No emails were added"
    : values?.reduce((a, e) => (!isValidEmail(e) ? [a, `"${e}" is not a valid email`].filter((t) => t).join(", ") : a), "") || false;

export { validateEmails };
export default isValidEmail;
