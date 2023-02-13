import React from "react";
import Layout from "../layout";
import ActionCreate from "../components/ActionCreate";

const LayoutActionCreate = ({localMode, setLoading}) => {
  return (
    <Layout>
      <div className="container-fluid py-3 px-4">
          <h3 className="fw500 f28 mb-1">Create Action</h3>

        {/* BOTTOM SECTION */}
        <div className="payment_container_upper mt-4">
          <div className="row gy-4">
            <div className="col-12 col-lg-6">
              <ActionCreate setLoading={setLoading}/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutActionCreate;
