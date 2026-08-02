import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/themes.css";
import "./styles/themes/newsprint.css";
import "./styles/themes/night.css";
import "./styles/themes/pixyll.css";
import "./styles/main.css";
import "./styles/editor.css";
import "katex/dist/katex.min.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
