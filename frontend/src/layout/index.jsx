import React from "react";
import {FiSettings} from "react-icons/fi";
import {NavLink} from "react-router-dom";
import logoD from "../assets/logoD.svg";
import logoW from "../assets/logoW.svg";

const Layout = ({children}) => {
  return (
    <div className="layout_container d-flex">
      <div className="w-100">
        <div className="header_container shadow-sm d-flex align-items-center px-4 w-100"
             style={{justifyContent: "flex-end"}}>
          <NavLink to="/">
            <div className="logo2 d-flex justify-content-center">
              <img className="logoD" src={logoD} alt=""/>
              <img className="logoW" src={logoW} alt=""/>
            </div>
          </NavLink>
          <div className="d-flex align-items-center navlink_container" style={{marginLeft: "4rem"}}>
            <NavLink to="/">
              <div id="navlink-actions" className="d-flex align-items-center position-relative">
                <p className="mb-0">Actions</p></div>
            </NavLink>
          </div>
          <div className="d-flex align-items-center navlink_container" style={{marginLeft: "4rem"}}>
            <NavLink to="/audit">
              <div className="d-flex align-items-center position-relative">
                <p className="mb-0">Audit</p></div>
            </NavLink>
          </div>
          <div className="d-flex align-items-center" style={{marginLeft: "auto"}}>
            <NavLink to="/settings">
              <FiSettings
                className="ms-0 ms-md-4 pointer color3"
                fontSize="1.5rem"
              />
            </NavLink>
          </div>
        </div>
        {/* CHILDREN */}
        {children}
      </div>
    </div>
  );
};

export default Layout;
