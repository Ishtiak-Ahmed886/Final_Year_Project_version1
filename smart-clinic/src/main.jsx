import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./App";
import HomePage from "./pages/home/HomePage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ClinicList from "./pages/clinics/ClinicList";
import ClinicDetail from "./pages/clinics/ClinicDetail";
import DoctorList from "./pages/doctors/DoctorList";
import BookAppointment from "./pages/appointments/BookAppointment";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import { AuthProvider } from "./Provider/AuthProvider";
import { PrivateRoute } from "./components/shared/PrivateRoute";
import "./App.css";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="clinics" element={<ClinicList />} />
          <Route path="clinics/:id" element={<ClinicDetail />} />
          <Route path="doctors" element={<DoctorList />} />
          <Route
            path="book"
            element={
              <PrivateRoute>
                <BookAppointment />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
