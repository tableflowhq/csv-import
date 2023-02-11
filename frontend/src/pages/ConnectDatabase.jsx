import React from "react";
import wave from "../assets/wave.svg";
import {NavLink} from "react-router-dom";

const ConnectDatabase = () => {
  return (
    <div className="login_container d-flex justify-content-center align-items-center">
      {/* LOGIN FORM START */}
      <div className="login_form pb-3">
        <div className="px-4">
          <h4 className="f24 pt-4 fw600">Connect to your Database</h4>
        </div>
        <hr/>

        <div className="database_setup pb-3 bg-white rounded-3">
          <form>
            <div className="px-4">
              <label htmlFor="Type">Database Type</label>
              <br/>
              <select name="" id="">
                <option value="Postgres">Postgres</option>
              </select>
              <div className="mt-2"/>
              <label htmlFor="Host">Host</label>
              <br/>
              <input
                type="text"
                placeholder="Enter Host"
                className="w-100 px-2"
              />
              <div className="mt-2"/>
              <div className="row gx-3">
                <div className="col-3">
                  <label htmlFor="Port">Port</label>
                  <br/>
                  <input
                    className="w-100 text-center"
                    type="number"
                    name=""
                    id=""
                    placeholder="0000"
                  />
                </div>
              </div>
              <div className="mt-2"/>
              <label htmlFor="Database Name">Database Name</label>
              <br/>
              <input
                type="text"
                placeholder="Enter Host"
                className="w-100 px-2"
              />
              <div className="mt-2"/>
              <label htmlFor="Username">Username</label>
              <br/>
              <input
                type="text"
                placeholder="Enter Username"
                className="w-100 px-2"
              />
              <div className="mt-2"/>
              <label htmlFor="Password">Password</label>
              <br/>
              <input
                type="text"
                placeholder="Enter Password"
                className="w-100 px-2"
              />
              <br/>
            </div>
            <hr/>

            <div className="px-4">
              <NavLink to="/actions">
                <button className="w-100 border-0 text-white f14">
                  Connect
                </button>
              </NavLink>
            </div>

            <p className="error">
              <strong>Error:</strong> Unable to reach host
            </p>
          </form>
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
