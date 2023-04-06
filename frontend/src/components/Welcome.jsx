import React from "react";
import {NavLink} from "react-router-dom";
import logoD from "../assets/logoD.svg";
import logoW from "../assets/logoW.svg";

const Welcome = ({setLoading}) => {
  return (
    <div className="login_form pb-3">
      <div className="container-fluid">
        <div className="logo d-flex justify-content-center pt-4">
          <img className="logoD" src={logoD} alt=""/>
          <img className="logoW" src={logoW} alt=""/>
        </div>
        <hr/>
        <div className="px-4">
          <h4 className="f24 text-center pt-2 fw500">Welcome to Inquery!</h4>
          <p className="color2 text-center pb-2 f16">
            Looks like everything's working. Let's connect to your database and
            start triggering actions.
          </p>
        </div>
        <hr/>
        <div className="px-4">
          <NavLink to="/connect-database">
            <button className="w-100 border-0 text-white f16">
              Get Started
            </button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
