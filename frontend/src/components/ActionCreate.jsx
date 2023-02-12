import React, {useEffect, useState} from "react";
import {httpGet, httpPost} from "../util/api";
import {useHistory} from "react-router-dom";

const ActionCreate = ({setLoading}) => {
  const history = useHistory();
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    schema: "",
    table: "",
    events: [],
    url: "",
    body: "",
  });
  const {name, schema, table, url, body} = formData;
  const events = ["INSERT", "UPDATE", "DELETE"];
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleEvents = (i) => {
    setFormData({
      ...formData,
      events: formData.events.includes(i)
        ? formData.events.filter((content) => content !== i)
        : [...formData.events, i],
    });
  };
  const [tables, setTables] = useState({});
  useEffect(() => {
    httpGet("table/list", (data) => {
      setTables(data)
    }, (data) => {
      console.log(data)
      // TODO: Return error page in case of failure here
    })
  }, []);
  const createAction = () => {
    setError(null)
    // setLoading(true)
    const body = {
      "name": formData.name,
      "table": formData.table,
      "schema": formData.schema,
      "trigger_events": formData.events,
      "action": {
        "type": "HTTP",
        "url": formData.url,
        "method": "POST",
        "body": formData.body
      }
    }
    httpPost("action", body, (data) => {
      setTimeout(function() {
        // setLoading(false);
        history.push("/")
      }, 500);
    }, (data) => {
      // setLoading(false);
      if(data.error) {
        setError(data.error)
      } else {
        setError("An unknown error occurred")
      }
    })
  }

  return (
    <div className="database_setup pb-3 bg-white rounded-3">
      <div className="px-4 pt-3">
        <label htmlFor="Name">Name</label>
        <br/>
        <input
          type="text"
          placeholder="Enter Name"
          name="name"
          value={name}
          onChange={handleChange}
        />
        <div className="mt-2"/>
        <label htmlFor="Schema">Schema</label>
        <br/>
        <select value={schema} name="schema" id="" onChange={handleChange} defaultValue="">
          <option value=""></option>
          {Object.entries(tables).map(([key, tables]) => {
            return (
              <option key={key} value={key}>{key}</option>
            );
          })}
        </select>
        <div className="mt-2"/>
        <label htmlFor="Table">Table</label>
        <br/>
        <select value={table} disabled={schema === ""} name="table" id="" onChange={handleChange} defaultValue="">
          <option value=""></option>
          {schema === "" ? null :
            tables[schema].map(table => {
              return (
                <option key={table} value={table}>{table}</option>
              );
            })
          }
        </select>
        <div className="mt-2"/>
        <label htmlFor="Events">Events</label>
        <br/>
        <div className="d-flex align-items-center gap-4">
          {events.map((content) => {
            return (
              <div key={content}
                   onClick={() => handleEvents(content)}
                   className="d-flex align-items-center pointer"
              >
                {formData.events.includes(content) ? (
                  <div className="active_"></div>
                ) : (
                  <div className="unactive_"></div>
                )}
                <label htmlFor="Events">{content}</label>
              </div>
            );
          })}
        </div>
        <div className="mt-2"/>
        <label htmlFor="Action">Action</label>
        <br/>
        <select name="action">
          <option value="HTTP" selected disabled>HTTP Request</option>
        </select>
        <div className="mt-2"/>
        <label htmlFor="Method">Method</label>
        <select name="method">
          <option value="POST" selected disabled>POST</option>
        </select>
        <div className="mt-2"/>
        <label htmlFor="URL">URL</label>
        <input
          type="text"
          placeholder="Enter URL"
          name="url"
          value={url}
          onChange={handleChange}
        />
        <div className="mt-2"/>
        <label htmlFor="Body">Body</label>
        <br/>
        <textarea
          style={{fontFamily: "monospace"}}
          name="body"
          cols="30"
          rows="6"
          value={body}
          onChange={handleChange}
          placeholder="{
            'data': 'test'
          }"
        ></textarea>
        <hr/>
        {error ? (
          <p className="error-create-action">
            <strong>Error:</strong>&nbsp;{error}
          </p>
        ) : null}
        <div>
          <button className="border-0 text-white w-100">Test</button>
        </div>
        <br/>
        <div>
          <button
            onClick={createAction}
            className="border-0 text-white w-100"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionCreate;
