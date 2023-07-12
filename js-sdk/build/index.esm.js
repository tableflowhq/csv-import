/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".index_TableFlowImporter__qOYdj {\r\n  border: none;\r\n  background-color: transparent;\r\n  padding: 0 1rem;\r\n  border-radius: 1.2rem;\r\n  color: inherit;\r\n  cursor: pointer;\r\n  font-weight: 500;\r\n  font-size: 14px;\r\n  height: 2.4rem;\r\n  display: inline-flex;\r\n  gap: 0.5rem;\r\n  align-items: center;\r\n  transition: filter 0.2s ease-out;\r\n}\r\n\r\n.index_TableFlowImporter__qOYdj svg {\r\n  display: block;\r\n}\r\n\r\n.index_TableFlowImporter__qOYdj svg path {\r\n  stroke: currentColor !important;\r\n}\r\n\r\n.index_TableFlowImporter__qOYdj:hover,\r\n.index_TableFlowImporter__qOYdj:active {\r\n  filter: brightness(1.2);\r\n}\r\n\r\n.index_TableFlowImporter-dialog__gzgql {\r\n  background-color: transparent;\r\n  border-radius: 1rem;\r\n  border: none;\r\n  position: fixed;\r\n  inset: 0;\r\n  padding: 0;\r\n}\r\n\r\n.index_TableFlowImporter-dialog__gzgql::backdrop {\r\n  background-color: rgba(0, 0, 0, 0.85);\r\n}\r\n\r\n.index_TableFlowImporter-dialog__gzgql iframe {\r\n  border-radius: 1rem;\r\n  width: 80vw;\r\n  height: 80vh;\r\n  min-width: 907px;\r\n  min-height: 650px;\r\n  border: none;\r\n}\r\n\r\n.index_TableFlowImporter-close__u1RHT {\r\n  position: absolute;\r\n  top: 2rem;\r\n  right: 2rem;\r\n  background-color: white;\r\n  border: none;\r\n  padding: 0;\r\n  cursor: pointer;\r\n  width: 2rem;\r\n  height: 2rem;\r\n  border-radius: 50%;\r\n  transition: filter 0.2s ease-out;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.index_TableFlowImporter-close__u1RHT svg {\r\n  display: block;\r\n}\r\n\r\n.index_TableFlowImporter-close__u1RHT svg path {\r\n  stroke: #0e1116 !important;\r\n}\r\n";
styleInject(css_248z);

function TableFlowImporter(_a) {
    var // TODO: Include "as" parameter to launch as a div
    _b = _a.elementId, 
    // TODO: Include "as" parameter to launch as a div
    elementId = _b === void 0 ? "tableflow-importer" : _b, _c = _a.isOpen, isOpen = _c === void 0 ? true : _c, _d = _a.onRequestClose, onRequestClose = _d === void 0 ? function () { return null; } : _d, importerId = _a.importerId; _a.hostUrl; var _e = _a.darkMode, darkMode = _e === void 0 ? false : _e, _f = _a.primaryColor, primaryColor = _f === void 0 ? "#7a5ef8" : _f, _g = _a.metadata, metadata = _g === void 0 ? "{}" : _g; _a.closeOnClickOutside; _a.className; __rest(_a, ["elementId", "isOpen", "onRequestClose", "importerId", "hostUrl", "darkMode", "primaryColor", "metadata", "closeOnClickOutside", "className"]);
    var current = document.getElementById(elementId);
    // useEffect(() => {
    if (current) {
        if (isOpen)
            current.showModal();
        else
            current.close();
    }
    var urlParams = {
        importerId: importerId,
        darkMode: darkMode.toString(),
        primaryColor: primaryColor,
        metadata: metadata,
        isOpen: isOpen.toString(),
    };
    new URLSearchParams(urlParams);
    //useEffect(() => {
    try {
        JSON.parse(metadata);
    }
    catch (e) {
        console.error('The "metadata" prop is not a valid JSON string. Please check the documentation for more details.');
    }
    //}, [metadata]);
    //useEffect(() => {
    window.onmessage = function (e) {
        if (e.data == "close") {
            onRequestClose();
        }
    };
    //}, []);
    return "<dialog ref={ref} className={dialogClass} onClick={backdropClick} {...props}>\n            <iframe src={uploaderUrl} />\n            <button className={closeClass} onClick={() => onRequestClose()}>\n                <span dangerouslySetInnerHTML={{ __html: cross }} />\n            </button>\n        </dialog>";
}

export { TableFlowImporter as default };
//# sourceMappingURL=index.esm.js.map
