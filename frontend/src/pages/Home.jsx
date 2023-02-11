import React from "react";
import wave from "../assets/wave.svg";

// COMPONENTS
import Welcome from "../components/Welcome";

const Home = () => {
  return (
    <div className="login_container d-flex justify-content-center align-items-center">
      {/* LOGIN FORM START */}
      <Welcome/>
      {/* LOGIN FORM END */}

      {/* BOTTOM IMAGE START */}
      <div className="bottom_wave w-100">
        <img className="w-100" src={wave} alt=""/>
      </div>
      {/* BOTTOM IMAGE END */}
    </div>
  );
};

export default Home;
