import React from "react";
import Layout from "../layout";
import ActionCreate from "../components/ActionCreate";

const LayoutActionCreate = ({localMode}) => {
  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <div className="d-flex align-items-center bg-white rounded-3 px-4 py-4">
          <h3 className="fw600 f24 mb-1">Create Action</h3>
        </div>

        {/* BOTTOM SECTION */}
        <div className="payment_container_upper mt-4">
          <div className="row gy-4">
            <div className="col-12 col-lg-5">
              <ActionCreate/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutActionCreate;
