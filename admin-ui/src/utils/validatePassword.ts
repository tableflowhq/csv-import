const validatePassword = (p: string): [boolean, string[]] => {
  const errors = [];

  if (
    p.length < 8 /* ||
    p.search(/[A-Z]/) === -1 ||
    p.search(/[a-z]/) === -1 ||
    p.search(/[0-9]/) === -1 ||
    // eslint-disable-next-line
    p.search(/[!@#\$%\^\&*\)\(+=._-]/) === -1 */
  ) {
    errors.push("Password must contain at least 8 characters");
    // errors.push("Password must contain at least 8 characters and be a combination of upper and lowercase letters, numbers and special characters");
  }

  return [errors.length === 0, errors];
};

export default validatePassword;
