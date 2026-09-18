import { Outlet } from "react-router";
import Footer from "./components/shared/Footer";
import Navbar from "./components/shared/Navbar";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default App;
