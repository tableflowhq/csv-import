import { CSVImporter } from "csv-import-react";
import { useState } from "react";
import "./App.css";

function App() {
  const template = {
    columns: [
      {
        name: "First Name",
        key: "first_name",
        required: true,
        description: "The first name of the user",
        suggested_mappings: ["first", "mame"],
      },
      {
        name: "Last Name",
        suggested_mappings: ["last"],
      },
      {
        name: "Email",
        required: true,
        description: "The email of the user",
      },
    ],
  };
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="App">
      <button className="button" onClick={() => setIsOpen((prev) => !prev)}>
        Open
      </button>

      <CSVImporter
        isModal={true}
        modalIsOpen={isOpen}
        // darkMode={false}
        template={template}
        modalOnCloseTriggered={() => setIsOpen(false)}
        modalCloseOnOutsideClick={true}
      />
    </div>
  );
}

export default App;
