import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./App";
import HomePage from "./pages/home/HomePage";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ClinicList from "./pages/clinics/ClinicList";
import ClinicDetail from "./pages/clinics/ClinicDetail";
import DoctorList from "./pages/doctors/DoctorList";
import DoctorDetail from "./pages/doctors/DoctorDetail";
import BookAppointment from "./pages/appointments/BookAppointment";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import CheckoutGateway from "./pages/checkout/CheckoutGateway";
import { AuthProvider } from "./Provider/AuthProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { PrivateRoute, RoleRoute } from "./components/shared/PrivateRoute";
import WaitingRoomDisplay from "./pages/queue/WaitingRoomDisplay";
import PatientQueueTracker from "./pages/queue/PatientQueueTracker";
import PrescriptionVerify from "./pages/prescriptions/PrescriptionVerify";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import "./App.css";

const root = document.getElementById("root");


ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/track-queue/:appointmentId" element={<PatientQueueTracker />} />
          <Route path="/queue-token/:appointmentId" element={<PatientQueueTracker />} />
          <Route path="/queue-display/:clinicId/:doctorId" element={<WaitingRoomDisplay />} />
          <Route path="/queue-display" element={<WaitingRoomDisplay />} />
          <Route path="/verify-prescription/:qrToken" element={<PrescriptionVerify />} />
          <Route path="/verify-prescription" element={<PrescriptionVerify />} />
          <Route path="/verify/:qrToken" element={<PrescriptionVerify />} />
          <Route path="/verify" element={<PrescriptionVerify />} />
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="clinics" element={<ClinicList />} />
            <Route path="clinics/:id" element={<ClinicDetail />} />
            <Route path="doctors" element={<DoctorList />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route
              path="book"
              element={
                <RoleRoute allowedRoles={["PATIENT"]}>
                  <BookAppointment />
                </RoleRoute>
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
            <Route path="checkout/:paymentId" element={<CheckoutGateway />} />
            <Route path="privacy" element={<PrivacyPolicy initialTab="privacy" />} />
            <Route path="terms" element={<PrivacyPolicy initialTab="terms" />} />
            <Route path="security" element={<PrivacyPolicy initialTab="security" />} />
            <Route path="legal" element={<PrivacyPolicy initialTab="privacy" />} />
          </Route>
        </Routes>

      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

