import React from "react";

const DatabaseSetup = () => {
  return (
    <div className="database_setup pb-3 bg-white rounded-3">
      <h6 className="px-4 pt-3 color2 fw500">Setup</h6>
      <hr/>
      <div className="px-4">
        <label htmlFor="Type">Database Type</label>
        <br/>
        <select name="" id="">
          <option value="Postgres">Postgres</option>
        </select>
        <br/>
        <br/>
        <label htmlFor="Host">Host</label>
        <br/>
        <input type="text" placeholder="Host"/>
        <br/>
        <br/>
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
        <br/>
        <label htmlFor="Database Name">Database Name</label>
        <br/>
        <input type="text" placeholder="Host"/>
        <br/>
        <br/>
        <label htmlFor="Username">Username</label>
        <br/>
        <input type="text" placeholder="Host"/>
        <br/>
        <br/>
        <label htmlFor="Password">Password</label>
        <br/>
        <input type="text" placeholder="Host"/>
        <br/>
        <hr/>
        <div>
          <button className="border-0 text-white w-100">Connect</button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
