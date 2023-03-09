import React, {useEffect, useState} from "react";
import {httpGet, httpPost} from "../util/api";
import {useHistory} from "react-router-dom";
import {BsChevronDown, BsChevronUp} from "react-icons/all";
import {MultiSelect} from "react-multi-select-component";

const Action = ({setLoading, type}) => {
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    schema: "",
    table: "",
    events: [],
    url: "",
    body: "",
  });
  const [collapse, setCollapse] = useState(true)
  const [tables, setTables] = useState({})
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  const history = useHistory()
  const queryParams = new URLSearchParams(window.location.search)
  const id = queryParams.get("id")
  const events = ["INSERT", "UPDATE", "DELETE"]
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
  // TODO: Clean this up
  useEffect(() => {
    httpGet("table/list", (data) => {
      setTables(data)
      httpGet("db-user/list", (data) => {
        setUsers(data.map((userName) => {
          return {label: userName, value: userName}
        }))
        if(!id) {
          return
        }
        httpGet(`action?id=${id}`, (data) => {
          setFormData({
            ...formData,
            name: data.name,
            schema: data.schema,
            table: data.table,
            events: data.trigger_events,
            url: data.action.url,
            body: data.action.body,
          })
          if(data.filters && data.filters.exclude_users) {
            setSelectedUser(data.filters.exclude_users.map((userName) => {
              return {label: userName, value: userName}
            }))
          }
        }, (data) => {
          console.log(data)
          history.push("/")
          // TODO: Return error page in case of failure here
        })
      }, (data) => {
        console.log(data)
      })
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
      },
      "filters": {
        "exclude_users": selectedUser.map(u => u.value)
      }
    }
    let path = "action"
    if(id) {
      path = path + "?id=" + id
    }
    httpPost(path, body, (data) => {
      setTimeout(function() {
        // setLoading(false);
        history.push("/")
      }, 250);
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
    <div className="pb-3 bg-white rounded-3">
      <div className="px-4 pt-3">
        <div className="database_setup">
          <label htmlFor="Name">Name</label>
          <br/>
          <input
            type="text"
            placeholder="Enter Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <div className="mt-2"/>
          <label htmlFor="Schema">Schema</label>
          <br/>
          <select value={formData.schema} name="schema" id="" onChange={handleChange} defaultValue="">
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
          <select value={formData.table} disabled={formData.schema === ""} name="table" id="" onChange={handleChange}
                  defaultValue="">
            <option value=""></option>
            {formData.schema === "" ? null :
              tables[formData.schema].map(table => {
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
            value={formData.url}
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
            value={formData.body}
            onChange={handleChange}
            placeholder="{&quot;data&quot;: &quot;Row inserted: ${column_name}&quot;}"
          ></textarea>
          <br/>
        </div>
        <div className="d-flex pointer" style={{color: "#00a7ff"}} onClick={() => setCollapse(!collapse)}>
          {collapse ? <BsChevronDown style={{marginTop: "4px"}}/> : <BsChevronUp style={{marginTop: "4px"}}/>}
          <p>&nbsp;{collapse ? 'Show' : 'Hide'} Filters</p>
        </div>
        <div hidden={collapse} className="database_setup_multi_select">
          <div className="database_setup">
            <label htmlFor="Users">Exclude Queries From</label>
          </div>
          <MultiSelect
            className="database_setup_multi_select"
            name="Users"
            options={users}
            value={selectedUser}
            onChange={setSelectedUser}
            labelledBy="Select"
            hasSelectAll={false}
            overrideStrings={{allItemsAreSelected: selectedUser.map((s) => s.label).join(", ")}}
          />
        </div>
        <hr/>
        {error ? (
          <p className="error-create-action">
            <strong>Error:</strong>&nbsp;{error}
          </p>
        ) : null}
        <div className="database_setup">
          <button
            onClick={createAction}
            className="border-0 text-white w-100"
          >
            {type === "Edit" ? "Save" : type}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Action;
