import React from "react";
import Layout from "../layout";
import AuditTable from "../components/AuditTable";

const LayoutAuditTable = () => {
  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center py-2">
          <h3 className="fw500 f28 mb-1">Audit Log</h3>
        </div>
        {/* BOTTOM SECTION */}
        <div className="user_container_upper mt-3">
          <div className="row gy-4">
            <div className="col-12 rounded-3">
              <AuditTable/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutAuditTable;
