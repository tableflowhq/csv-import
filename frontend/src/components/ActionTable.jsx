import React, {useEffect, useState} from "react";
import {httpDelete, httpGet} from "../util/api";
import {RiDeleteBinLine} from "react-icons/all";

const ActionTable = () => {
  const [actions, setActions] = useState({});

  useEffect(() => {
    httpGet("action/list", (data) => {
      setActions(data)
    }, (data) => {
      console.log(data)
      // TODO: Return error page in case of failure here
    })
  }, []);

  const deleteAction = (id) => {
    httpDelete("action", {"id": id}, (data) => {
      window.location.reload()
    }, (data) => {
      console.log(data)
      // TODO: Return error page in case of failure here
      window.location.reload()
    })
  }

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
            <th className="color2 fw500"></th>
          </tr>
          </thead>
          <tbody>
          {Object.entries(actions).map(([id, action]) => {
            return (
              <tr key={id}>
                <td className="color2 ps-4 fw400">{action.name}</td>
                <td className="color2 fw400">{action.table}</td>
                <td className="color2 fw400">{action.trigger_events.join(", ")}</td>
                <td className="color2 fw400 action-list-td" title={action.action.url}>{action.action.url}</td>
                <td className="color2 fw400 action-list-td">
                  <RiDeleteBinLine
                    className="ms-0 ms-md-4 pointer color3"
                    fontSize="1.5rem"
                    onClick={() => deleteAction(id)}
                  />
                </td>
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
