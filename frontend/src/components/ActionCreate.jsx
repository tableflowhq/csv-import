import React, {useState} from "react";

const ActionCreate = () => {
  const [active, setActive] = useState(0);
  const events = ["CREATE", "UPDATE", "DELETE"];

  return (
    <div className="database_setup pb-3 bg-white rounded-3">
      <div className="px-4 pt-3">
        <label htmlFor="Name">Name</label>
        <br/>
        <input type="text" placeholder="Enter Name"/>
        <div className="mt-2"/>
        <label htmlFor="Table">Table</label>
        <br/>
        <select name="" id="">
          <option value="Type">Type</option>
          <option value="Type">Type</option>
        </select>
        <div className="mt-2"/>
        <label htmlFor="Events">Events</label>
        <br/>
        <div className="d-flex align-items-center gap-4">
          {events.map((content, i) => {
            return (
              <div
                onClick={() => setActive(i)}
                className="d-flex align-items-center pointer"
              >
                {(active === i && <div className="active_"></div>) || (
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
        <select name="" id="">
          <option value="HTTP Request">HTTP Request</option>
          <option value="HTTP Request">HTTP Request</option>
        </select>
        <div className="mt-2"/>
        <label htmlFor="URL">URL</label>
        <input type="text" placeholder="Enter URL"/>
        <div className="mt-2"/>
        <label htmlFor="Method">Method</label>
        <select name="" id="">
          <option value="Post">Post</option>
          <option value="Post">Post</option>
        </select>
        <div className="mt-2"/>
        <label htmlFor="Body">Body</label>
        <br/>
        <textarea
          name=""
          id=""
          cols="30"
          rows="6"
          placeholder="Enter Body"
        ></textarea>
        <hr/>
        <div>
          <button className="border-0 text-white w-100">Create</button>
        </div>
      </div>
    </div>
  );
};

export default ActionCreate;
