import React, {useEffect, useState} from "react";
import {NavLink, Redirect} from "react-router-dom";
import logoD from "../assets/logoD.svg";
import logoW from "../assets/logoW.svg";
import {getAPIBaseURL, healthCheck, httpGet} from "../util/api";

const Welcome = ({setLoading}) => {
  const [connectionData, setConnectionData] = useState({});
  const [error, setError] = useState(null)
  const [render, setRender] = useState(false)
  useEffect(() => {
    setLoading(true)
    healthCheck((data) => {
      setError(null)
      // Check to see if a connection has been set up
      httpGet("connection", (data) => {
        setConnectionData(data);
        setLoading(false);
        setRender(true)
      }, (data) => {
        setLoading(false);
        setRender(true)
      })
    }, (data) => {
      setError("error")
      setRender(true)
      setLoading(false)
      console.log(data)
    })
  }, [setLoading]);
  if(!render) {
    return (
      <div className="login_form pb-3">
        <div className="container-fluid">
          <div className="logo d-flex justify-content-center pt-4">
            <img className="logoD" src={logoD} alt=""/>
            <img className="logoW" src={logoW} alt=""/>
          </div>
        </div>
      </div>
    );
  }
  if(connectionData.host) {
    return (<Redirect to="/"/>)
  }
  if(error) {
    return (
      <div className="login_form pb-3">
        <div className="container-fluid">
          <div className="logo d-flex justify-content-center pt-4">
            <img className="logoD" src={logoD} alt=""/>
            <img className="logoW" src={logoW} alt=""/>
          </div>
          <hr/>
          <div className="px-4">
            <h4 className="f24 text-center pt-2 fw500">Connection Error</h4>
            <p className="color2 text-center pb-2 f16">
              The frontend was unable to connect to the API server
            </p>
            <ul className="color2 pb-2 f16">
              <li>Ensure the backend is running</li>
              <li>Make sure you can connect to the API server directly: <a
                target="_blank" href={getAPIBaseURL() + "health"}>{getAPIBaseURL() + "health"}</a></li>
              <li>Reach out for help over <a
                target="_blank"
                href="https://join.slack.com/t/inqueryio/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw">Slack</a>
              </li>
            </ul>
          </div>
          <hr/>
          <div className="px-4">
          </div>
        </div>
      </div>
    );
  }
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
