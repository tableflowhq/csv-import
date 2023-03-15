import React from "react";
import wave from "../assets/wave.svg";

const NotFound = () => {
  return (
    <div className="login_container d-flex justify-content-center align-items-center">
      <div className="pb-3">
        <div className="container-fluid">
          <div className="px-4">
            <h4 className="f24 text-center pt-2 fw500">Page Not Found</h4>
            <p className="color2 text-center pb-2 f16">
              Click <a href="/">here</a> to return home.
            </p>
          </div>
        </div>
      </div>
      <div className="bottom_wave w-100">
        <img className="w-100" src={wave} alt=""/>
      </div>
    </div>
  );
};

export default NotFound;
