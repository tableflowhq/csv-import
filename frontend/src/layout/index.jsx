import React, {useState} from "react";
import Sidebar from "../components/Sidebar";
import avt from "../assets/avt.svg";
import {AiOutlineSearch} from "react-icons/ai";
import {BiExit} from "react-icons/bi";
import {GiHamburgerMenu} from "react-icons/gi";
import {NavLink} from "react-router-dom";

const Layout = ({children}) => {
  const [sideBar, setSideBar] = useState(false);

  return (
    <div className="layout_container d-flex">
      <Sidebar sideBar={sideBar} setSideBar={setSideBar}/>
      <div className="w-100">
        <div className="header_container shadow-sm d-flex justify-content-between align-items-center px-4 w-100">
          <div className="d-flex align-items-center">
            <GiHamburgerMenu
              onClick={() => setSideBar(!sideBar)}
              fontSize="1.4rem"
              className="pointer hamb color3"
            />
            <div className="d-flex align-items-center ms-4">
              <AiOutlineSearch
                className="search_container me-3 color3"
                fontSize="1.5rem"
              />
              <input
                type="text"
                name=""
                id=""
                placeholder="Search..."
                className="f18 border-0"
              />
            </div>
          </div>
          <div className="d-flex align-items-center">
            <div className="top_side d-none d-md-flex align-items-center ps-4">
              <img src={avt} alt=""/>
              <div className="d-flex flex-column">
                <p className="mb-0 ms-3 fw600 color3">Sameer</p>
                <p className="mb-0 ms-3 fw400 color3">Owner</p>
              </div>
            </div>
            <NavLink to="/">
              <BiExit
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
