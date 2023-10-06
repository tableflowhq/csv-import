const setTheme = (theme: "dark" | "light") => {
  document.body.setAttribute("data-theme", theme);

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
