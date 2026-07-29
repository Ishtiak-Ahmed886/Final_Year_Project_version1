import { Outlet } from "react-router";
import Footer from "./components/shared/Footer";
import Navbar from "./components/shared/Navbar";

function App() {
  return (
    <div className="">
      <div className="top-0 sticky z-10">
        <Navbar />
      </div>
      <div className="">
        <Outlet />
      </div>
      <div className="">
        <Footer />
      </div>
    </div>
  );
}

export default App;
