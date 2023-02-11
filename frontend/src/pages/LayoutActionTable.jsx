import React from "react";
import Layout from "../layout";
import ActionTable from "../components/ActionTable";
import {Link} from "react-router-dom";

const LayoutActionTable = () => {
  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center bg-white rounded-3 px-4 py-4">
          <h3 className="fw600 f24 mb-1">Actions</h3>
          <Link to="/create-action">
            <button className="ms-4 bg-purple-light border-0 px-3 py-2 rounded-3 color1 fw600">
              Create
            </button>
          </Link>
        </div>

        {/* BOTTOM SECTION */}
        <div className="user_container_upper mt-4">
          <div className="row gy-4">
            <div className="col-12 rounded-3">
              <ActionTable/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutActionTable;
