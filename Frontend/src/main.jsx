import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import DeferredAnalytics from "./components/common/DeferredAnalytics";
import store from "./app/store";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <DeferredAnalytics />
    </Provider>
  </StrictMode>
);
