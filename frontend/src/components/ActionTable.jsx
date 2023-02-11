import React from "react";

const ActionTable = () => {
  return (
    <div className="bg-white rounded-3">
      <div className="user_table">
        <table className="table">
          <thead>
          <tr>
            <th className="color2 ps-4 fw500">Name</th>
            <th className="color2 fw500">Table</th>
            <th className="color2 fw500">Events</th>
            <th className="color2 fw500">URL</th>
          </tr>
          </thead>
          <tbody>
          {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((value, index, array) => {
            return (
              <tr key={index}>
                <td className="color3 ps-4 fw400">new_user_slack</td>
                <td className="color3 fw400">users</td>
                <td className="color3 fw400">INSERT / UPDATE / DELETE</td>
                <td className="color3 fw400">hooks.slack.com/</td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
      {/*<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center px-4 pb-3">*/}
      {/*  <p className="mb-0 color2">Page 1 of 37</p>*/}
      {/*  <div className="user_btn_container">*/}
      {/*    <button className="border-0 color2">Previous</button>*/}
      {/*    <button className="ms-3 border-0 text-white mt-3 mt-md-0">*/}
      {/*      Next*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
};

export default ActionTable;
