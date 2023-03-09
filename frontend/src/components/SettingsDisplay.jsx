import React from "react";

export const DisplaySettings = ({setMode, mode, localMode}) => {
  return (
    <div className="forms pb-3 bg-white rounded-3">
      <h6 className="px-4 pt-3 color2 fw500">Display Settings</h6>
      <hr/>
      <div className="px-4">
        <div>
          <span className="d-flex">
            <button
              style={{
                borderTopRightRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
              onClick={() => {
                setMode(1);
                localStorage.setItem("modeLocal", "1");
              }}
              className={`${
                (!localMode && "bg-purple-dark text-white") ||
                (localMode === "1" && "bg-purple-dark text-white") ||
                "bg-purple-light color1"
              } px-4 border-0 w-100`}
            >
              Light
            </button>
            <button
              style={{
                borderTopLeftRadius: "0px",
                borderBottomLeftRadius: "0px",
              }}
              onClick={() => {
                setMode(2);
                localStorage.setItem("modeLocal", "2");
              }}
              className={`${
                (localMode === "2" && "bg-purple-dark text-white") ||
                "bg-purple-light color1"
              } px-4 border-0 w-100`}
            >
              Dark
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};
