import "./App.css";
import { TableFlowImporter } from "client-sdk";

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
  return (
    <div className="App">
      <TableFlowImporter
        importerId="1234"
        isModal={false}
        darkMode={true}
        template={template}
      />
    </div>
  );
}

export default App;





