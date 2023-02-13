import React, {useState} from "react";
import wave from "../assets/wave.svg";
import {httpPost} from "../util/api";
import {useHistory} from "react-router-dom";


const ConnectDatabase = ({setLoading}) => {
  const [databaseInfo, setDatabaseInfo] = useState({
    host: "",
    port: 5432,
    database: "",
    user: "",
    password: "",
  });
  const [error, setError] = useState(null)
  const history = useHistory();
  const handleChange = (event) => {
    setDatabaseInfo({...databaseInfo, [event.target.name]: event.target.value});
  };
  const handleSubmit = (event) => {
    setError(null)
    setLoading(true)

    httpPost("connection", databaseInfo,
      (data) => {
        setTimeout(function() {
          setLoading(false);
          history.push("/")
        }, 500);
      }, (data) => {
        setLoading(false);
        if(data.error) {
          setError(data.error)
        } else {
          setError("An unknown error occurred")
        }
      })
  };

  return (
    <div className="login_container d-flex justify-content-center align-items-center">
      {/* LOGIN FORM START */}
      <div className="login_form pb-3">
        <div className="container-fluid">
          <div className="px-4">
            <h4 className="f24 pt-4 fw500">Connect to Your Database</h4>
          </div>
          <hr/>
          <div className="database_setup pb-3 bg-white rounded-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="px-3">
                <label htmlFor="Type">Database Type</label>
                <br/>
                <select>
                  <option value="Postgres">Postgres</option>
                </select>
                <div className="mt-2"/>
                <label htmlFor="Host">Host</label>
                <br/>
                <input
                  className="w-100 px-2"
                  type="text"
                  name="host"
                  value={databaseInfo.host}
                  placeholder="Enter Host"
                  onChange={handleChange}
                />
                <div className="mt-2"/>
                <div className="row gx-5">
                  <div className="col-3">
                    <label htmlFor="Port">Port</label>
                    <br/>
                    <input
                      className="w-100 px-2"
                      type="number"
                      name="port"
                      value={databaseInfo.port}
                      placeholder="0000"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mt-2"/>
                <label htmlFor="Database Name">Database Name</label>
                <br/>
                <input
                  className="w-100 px-2"
                  type="text"
                  name="database"
                  value={databaseInfo.database}
                  placeholder="Enter Name"
                  onChange={handleChange}
                />
                <div className="mt-2"/>
                <label htmlFor="Username">Username</label>
                <br/>
                <input
                  className="w-100 px-2"
                  type="text"
                  name="user"
                  value={databaseInfo.user}
                  placeholder="Enter Username"
                  onChange={handleChange}
                />
                <div className="mt-2"/>
                <label htmlFor="Password">Password</label>
                <br/>
                <input
                  className="w-100 px-2"
                  type="password"
                  name="password"
                  value={databaseInfo.password}
                  placeholder="Enter Password"
                  onChange={handleChange}
                />
                <br/>
              </div>
              <hr/>
              <div className="px-4">
                <button className="w-100 border-0 text-white f16"
                        onClick={handleSubmit}>
                  Connect
                </button>
              </div>
              {error ? (
                <p className="error">
                  <strong>Error:</strong>&nbsp;{error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
      {/* <Welcome /> */}
      {/* LOGIN FORM END */}

      {/* BOTTOM IMAGE START */}
      <div className="bottom_wave w-100">
        <img className="w-100" src={wave} alt=""/>
      </div>
      {/* BOTTOM IMAGE END */}
    </div>
  );
};

export default ConnectDatabase;
