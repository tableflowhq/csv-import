import React, {useEffect} from "react";
import Layout from "../layout";
import {DisplaySettings,} from "../components/SettingsDisplay";

const LayoutSettings = ({setMode, mode, localMode}) => {
  useEffect(() => {
  }, [localMode, mode]);
  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <h3 className="fw500 f28 mb-1">Settings</h3>

        {/* BOTTOM SECTION */}
        <div className="user_container_upper mt-4">
          <div className="row gy-4">
            <div className="col-md-10 col-lg-8 rounded-3">
              <div className="row">
                <div className="col-12 col-md-6">
                  {/* <AccountSettings />
                  <br /> */}
                  <DisplaySettings
                    mode={mode}
                    setMode={setMode}
                    localMode={localMode}
                  />
                </div>
                {/* <div className="col-12 col-md-6">
                  <StripeInformation />
                  <br />
                  <UsefulLinks />
                  <br />
                  <LicenseTransferSettings />
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutSettings;
