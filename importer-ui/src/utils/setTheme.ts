const setTheme = (theme: "dark" | "light") => {
  if (theme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  }

  if (theme === "light") {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  }
};

export default setTheme;
