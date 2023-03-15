import React, {useEffect, useState} from "react";
import {httpGet} from "../util/api";
import {BsChevronDown, BsChevronUp} from "react-icons/all";

const AuditTable = () => {
    const [audits, setAudits] = useState({});
    const [rowExpand, setRowExpand] = useState({})
    const [render, setRender] = useState(false)

    useEffect(() => {
      httpGet("audit/list", (data) => {
        setAudits(data)
        setRender(true)
      }, (data) => {
        console.log(data)
        setRender(true)
        // TODO: Return error page in case of failure here
      })
    }, []);

    if(!render) {
      return null
    }
    if(Object.keys(audits).length === 0) {
      return (
        <div className="login_container d-flex justify-content-center" style={{paddingTop: "20rem"}}>
          {/* LOGIN FORM START */}
          <div className="pb-3">
            <div className="container-fluid" style={{textAlign: "center"}}>
              <div className="px-4">
                <h4 className="f24 pt-4 fw500">Track Database Changes</h4>
              </div>
              <hr/>
              <div className="px-4">
                <p>No audit logs exist. <a href="/create-action">Create an action</a> with the type "Audit Log" to get
                  started.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-white rounded-3">
        <div className="">
          <table className="table">
            <thead>
            <tr>
              <th className="color2 ps-4 fw500">Time</th>
              <th className="color2 fw500">Table</th>
              <th className="color2 fw500">User</th>
              <th className="color2 fw500">Event</th>
              <th className="color2 fw500">Changed</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(audits).map(([id, action]) => {
              const changed = action.changed
              let changedColumns = []
              if(changed) {
                changedColumns = Object.entries(changed).map(([k]) => k)
              }
              const date = new Date(Number(id) / 1000)
              return (
                <tr key={id}>
                  <td className="color2 ps-4 fw400 audit-date">{date.toLocaleString()}</td>
                  <td className="color2 fw400">{action.table}</td>
                  <td className="color2 fw400 audit-event">{action.user}</td>
                  <td className="color2 fw400 audit-event">{action.event}</td>
                  <td className="color2 fw400 action-list-td">
                    {changedColumns.length === 0 ? null : (
                      <div style={{maxWidth: "7rem"}}>
                        <div className="pointer" style={{color: "#00a7ff", display: "inline-block"}}
                             onClick={() => setRowExpand({...rowExpand, [id]: !rowExpand[id]})}>
                          {!rowExpand[id] ? <BsChevronDown/> : <BsChevronUp/>}
                        </div>
                        <div style={{display: "inline-block"}}>
                          &nbsp;{changedColumns.join(", ")}
                        </div>
                        <div hidden={!rowExpand[id]}>
                          {Object.entries(changed).map(([columnName, values]) => {
                            return (
                              <table className="table" style={{marginTop: "10px"}}>
                                <thead>
                                <tr>
                                  <th className="color2 fw600 monospace audit-change"
                                      style={{borderBottomColor: "inherit"}}>{columnName}
                                  </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                  <td className="color2 monospace audit-change"><span
                                    className="audit-change-row">new:</span> {values.new}</td>
                                </tr>
                                <tr>
                                  <td className="color2 monospace audit-change"><span
                                    className="audit-change-row">old:</span> {values.old}</td>
                                </tr>
                                </tbody>
                              </table>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
;

export default AuditTable;
