import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
