import React from "react";
import Layout from "../layout";
import Action from "../components/Action";

const LayoutAction = ({localMode, setLoading, type}) => {
  return (
    <Layout>
      <div className="container-fluid py-3 px-4">
        <h3 className="fw500 f28 mb-1">{type} Action</h3>
        {/* BOTTOM SECTION */}
        <div className="payment_container_upper mt-4">
          <div className="row gy-4">
            <div className="col-12 col-lg-6">
              <Action setLoading={setLoading} type={type}/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutAction;
