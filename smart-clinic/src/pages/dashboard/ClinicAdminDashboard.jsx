import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import { useAuth } from "../../Provider/AuthProvider";
import ClinicAdminOnboarding from "./ClinicAdminOnboarding";
import {
  Building2, Stethoscope, Layers, Plus, CheckCircle2, AlertCircle,
  Award, ShieldCheck, Info, Link as LinkIcon, Users, Calendar,
  MapPin, Clock, TrendingUp, XCircle, Send, Check, Tv, FastForward,
  Play, Pause, Navigation, AlertTriangle, RotateCcw, Printer, CreditCard,
  UserPlus, Activity, Sparkles, Edit3, Trash2, Globe, PhoneCall, ExternalLink,
  Tag, CheckSquare, Square, Camera, Image, Upload, Star, Eye, X, ZoomIn,
  Lock, Server, HeartHandshake
} from "lucide-react";

const GALLERY_CATEGORIES = [
  "Reception & Front Desk",
  "Patient Waiting Lounge",
  "Doctor Consultation Chamber",
  "Diagnostic & Pathology Lab",
  "Radiology & Ultrasound Suite",
  "Emergency & Minor OT",
  "In-house Pharmacy",
  "Exterior & Entrance",
  "Other Facilities"
];

const SAMPLE_CLINIC_PHOTOS = [
  {
    id: "sample-1",
    image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    category: "Reception & Front Desk",
    title: "Executive Reception & Fast-Track Token Desk",
    description: "Centrally air-conditioned welcoming reception desk with automated digital token ticketing and multi-lingual help staff.",
    is_featured: true,
  },
  {
    id: "sample-2",
    image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    category: "Doctor Consultation Chamber",
    title: "Specialist Consultation Chamber",
    description: "Hygienic, private chamber equipped with digital diagnostic tools, examination bed, and confidential patient records display.",
    is_featured: false,
  },
  {
    id: "sample-3",
    image_url: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1200&q=80",
    category: "Diagnostic & Pathology Lab",
    title: "Automated Clinical Pathology Lab",
    description: "Fully automated biochemistry and hematology analyzers delivering fast, accurate, and DGDA-standard test reports.",
    is_featured: false,
  },
  {
    id: "sample-4",
    image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    category: "Patient Waiting Lounge",
    title: "Spacious Patient & Family Lounge",
    description: "Sanitized waiting area for 50+ guests with live queue TV monitors, water dispenser, and high-speed patient Wi-Fi.",
    is_featured: false,
  },
  {
    id: "sample-5",
    image_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    category: "Emergency & Minor OT",
    title: "Emergency Observation & Minor OT",
    description: "Rapid response emergency bay with oxygen supply, defibrillator, cardiac monitor, and sterile minor procedure OT.",
    is_featured: false,
  },
  {
    id: "sample-6",
    image_url: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1200&q=80",
    category: "In-house Pharmacy",
    title: "24/7 In-house Pharmacy Counter",
    description: "Dispensing genuine registered pharmaceuticals, temperature-monitored vaccines, and surgical supplies around the clock.",
    is_featured: false,
  }
];

const SERVICE_PRESETS = [
  { name: "ECG (Electrocardiogram)", fee: "500", duration_minutes: 15, preparation_instructions: "Standard resting ECG; wear easily removable upper clothing", description: "Heart rhythm and electrical activity recording" },
  { name: "Digital X-Ray (Chest P/A)", fee: "800", duration_minutes: 15, preparation_instructions: "Remove metal objects, necklace, or jewelry before scan", description: "High-resolution digital radiography of lungs and thoracic cavity" },
  { name: "Ultrasound (USG) Whole Abdomen", fee: "1500", duration_minutes: 30, preparation_instructions: "6-8 hours overnight fasting required; drink water for full bladder", description: "Ultrasonic visualization of liver, gallbladder, kidneys, pancreas, and spleen" },
  { name: "Complete Blood Count (CBC)", fee: "450", duration_minutes: 10, preparation_instructions: "No special preparation needed", description: "Automated hematology test checking hemoglobin, platelets, and WBC differential" },
  { name: "Fasting Blood Sugar (FBS)", fee: "150", duration_minutes: 5, preparation_instructions: "Strict 8-10 hours fasting before blood sample collection", description: "Quantitative plasma glucose test for diabetic screening" },
  { name: "Lipid Profile Test", fee: "1100", duration_minutes: 10, preparation_instructions: "10-12 hours overnight fasting mandatory", description: "Cholesterol, Triglycerides, HDL, LDL, and VLDL panel" },
  { name: "Dental Scaling & Polishing", fee: "1200", duration_minutes: 40, preparation_instructions: "Brush teeth and rinse before appointment", description: "Professional ultrasonic calculus removal and enamel stain polishing" },
  { name: "Nebulization & Oxygen Therapy", fee: "350", duration_minutes: 20, preparation_instructions: "Breathe slowly and deeply through inhalation mask", description: "Aerosolized bronchodilator treatment for asthma and chest congestion" },
];

const POPULAR_AMENITIES = [
  { id: "24/7 Emergency & Ambulance", label: "24/7 Emergency & Ambulance", icon: "🚑" },
  { id: "Wheelchair Accessible", label: "Wheelchair Accessible", icon: "♿" },
  { id: "In-house 24/7 Pharmacy", label: "In-house 24/7 Pharmacy", icon: "💊" },
  { id: "Diagnostic Lab on-site", label: "Diagnostic Lab on-site", icon: "🔬" },
  { id: "ICU & Observation Beds", label: "ICU & Observation Beds", icon: "🛏️" },
  { id: "Dedicated Parking", label: "Dedicated Parking", icon: "🅿️" },
  { id: "Cafeteria & Patient Lounge", label: "Cafeteria & Lounge", icon: "☕" },
  { id: "Free High-speed WiFi", label: "Free High-speed WiFi", icon: "📶" },
  { id: "Card & bKash Payment", label: "Card & bKash Payment", icon: "💳" },
  { id: "Blood Bank / Donor Network", label: "Blood Bank Support", icon: "🩸" },
];

export default function ClinicAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [clinic, setClinic] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  // Clinical Services & Decoration State
  const [services, setServices] = useState([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [submittingService, setSubmittingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    department_id: "",
    fee: "",
    duration_minutes: 15,
    preparation_instructions: "",
    description: "",
    is_available: true,
  });

  const [editClinicModalOpen, setEditClinicModalOpen] = useState(false);
  const [submittingClinicEdit, setSubmittingClinicEdit] = useState(false);
  const [clinicEditForm, setClinicEditForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
    description: "",
    opening_hours: "Open 24/7",
    emergency_contact: "",
    website: "",
  });

  // Clinic Photo Gallery & Virtual Tour State
  const [gallery, setGallery] = useState([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [uploadMode, setUploadMode] = useState("file");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoForm, setPhotoForm] = useState({
    image_url: "",
    category: "Reception & Front Desk",
    title: "",
    description: "",
    is_featured: false,
  });

  // Live Chamber & Reception Desk State
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [chamberSession, setChamberSession] = useState(null);
  const [updatingChamber, setUpdatingChamber] = useState(false);
  const [receptionDelayMins, setReceptionDelayMins] = useState(15);
  const [receptionNotice, setReceptionNotice] = useState("");
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [broadcastingDelay, setBroadcastingDelay] = useState(false);

  // Walk-in Counter Patient & Cash Check-in State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [printTokenData, setPrintTokenData] = useState(null);
  const [walkInForm, setWalkInForm] = useState({
    walk_in_name: "",
    walk_in_phone: "",
    doctor_id: "",
    appointment_time: "",
    problem_description: "",
  });



  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Forms
  const [newClinic, setNewClinic] = useState({
    name: "", address: "", city: "", phone: "", email: "",
    subscription_plan: "FREE", latitude: "", longitude: "", certificate_url: "",
  });

  const [inviteForm, setInviteForm] = useState({
    doctor_id: "", department_id: "", consultation_fee: "", room_number: "",
  });

  const [clinicDeptForm, setClinicDeptForm] = useState({ department_id: "" });
  const [newSpec, setNewSpec] = useState({ name: "", description: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      // First check owned clinic via dedicated endpoint
      let owned = null;
      try {
        const myRes = await apiClient.get("/clinics/my-clinic/");
        if (myRes && myRes.id) {
          owned = myRes;
        }
      } catch {}

      if (!owned) {
        const cRes = await apiClient.get("/clinics/").catch(() => []);
        const cList = cRes.results || cRes || [];
        owned = cList.find((c) => c.owner_email === user?.email || c.owner === user?.id) || null;
      }

      setClinic(owned);

      if (owned) {
        setGallery(Array.isArray(owned.gallery) ? owned.gallery : []);
        setClinicEditForm({
          name: owned.name || "",
          city: owned.city || "",
          address: owned.address || "",
          phone: owned.phone || "",
          email: owned.email || "",
          logo_url: owned.logo_url || "",
          description: owned.description || "",
          opening_hours: owned.opening_hours || "Open 24/7",
          emergency_contact: owned.emergency_contact || "",
          website: owned.website || "",
        });
      } else {
        setGallery([]);
      }

      // Only load full management datasets if clinic is verified
      if (owned && owned.verification_status === "VERIFIED") {
        const [dRes, deptRes, specRes, aptRes, reqRes, servRes] = await Promise.all([
          apiClient.get("/doctors/"),
          apiClient.get("/clinics/departments/"),
          apiClient.get("/doctors/specializations/"),
          apiClient.get("/appointments/"),
          apiClient.get("/doctors/requests/").catch(() => []),
          apiClient.get(`/clinics/${owned.id}/services/`).catch(() => []),
        ]);

        const dList = dRes.results || dRes || [];
        const deptList = deptRes.results || deptRes || [];
        const specList = specRes.results || specRes || [];
        const aptList = aptRes.results || aptRes || [];
        const reqList = reqRes.results || reqRes || [];
        const servList = servRes.results || servRes || [];

        setAllDoctors(dList);
        setDepartments(deptList);
        setSpecializations(specList);
        setRequests(reqList);
        setServices(servList);

        // Active doctors with ACCEPTED mapping
        const acceptedDoctorIds = reqList
          .filter((r) => r.clinic?.id === owned.id && r.status === "ACCEPTED")
          .map((r) => r.doctor?.id || r.doctor);

        const myDoctors = dList.filter((d) =>
          acceptedDoctorIds.includes(d.id) ||
          d.doctor_clinics?.some((dc) => (dc.clinic?.id === owned.id || dc.clinic_id === owned.id) && dc.status === "ACCEPTED")
        );
        setAssignedDoctors(myDoctors);
        setAppointments(aptList);
        if (myDoctors.length > 0) {
          setSelectedDoctorId(myDoctors[0].id);
        }
      } else {
        setAssignedDoctors([]);
        setAppointments([]);
        setServices([]);
      }
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClinicProfile = async (e) => {
    e.preventDefault();
    if (!clinic) return;
    setSubmittingClinicEdit(true);
    try {
      const res = await apiClient.patch(`/clinics/${clinic.id}/`, clinicEditForm);
      setClinic(res);
      setEditClinicModalOpen(false);
      setMsg("Clinic profile and branding updated successfully!");
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setError(typeof err === "object" ? Object.values(err).flat().join(" ") : "Failed to update clinic profile.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmittingClinicEdit(false);
    }
  };

  const handleToggleAmenity = async (amenityId) => {
    if (!clinic) return;
    const currentFacilities = Array.isArray(clinic.facilities) ? [...clinic.facilities] : [];
    let updated;
    if (currentFacilities.includes(amenityId)) {
      updated = currentFacilities.filter((f) => f !== amenityId);
    } else {
      updated = [...currentFacilities, amenityId];
    }
    try {
      const res = await apiClient.patch(`/clinics/${clinic.id}/`, { facilities: updated });
      setClinic(res);
      setMsg(`Facility updated successfully!`);
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setError("Failed to update clinic facilities.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Gallery Photo Handlers
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPhotoForm((prev) => ({ ...prev, image_url: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddPhoto = () => {
    setEditingPhotoId(null);
    setUploadMode("file");
    setPhotoForm({
      image_url: "",
      category: "Reception & Front Desk",
      title: "",
      description: "",
      is_featured: false,
    });
    setPhotoModalOpen(true);
  };

  const handleOpenEditPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setUploadMode(photo.image_url?.startsWith("data:") ? "file" : "url");
    setPhotoForm({
      image_url: photo.image_url || "",
      category: photo.category || "Reception & Front Desk",
      title: photo.title || "",
      description: photo.description || "",
      is_featured: photo.is_featured ?? false,
    });
    setPhotoModalOpen(true);
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!clinic) return;
    if (!photoForm.image_url) {
      setError("Please choose or upload an image.");
      return;
    }
    if (!photoForm.title?.trim()) {
      setError("Please provide a photo title.");
      return;
    }

    setSubmittingPhoto(true);
    try {
      let updatedGallery;
      if (editingPhotoId) {
        updatedGallery = gallery.map((item) => {
          if (item.id === editingPhotoId) {
            return {
              ...item,
              image_url: photoForm.image_url,
              category: photoForm.category,
              title: photoForm.title.trim(),
              description: photoForm.description?.trim() || "",
              is_featured: photoForm.is_featured,
            };
          }
          return photoForm.is_featured ? { ...item, is_featured: false } : item;
        });
      } else {
        const newPhotoItem = {
          id: `photo-${Date.now()}`,
          image_url: photoForm.image_url,
          category: photoForm.category,
          title: photoForm.title.trim(),
          description: photoForm.description?.trim() || "",
          is_featured: photoForm.is_featured,
        };
        const currentList = photoForm.is_featured
          ? gallery.map((g) => ({ ...g, is_featured: false }))
          : [...gallery];
        updatedGallery = [newPhotoItem, ...currentList];
      }

      const res = await apiClient.patch(`/clinics/${clinic.id}/`, { gallery: updatedGallery });
      setClinic(res);
      setGallery(res.gallery || updatedGallery);
      setPhotoModalOpen(false);
      setMsg(editingPhotoId ? "Clinic photo updated successfully!" : "New clinic photo added to gallery!");
      setTimeout(() => setMsg(""), 3500);
    } catch (err) {
      setError(typeof err === "object" ? Object.values(err).flat().join(" ") : "Failed to save photo.");
      setTimeout(() => setError(""), 3500);
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!clinic) return;
    const confirmDelete = window.confirm("Are you sure you want to remove this photo from your gallery?");
    if (!confirmDelete) return;

    try {
      const updatedGallery = gallery.filter((p) => p.id !== photoId);
      const res = await apiClient.patch(`/clinics/${clinic.id}/`, { gallery: updatedGallery });
      setClinic(res);
      setGallery(res.gallery || updatedGallery);
      setMsg("Photo removed from gallery.");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setError("Failed to delete photo.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleToggleFeaturedPhoto = async (photoId) => {
    if (!clinic) return;
    try {
      const updatedGallery = gallery.map((item) => {
        if (item.id === photoId) {
          return { ...item, is_featured: !item.is_featured };
        }
        return { ...item, is_featured: false };
      });
      const res = await apiClient.patch(`/clinics/${clinic.id}/`, { gallery: updatedGallery });
      setClinic(res);
      setGallery(res.gallery || updatedGallery);
      setMsg("Cover photo updated!");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setError("Failed to update cover photo.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleLoadSampleGallery = async () => {
    if (!clinic) return;
    const confirmLoad = window.confirm("Load sample high-resolution clinic photos (Reception, Lab, Chambers, Lounge)? You can customize or delete them anytime.");
    if (!confirmLoad) return;

    try {
      const res = await apiClient.patch(`/clinics/${clinic.id}/`, { gallery: SAMPLE_CLINIC_PHOTOS });
      setClinic(res);
      setGallery(res.gallery || SAMPLE_CLINIC_PHOTOS);
      setMsg("Sample clinic tour photos loaded successfully!");
      setTimeout(() => setMsg(""), 3500);
    } catch {
      setError("Failed to load sample photos.");
      setTimeout(() => setError(""), 3500);
    }
  };

  const handleOpenAddService = (preset = null) => {
    setEditingServiceId(null);
    if (preset) {
      setServiceForm({
        name: preset.name,
        department_id: "",
        fee: preset.fee,
        duration_minutes: preset.duration_minutes,
        preparation_instructions: preset.preparation_instructions,
        description: preset.description,
        is_available: true,
      });
    } else {
      setServiceForm({
        name: "",
        department_id: "",
        fee: "",
        duration_minutes: 15,
        preparation_instructions: "",
        description: "",
        is_available: true,
      });
    }
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name || "",
      department_id: service.department || "",
      fee: service.fee || "",
      duration_minutes: service.duration_minutes || 15,
      preparation_instructions: service.preparation_instructions || "",
      description: service.description || "",
      is_available: service.is_available ?? true,
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!clinic) return;
    if (!serviceForm.name?.trim()) {
      setError("Service name is required.");
      return;
    }
    setSubmittingService(true);
    try {
      const payload = {
        name: serviceForm.name.trim(),
        department: serviceForm.department_id || null,
        fee: parseFloat(serviceForm.fee) || 0,
        duration_minutes: parseInt(serviceForm.duration_minutes, 10) || 15,
        preparation_instructions: serviceForm.preparation_instructions || "",
        description: serviceForm.description || "",
        is_available: serviceForm.is_available,
      };

      if (editingServiceId) {
        const updated = await apiClient.patch(`/clinics/${clinic.id}/services/${editingServiceId}/`, payload);
        setServices((prev) => prev.map((s) => (s.id === editingServiceId ? updated : s)));
        setMsg(`Service "${updated.name}" updated successfully!`);
      } else {
        const created = await apiClient.post(`/clinics/${clinic.id}/services/`, payload);
        setServices((prev) => [created, ...prev]);
        setMsg(`Service "${created.name}" created successfully!`);
      }
      setServiceModalOpen(false);
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setError(typeof err === "object" ? Object.values(err).flat().join(" ") : "Failed to save service.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmittingService(false);
    }
  };

  const handleToggleServiceAvailability = async (service) => {
    if (!clinic) return;
    try {
      const newStatus = !service.is_available;
      const updated = await apiClient.patch(`/clinics/${clinic.id}/services/${service.id}/`, {
        is_available: newStatus,
      });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      setMsg(`"${service.name}" marked as ${newStatus ? "Available" : "Unavailable"}.`);
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setError("Failed to toggle service status.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!clinic || !window.confirm("Are you sure you want to remove this clinical service?")) return;
    try {
      await apiClient.delete(`/clinics/${clinic.id}/services/${serviceId}/`);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      setMsg("Clinical service deleted successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setError("Failed to delete service.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleLoadDefaultDiagnosticCatalog = async () => {
    if (!clinic) return;
    setSubmittingService(true);
    try {
      const added = [];
      for (const preset of SERVICE_PRESETS) {
        // avoid duplicating if already exists by exact name
        if (!services.some((s) => s.name.toLowerCase() === preset.name.toLowerCase())) {
          const res = await apiClient.post(`/clinics/${clinic.id}/services/`, {
            name: preset.name,
            department: null,
            fee: parseFloat(preset.fee) || 0,
            duration_minutes: preset.duration_minutes || 15,
            preparation_instructions: preset.preparation_instructions || "",
            description: preset.description || "",
            is_available: true,
          });
          added.push(res);
        }
      }
      if (added.length > 0) {
        setServices((prev) => [...added, ...prev]);
        setMsg(`Successfully loaded ${added.length} standard diagnostic services into your catalog!`);
      } else {
        setMsg("Default diagnostic catalog is already loaded.");
      }
      setTimeout(() => setMsg(""), 4000);
    } catch {
      setError("Failed to load diagnostic catalog.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSubmittingService(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const fetchReceptionChamberSession = async () => {
    if (!clinic || !selectedDoctorId) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(
        `/doctors/chamber-session/?doctor_id=${selectedDoctorId}&clinic_id=${clinic.id}&date=${todayStr}`
      );
      setChamberSession(res);
    } catch {}
  };

  useEffect(() => {
    if (clinic && selectedDoctorId) {
      fetchReceptionChamberSession();
    }
  }, [clinic, selectedDoctorId]);

  const handleReceptionChamberAction = async (action, newStatus = null, targetSerial = null) => {
    if (!clinic || !selectedDoctorId) return;
    setUpdatingChamber(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        clinic_id: clinic.id,
        action: action,
      };
      if (newStatus) payload.status = newStatus;
      if (targetSerial !== null) payload.current_serial = targetSerial;

      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      showMsg(
        action === "NEXT_SERIAL"
          ? `Reception advanced queue to Serial #${res.current_serial}!`
          : action === "SKIP_SERIAL"
          ? `Serial held. Advanced to #${res.current_serial}!`
          : action === "RECALL_SERIAL"
          ? `Recalled Serial #${res.current_serial} into chamber!`
          : action === "RESET"
          ? "Queue reset to Serial #0."
          : `Doctor chamber status set to ${res.status}`
      );
    } catch {
      showErr("Failed to update doctor chamber session.");
    } finally {
      setUpdatingChamber(false);
    }
  };

  const handleBroadcastReceptionDelay = async (e) => {
    e.preventDefault();
    if (!clinic || !selectedDoctorId) return;
    setBroadcastingDelay(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        clinic_id: clinic.id,
        action: "UPDATE_STATUS",
        delay_minutes: parseInt(receptionDelayMins, 10) || 0,
        announcement_note: receptionNotice,
      };
      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      setDelayModalOpen(false);
      showMsg("Notice & Delay broadcasted to patient waiting displays!");
    } catch {
      showErr("Failed to broadcast delay notice.");
    } finally {
      setBroadcastingDelay(false);
    }
  };

  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    if (!clinic) return showErr("No clinic registered.");
    if (!walkInForm.doctor_id || !walkInForm.walk_in_name) {
      return showErr("Please enter Patient Name and choose a Doctor.");
    }
    setSubmittingWalkIn(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const currentTime = walkInForm.appointment_time || new Date().toTimeString().split(" ")[0].slice(0, 5);

      const payload = {
        clinic_id: clinic.id,
        doctor_id: walkInForm.doctor_id,
        appointment_date: todayStr,
        appointment_time: currentTime,
        problem_description: walkInForm.problem_description || "Walk-in patient registration",
        is_walk_in: true,
        walk_in_name: walkInForm.walk_in_name,
        walk_in_phone: walkInForm.walk_in_phone || "01700000000",
      };

      const res = await apiClient.post("/appointments/", payload);
      setWalkInModalOpen(false);
      setWalkInForm({
        walk_in_name: "",
        walk_in_phone: "",
        doctor_id: assignedDoctors.length > 0 ? assignedDoctors[0].id : "",
        appointment_time: "",
        problem_description: "",
      });
      loadData();
      fetchReceptionChamberSession();
      setPrintTokenData(res);
      showMsg(`Walk-in Serial #${res.serial_number} confirmed! Cash recorded.`);
    } catch (err) {
      showErr(err?.detail || (typeof err === "object" ? Object.values(err).flat().join(" ") : "Failed to register walk-in patient."));
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const handleCashCheckIn = async (appointmentId) => {
    setCheckingInId(appointmentId);
    try {
      const res = await apiClient.post(`/appointments/${appointmentId}/checkin/`);
      loadData();
      showMsg(`Appointment Serial #${res.serial_number} marked as Paid (Cash) & Checked-in!`);
    } catch {
      showErr("Failed to check-in appointment.");
    } finally {
      setCheckingInId(null);
    }
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const showErr = (e) => { setError(e); setTimeout(() => setError(""), 5000); };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    if (!newClinic.certificate_url) return showErr("Clinic Registration Certificate URL is required.");
    setMsg(""); setError("");
    try {
      const payload = { ...newClinic };
      if (!payload.latitude) delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;
      await apiClient.post("/clinics/", payload);
      showMsg("Clinic registered! Awaiting Admin approval.");
      setNewClinic({ name: "", address: "", city: "", phone: "", email: "", subscription_plan: "FREE", latitude: "", longitude: "", certificate_url: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.detail || Object.values(err).flat().join(" ") || "Failed to create clinic.");
      else showErr(err || "Failed to create clinic.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!clinic) return showErr("You must create a clinic first.");
    if (clinic.verification_status !== "VERIFIED") return showErr("Your clinic registration is pending Admin approval.");
    if (!inviteForm.doctor_id || !inviteForm.consultation_fee) return;

    setMsg(""); setError("");
    try {
      await apiClient.post("/doctors/requests/create/", {
        doctor_id: inviteForm.doctor_id,
        department_id: inviteForm.department_id || null,
        consultation_fee: parseFloat(inviteForm.consultation_fee),
        room_number: inviteForm.room_number || "",
      });
      showMsg("Service request sent to doctor! Waiting for doctor's acceptance.");
      setInviteForm({ doctor_id: "", department_id: "", consultation_fee: "", room_number: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.detail || Object.values(err).flat().join(" "));
      else showErr("Failed to send request to doctor.");
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    setMsg(""); setError("");
    try {
      await apiClient.patch(`/doctors/requests/${requestId}/respond/`, { action });
      showMsg(`Request ${action === "ACCEPT" ? "accepted" : "rejected"}.`);
      loadData();
    } catch {
      showErr("Failed to respond to request.");
    }
  };

  const handleLinkDept = async (e) => {
    e.preventDefault();
    if (!clinic || !clinicDeptForm.department_id) return;
    if (clinic.verification_status !== "VERIFIED") return showErr("Your clinic is pending Admin approval.");
    setMsg(""); setError("");
    try {
      await apiClient.post(`/clinics/${clinic.id}/departments/`, { department_id: clinicDeptForm.department_id });
      showMsg("Department linked to your clinic.");
      setClinicDeptForm({ department_id: "" });
      loadData();
    } catch { showErr("Failed to link department."); }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    if (!newSpec.name) return;
    setMsg(""); setError("");
    try {
      await apiClient.post("/doctors/specializations/", newSpec);
      showMsg("Specialization created!");
      setNewSpec({ name: "", description: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.name || Object.values(err).flat().join(" "));
      else showErr(err || "Specialization name already exists.");
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <TrendingUp size={16} /> },
    { key: "chamber", label: "Live Reception Queue & TV", icon: <Tv size={16} />, badge: "Live", badgeClass: "badge-error animate-pulse text-white" },
    { key: "clinic", label: "My Clinic", icon: <Building2 size={16} /> },
    { key: "doctors", label: "Doctors & Requests", icon: <Stethoscope size={16} />, count: assignedDoctors.length + requests.length },
    { key: "appointments", label: "Appointments", icon: <Calendar size={16} />, count: appointments.length },
    { key: "taxonomy", label: "Specializations", icon: <Award size={16} /> },
  ];


  const pendingIncomingRequests = requests.filter(r => r.status === "PENDING_CLINIC_APPROVAL");
  const pendingOutgoingRequests = requests.filter(r => r.status === "PENDING_DOCTOR_APPROVAL");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm text-base-content/60 font-medium">Loading Clinic Administrator Portal...</p>
      </div>
    );
  }

  // If clinic is not registered OR not verified, render the guided Onboarding Flow
  if (!clinic || clinic.verification_status !== "VERIFIED") {
    return (
      <ClinicAdminOnboarding
        clinic={clinic}
        onClinicUpdated={loadData}
        onStatusCheck={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Dark Gradient Hero Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="badge badge-success badge-sm gap-1.5 font-bold shadow-sm py-2 px-3">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Active Facility
              </span>
              <span className="text-xs text-indigo-200/70 font-mono">
                Reg: {clinic?.id ? clinic.id.slice(0, 13).toUpperCase() : "BD-MED-9942"}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="text-primary-focus text-emerald-400 w-8 h-8" />
              <span>{clinic?.name || "Clinic Administration Portal"}</span>
            </h1>
            
            <p className="text-xs md:text-sm text-indigo-200/80 flex items-center gap-2 flex-wrap">
              <MapPin size={14} className="text-emerald-400 shrink-0" />
              <span>{clinic ? `${clinic.address}, ${clinic.city}` : "Clinic Administrative Workspace"}</span>
              <span className="text-indigo-400/50">•</span>
              <span className="text-indigo-200/90 font-medium">
                Today&apos;s Load: <strong className="text-white">{appointments.length} Patients</strong> Queue • <strong className="text-white">{assignedDoctors.length} Doctors</strong> Active
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            {clinic?.id && (
              <a
                href={`/clinics/${clinic.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm gap-1.5 font-bold"
              >
                <span>Live Public Page</span>
                <ExternalLink size={14} />
              </a>
            )}
            <div className="badge badge-primary badge-lg py-3 px-4 font-black uppercase tracking-wider text-xs border border-primary/30">
              CLINIC ADMIN
            </div>
          </div>
        </div>
      </div>

      {/* Admin Approval Banner for Clinic */}
      {clinic && clinic.verification_status !== "VERIFIED" && (
        <div className={`p-5 rounded-3xl border flex items-start gap-4 ${
          clinic.verification_status === "REJECTED" ? "bg-error/15 border-error/30 text-error-content" : "bg-warning/15 border-warning/30 text-warning-content"
        }`}>
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">
              {clinic.verification_status === "REJECTED" ? "Clinic Registration Rejected" : "Clinic Registration Pending Admin Verification"}
            </h3>
            <p className="text-xs mt-1">
              {clinic.verification_status === "REJECTED"
                ? "Your registration certificate was rejected by platform Admin. Please update your certificate URL."
                : "Your registration certificate has been submitted and is currently PENDING approval from platform Admin. You can invite doctors and offer services once approved."}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {msg && <div className="alert alert-success text-sm py-3 px-4 flex items-center gap-2 shadow-sm rounded-2xl"><CheckCircle2 size={18} /><span>{msg}</span></div>}
      {error && <div className="alert alert-error text-sm py-3 px-4 flex items-center gap-2 shadow-sm rounded-2xl"><AlertCircle size={18} /><span>{error}</span></div>}

      {/* Navigation Tabs with Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setMsg(""); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border cursor-pointer ${
              activeTab === t.key
                ? "bg-primary text-primary-content border-primary shadow-md"
                : "bg-base-100 border-base-200 text-base-content/70 hover:border-primary/40 hover:text-base-content"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.badge && (
              <span className={`badge badge-xs px-1.5 py-0.5 font-extrabold uppercase ${t.badgeClass || "badge-primary"}`}>
                {t.badge}
              </span>
            )}
            {typeof t.count === "number" && t.count > 0 && (
              <span className={`badge badge-sm font-bold ${activeTab === t.key ? "bg-white/20 text-white" : "badge-neutral"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "My Clinic", value: clinic ? 1 : 0, icon: <Building2 size={24} />, color: "primary" },
              { label: "Active Doctors", value: assignedDoctors.length, icon: <Stethoscope size={24} />, color: "secondary" },
              { label: "Pending Doctor Requests", value: pendingIncomingRequests.length, icon: <Send size={24} />, color: "warning" },
              { label: "Appointments", value: appointments.length, icon: <Calendar size={24} />, color: "accent" },
            ].map((s) => (
              <div key={s.label} className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
                <div className={`p-3 bg-${s.color}/10 rounded-2xl text-${s.color}`}>{s.icon}</div>
                <div>
                  <div className="text-xs text-base-content/60 font-medium">{s.label}</div>
                  <div className="text-2xl font-extrabold text-base-content">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {clinic ? (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                  <Building2 className="text-primary" /> {clinic.name}
                </h2>
                <span className={`badge ${
                  clinic.verification_status === "VERIFIED" ? "badge-success" :
                  clinic.verification_status === "REJECTED" ? "badge-error" : "badge-warning"
                } badge-soft font-bold`}>{clinic.verification_status}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-base-content/70"><MapPin size={15} className="text-primary" /> {clinic.address}, {clinic.city}</div>
                <div className="flex items-center gap-2 text-base-content/70"><Users size={15} className="text-primary" /> {assignedDoctors.length} active doctor(s)</div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-warning/10 border border-warning/30 rounded-3xl flex items-start gap-4">
              <Info className="text-warning shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Clinic Registered</h3>
                <p className="text-sm text-base-content/70 mt-1">Go to <strong>My Clinic</strong> tab to register your clinic with certificate proof.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== LIVE RECEPTION QUEUE & TV TAB ===== */}
      {activeTab === "chamber" && (
        <div className="space-y-5">
          {!clinic ? (
            <div className="p-6 bg-warning/10 border border-warning/30 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="text-warning shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Clinic Registered</h3>
                <p className="text-sm text-base-content/70 mt-1">Register your clinic first to manage live queue sessions.</p>
              </div>
            </div>
          ) : assignedDoctors.length === 0 ? (
            <div className="p-6 bg-info/10 border border-info/30 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="text-info shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Active Doctors</h3>
                <p className="text-sm text-base-content/70 mt-1">Invite and get at least one doctor accepted before managing live queues.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Doctor Selector + TV Link */}
              <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Tv className="text-primary shrink-0" size={22} />
                  <div>
                    <div className="font-extrabold text-base-content text-base">Live Reception Queue Control</div>
                    <div className="text-xs text-base-content/60">Select a doctor to manage their today's queue session</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => { setSelectedDoctorId(e.target.value); setChamberSession(null); }}
                    className="select select-bordered select-sm w-full sm:w-56"
                  >
                    {assignedDoctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setWalkInForm(prev => ({ ...prev, doctor_id: selectedDoctorId || (assignedDoctors[0]?.id || "") }));
                      setWalkInModalOpen(true);
                    }}
                    className="btn btn-primary btn-sm gap-2 shrink-0 shadow-md font-bold"
                    title="Register walk-in counter patient"
                  >
                    <UserPlus size={15} /> + Walk-in Token
                  </button>
                  {selectedDoctorId && clinic && (
                    <a
                      href={`/queue-display/${clinic.id}/${selectedDoctorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm gap-2 shrink-0"
                    >
                      <Tv size={14} /> Open TV Screen ↗
                    </a>
                  )}
                  <button
                    onClick={fetchReceptionChamberSession}
                    className="btn btn-ghost btn-sm gap-2 shrink-0"
                    title="Refresh session data"
                  >
                    <RotateCcw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* Live Session Metrics */}
              {chamberSession ? (
                <>
                  {/* Delay/Announcement Notice */}
                  {(chamberSession.delay_minutes > 0 || chamberSession.announcement_note) && (
                    <div className="p-4 bg-warning/15 border border-warning/40 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-warning shrink-0 mt-0.5" size={18} />
                      <div className="flex-1 text-sm">
                        {chamberSession.delay_minutes > 0 && (
                          <span className="font-bold text-warning-content">⏱ +{chamberSession.delay_minutes} min delay broadcast. </span>
                        )}
                        {chamberSession.announcement_note && (
                          <span className="text-base-content/80">{chamberSession.announcement_note}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Now Serving", value: `#${chamberSession.current_serial}`, color: "primary", icon: <Play size={20} /> },
                      { label: "Total Serials", value: chamberSession.total_serials, color: "secondary", icon: <Users size={20} /> },
                      { label: "Status", value: chamberSession.status?.replace("_", " "), color: chamberSession.status === "IN_CHAMBER" ? "success" : chamberSession.status === "PRAYER_BREAK" ? "warning" : "info", icon: <Clock size={20} /> },
                      { label: "Room", value: chamberSession.room_number || "—", color: "accent", icon: <Navigation size={20} /> },
                    ].map((s) => (
                      <div key={s.label} className="p-4 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
                        <div className={`p-2 bg-${s.color}/10 rounded-xl text-${s.color}`}>{s.icon}</div>
                        <div>
                          <div className="text-xs text-base-content/60 font-medium">{s.label}</div>
                          <div className="text-xl font-extrabold text-base-content">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skipped Serials */}
                  {chamberSession.skipped_serials?.length > 0 && (
                    <div className="bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
                      <div className="text-xs font-bold text-base-content/70 mb-2 flex items-center gap-2">
                        <Pause size={14} className="text-warning" /> Held / Skipped Serials — Click to Recall
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {chamberSession.skipped_serials.map((sn) => (
                          <button
                            key={sn}
                            onClick={() => handleReceptionChamberAction("RECALL_SERIAL", null, sn)}
                            disabled={updatingChamber}
                            className="badge badge-warning badge-lg font-bold cursor-pointer hover:badge-error transition-all"
                            title={`Recall Serial #${sn} into chamber`}
                          >
                            #{sn} Recall
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Queue Action Buttons */}
                  <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md space-y-4">
                    <div className="text-sm font-extrabold text-base-content border-b border-base-200 pb-2">Queue Actions</div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleReceptionChamberAction("NEXT_SERIAL")}
                        disabled={updatingChamber}
                        className="btn btn-primary gap-2"
                      >
                        <FastForward size={16} /> Call Next
                      </button>
                      <button
                        onClick={() => handleReceptionChamberAction("SKIP_SERIAL")}
                        disabled={updatingChamber}
                        className="btn btn-warning gap-2"
                      >
                        <Pause size={16} /> Skip &amp; Hold
                      </button>
                      <button
                        onClick={() => handleReceptionChamberAction("RESET")}
                        disabled={updatingChamber}
                        className="btn btn-ghost btn-outline gap-2"
                      >
                        <RotateCcw size={16} /> Reset Queue
                      </button>
                    </div>

                    <div className="text-sm font-extrabold text-base-content border-b border-base-200 pb-2 pt-2">Doctor Status</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "🏥 In Chamber", status: "IN_CHAMBER", cls: "btn-success" },
                        { label: "🕌 Namaz Break", status: "PRAYER_BREAK", cls: "btn-warning" },
                        { label: "🚗 In Transit", status: "IN_TRANSIT", cls: "btn-info" },
                        { label: "🚨 Emergency", status: "EMERGENCY", cls: "btn-error" },
                        { label: "⏸ Pause", status: "PAUSED", cls: "btn-ghost btn-outline" },
                        { label: "✅ End Session", status: "COMPLETED", cls: "btn-neutral" },
                      ].map((b) => (
                        <button
                          key={b.status}
                          onClick={() => handleReceptionChamberAction("UPDATE_STATUS", b.status)}
                          disabled={updatingChamber || chamberSession.status === b.status}
                          className={`btn btn-sm gap-1 ${b.cls} ${chamberSession.status === b.status ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => setDelayModalOpen(true)}
                        className="btn btn-outline btn-sm gap-2"
                      >
                        <AlertTriangle size={14} /> Broadcast Delay / Notice
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-base-100 border border-base-200 rounded-3xl p-10 text-center space-y-3">
                  <Tv size={40} className="mx-auto text-base-content/20" />
                  <div className="text-sm text-base-content/60">No active queue session found for today.</div>
                  <button
                    onClick={() => handleReceptionChamberAction("UPDATE_STATUS", "NOT_STARTED")}
                    disabled={updatingChamber}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Play size={14} /> Start Today&apos;s Session
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== BROADCAST DELAY MODAL ===== */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <AlertTriangle className="text-warning" size={20} /> Broadcast Delay &amp; Notice
              </h3>
              <button onClick={() => setDelayModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <p className="text-xs text-base-content/60">
              This will immediately push a delay notice to all patient waiting room displays for this doctor&apos;s queue.
            </p>
            <form onSubmit={handleBroadcastReceptionDelay} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Delay (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={receptionDelayMins}
                  onChange={(e) => setReceptionDelayMins(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">Announcement Message (optional)</label>
                <textarea
                  value={receptionNotice}
                  onChange={(e) => setReceptionNotice(e.target.value)}
                  className="textarea textarea-bordered w-full"
                  placeholder="e.g. Doctor is in surgery, please wait..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={broadcastingDelay} className="btn btn-warning flex-1 gap-2">
                  {broadcastingDelay ? <span className="loading loading-spinner loading-xs" /> : <AlertTriangle size={15} />}
                  Broadcast Now
                </button>
                <button type="button" onClick={() => setDelayModalOpen(false)} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MY CLINIC TAB: DECORATION & SERVICES SUITE ===== */}
      {activeTab === "clinic" && (
        <div className="space-y-8">
          {/* 1. Clinic Branding & Profile Card */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-base-200">
              <div className="flex items-center gap-4">
                {clinic?.logo_url ? (
                  <img
                    src={clinic.logo_url}
                    alt={clinic.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-base-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-sm shrink-0">
                    {clinic?.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black text-base-content">{clinic?.name}</h2>
                    <span className="badge badge-success badge-sm font-bold gap-1 py-1 px-2.5">
                      <CheckCircle2 size={12} /> VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary shrink-0" /> {clinic?.address}, {clinic?.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {clinic?.opening_hours ? clinic.opening_hours : "Open 24/7 (Emergency & Pharmacy)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setEditClinicModalOpen(true)}
                  className="btn btn-primary btn-sm gap-2 shadow-sm font-bold"
                >
                  <Edit3 size={15} /> Edit Clinic Details
                </button>
                <a
                  href={`/clinics/${clinic?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm gap-1.5 font-bold"
                >
                  <span>Public View</span> <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Care Mission Statement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                  About Clinic &amp; Care Mission
                </h3>
                <button
                  type="button"
                  onClick={() => setEditClinicModalOpen(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Edit3 size={12} /> Add / Edit Mission Statement
                </button>
              </div>
              <p className="text-sm text-base-content/80 leading-relaxed bg-base-200/40 p-4 rounded-2xl border border-base-200">
                {clinic?.description || "Dedicated to providing accessible, high-quality healthcare and advanced outpatient diagnostic services with compassion, state-of-the-art laboratory testing, and distinguished medical specialists."}
              </p>
            </div>

            {/* 4-Card Color-Tinted Contact & Ambulance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                  <PhoneCall size={14} /> General Helpline
                </div>
                <div className="font-extrabold text-sm text-base-content tracking-tight">
                  {clinic?.phone || "01887530601"}
                </div>
              </div>

              <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold">
                  <Globe size={14} /> Official Email
                </div>
                <div className="font-bold text-sm text-base-content truncate">
                  {clinic?.email || "admin@smartclinic.com"}
                </div>
              </div>

              <div className="p-3.5 bg-sky-50/60 dark:bg-sky-950/30 rounded-2xl border border-sky-200/60 dark:border-sky-900/40 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold">
                  <ExternalLink size={14} /> Official Website
                </div>
                <div className="font-bold text-sm truncate">
                  {clinic?.website ? (
                    <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {clinic.website}
                    </a>
                  ) : (
                    <span className="text-base-content/40 italic font-normal">Not configured</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col justify-between space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Activity size={14} /> Emergency Ambulance
                </div>
                <div className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                  {clinic?.emergency_contact || "+880 1700 - 000000"}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Clinical Services & Diagnostics Suite (Core Feature) */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="text-primary" size={24} />
                  <h2 className="text-xl font-black text-base-content">
                    Clinical Services &amp; Diagnostic Tests
                  </h2>
                  <span className="badge badge-primary badge-sm font-bold">{services.length}</span>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  Configure clinical tests, packages, and treatments offered with BDT pricing and prep instructions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDefaultDiagnosticCatalog}
                  disabled={submittingService}
                  className="btn btn-outline btn-primary btn-sm gap-1.5 font-bold"
                  title="Bulk load standard diagnostic tests with pre-set BDT fees"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Load Default Bangladesh Diagnostic Catalog</span>
                </button>
                <button
                  onClick={() => handleOpenAddService()}
                  className="btn btn-primary btn-sm gap-2 shadow-md font-bold"
                >
                  <Plus size={16} /> Add Clinical Service
                </button>
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-2 bg-base-200/30 p-4 rounded-2xl border border-base-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-base-content/70">
                <Sparkles size={14} className="text-amber-500" />
                <span>1-Click Popular Service Presets (Click to Add):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenAddService(preset)}
                    className="btn btn-xs btn-outline hover:btn-primary gap-1 font-semibold rounded-lg"
                  >
                    <span>+ {preset.name}</span>
                    <span className="opacity-70 font-mono">৳{preset.fee}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Services List Table / Cards */}
            {services.length === 0 ? (
              <div className="text-center py-12 px-4 bg-base-200/20 rounded-3xl border border-base-200 space-y-3">
                <Activity size={40} className="mx-auto text-base-content/20" />
                <div className="font-bold text-base-content text-base">No clinical services added yet</div>
                <p className="text-xs text-base-content/60 max-w-md mx-auto">
                  Use the 1-click presets above, click &quot;Add Clinical Service&quot;, or bulk-load the standard Bangladesh diagnostic catalog to showcase your lab investigations, imaging tests, and outpatient care.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadDefaultDiagnosticCatalog}
                    disabled={submittingService}
                    className="btn btn-primary btn-sm gap-2 font-bold shadow-md"
                  >
                    <Sparkles size={14} /> Load Default Bangladesh Diagnostic Catalog
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200 text-xs text-base-content/60 uppercase">
                      <th>Service Name</th>
                      <th>Fee (BDT)</th>
                      <th>Duration</th>
                      <th>Preparation / Patient Instructions</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-base-200/40 border-b border-base-200">
                        <td>
                          <div className="font-extrabold text-sm text-base-content">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-base-content/60 line-clamp-1">{s.description}</div>
                          )}
                          {s.department_name && (
                            <span className="badge badge-ghost badge-xs mt-1 font-semibold">
                              {s.department_name}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="font-black text-sm text-primary font-mono">
                            ৳{parseFloat(s.fee).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-base-content/70 flex items-center gap-1">
                            <Clock size={12} /> {s.duration_minutes} mins
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-base-content/70 italic max-w-xs block truncate">
                            {s.preparation_instructions || "None required"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleServiceAvailability(s)}
                            className={`badge badge-sm font-bold cursor-pointer transition-all ${
                              s.is_available
                                ? "badge-success text-success-content"
                                : "badge-error text-error-content"
                            }`}
                          >
                            {s.is_available ? "Active / Available" : "Unavailable"}
                          </button>
                        </td>
                        <td className="text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(s)}
                            className="btn btn-ghost btn-xs text-primary"
                            title="Edit Service"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(s.id)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete Service"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Visual Gallery & Virtual Tour Showcase */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="text-primary" size={24} />
                  <h2 className="text-xl font-black text-base-content">
                    Clinic Photo Gallery &amp; Virtual Tour
                  </h2>
                  <span className="badge badge-primary badge-sm font-bold">{gallery.length}</span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Upload or link real photos of your reception, chambers, waiting lounges, and labs with descriptions to give patients an inspiring virtual tour.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleGallery}
                  className="btn btn-outline btn-secondary btn-sm gap-1.5 font-bold shadow-xs"
                  title="Load preset high-res clinic photos to get started immediately"
                >
                  <Sparkles size={14} /> Sample Tour Pack
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddPhoto}
                  className="btn btn-primary btn-sm gap-2 shadow-xs font-bold"
                >
                  <Plus size={16} /> Add Photo
                </button>
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="text-center py-12 px-4 bg-base-200/40 rounded-3xl border-2 border-dashed border-base-300 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Camera size={32} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-base text-base-content">No Clinic Photos Uploaded Yet</h3>
                  <p className="text-xs text-base-content/60">
                    Clinics with high-quality photos of their consultation chambers, hygienic waiting rooms, and diagnostic labs attract up to 3x more patient bookings!
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenAddPhoto}
                    className="btn btn-primary btn-sm gap-2 font-bold"
                  >
                    <Upload size={14} /> Upload First Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleGallery}
                    className="btn btn-ghost btn-sm gap-1.5 text-secondary font-bold"
                  >
                    <Sparkles size={14} /> Load Sample Photos
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-base-200/40 rounded-2xl border border-base-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-base-300">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"; }}
                      />
                      {item.is_featured && (
                        <span className="absolute top-2.5 left-2.5 badge badge-warning gap-1 font-bold text-xs shadow-md">
                          <Star size={12} className="fill-current" /> Cover Photo
                        </span>
                      )}
                      <span className="absolute top-2.5 right-2.5 badge badge-neutral/80 backdrop-blur-md text-[11px] font-semibold text-white">
                        {item.category || "Facility"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(item)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
                      >
                        <Eye size={16} /> Click to Preview
                      </button>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-base-content leading-snug">{item.title}</h4>
                        <p className="text-xs text-base-content/70 line-clamp-2 leading-relaxed">
                          {item.description || "No description provided."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-base-200/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedPhoto(item.id)}
                          className={`btn btn-xs gap-1 font-bold ${item.is_featured ? "btn-warning" : "btn-ghost text-base-content/60"}`}
                          title={item.is_featured ? "Remove featured cover status" : "Set as primary clinic cover photo"}
                        >
                          <Star size={12} className={item.is_featured ? "fill-current" : ""} />
                          {item.is_featured ? "Cover" : "Set Cover"}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhoto(item)}
                            className="btn btn-ghost btn-xs text-primary"
                            title="Edit details"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(item.id)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Facilities & Amenities Decorator */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-base-200 pb-3">
              <div>
                <h2 className="text-xl font-black text-base-content flex items-center gap-2">
                  <Building2 className="text-primary" size={22} /> Clinic Facilities &amp; Key Amenities
                </h2>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Click any amenity to enable or disable it for your clinic. Active amenities are highlighted on your public clinic profile for patients.
                </p>
              </div>
              <span className="badge badge-outline text-xs font-bold">
                {Array.isArray(clinic?.facilities) ? clinic.facilities.length : 0} / {POPULAR_AMENITIES.length} Enabled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {POPULAR_AMENITIES.map((am) => {
                const isSelected = Array.isArray(clinic?.facilities) && clinic.facilities.includes(am.id);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => handleToggleAmenity(am.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/30"
                        : "border-base-200 bg-base-100 hover:border-base-300 text-base-content/70 font-medium hover:bg-base-200/40"
                    }`}
                  >
                    <div className="text-2xl mb-2">{am.icon}</div>
                    <div className="text-xs font-bold leading-tight">{am.label}</div>
                    <div className="mt-3 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                      {isSelected ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          ✓ ACTIVE
                        </span>
                      ) : (
                        <span className="text-base-content/40">+ ADD</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Medical Departments & Associated Specialists */}
          <div className="bg-base-100 border border-base-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-base-200 pb-3">
              <div>
                <h2 className="text-xl font-black text-base-content flex items-center gap-2">
                  <Layers className="text-primary" size={22} /> Medical Departments &amp; Specialties
                </h2>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Link medical departments to allow specialist doctors in those disciplines to practice at your clinic.
                </p>
              </div>
              <span className="badge badge-outline text-xs font-bold">
                {clinic?.departments?.length || 0} Departments Active
              </span>
            </div>

            <form onSubmit={handleLinkDept} className="flex flex-col sm:flex-row gap-3">
              <select
                required
                value={clinicDeptForm.department_id}
                onChange={(e) => setClinicDeptForm({ department_id: e.target.value })}
                className="select select-bordered flex-1 rounded-xl"
              >
                <option value="">-- Choose Medical Department to Link --</option>
                {departments
                  .filter((d) => !clinic?.departments?.some((cd) => cd.id === d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
              <button type="submit" className="btn btn-primary gap-2 shrink-0 rounded-xl font-bold">
                <Plus size={16} /> Link Department
              </button>
            </form>

            {clinic?.departments && clinic.departments.length > 0 ? (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {clinic.departments.map((dept) => {
                  const doctorsInDept = assignedDoctors.filter(
                    (d) => d.department === dept.id || d.department_name === dept.name
                  ).length;
                  return (
                    <span
                      key={dept.id}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-base-200/70 border border-base-300 text-xs font-bold text-base-content"
                    >
                      <Stethoscope size={14} className="text-primary shrink-0" />
                      <span>{dept.name}</span>
                      <span className="badge badge-xs badge-neutral font-semibold">
                        {doctorsInDept} {doctorsInDept === 1 ? "Doctor" : "Doctors"}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-base-content/50 italic">
                No medical departments linked yet. Select a department from the dropdown above to link it.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== DOCTORS & REQUESTS TAB ===== */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          {/* Send Invite Form */}
          {clinic && clinic.verification_status === "VERIFIED" && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Send className="text-primary" /> Send Service Request to Doctor
              </h2>
              <p className="text-xs text-base-content/60">Invite a registered, approved doctor to provide services at your clinic. They must accept before becoming active.</p>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Select Doctor *</label>
                    <select required value={inviteForm.doctor_id}
                      onChange={(e) => setInviteForm({ ...inviteForm, doctor_id: e.target.value })}
                      className="select select-bordered w-full">
                      <option value="">-- Choose Doctor --</option>
                      {allDoctors.filter(d => d.verification_status === "VERIFIED").map((d) => (
                        <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.qualification || d.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Consultation Fee ($) *</label>
                    <input type="number" step="0.01" required placeholder="100.00" value={inviteForm.consultation_fee}
                      onChange={(e) => setInviteForm({ ...inviteForm, consultation_fee: e.target.value })}
                      className="input input-bordered w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Department (optional)</label>
                    <select value={inviteForm.department_id}
                      onChange={(e) => setInviteForm({ ...inviteForm, department_id: e.target.value })}
                      className="select select-bordered w-full">
                      <option value="">-- No department --</option>
                      {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Room Number (optional)</label>
                    <input type="text" placeholder="Room 204" value={inviteForm.room_number}
                      onChange={(e) => setInviteForm({ ...inviteForm, room_number: e.target.value })}
                      className="input input-bordered w-full" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full gap-2"><Send size={16} /> Send Service Invite</button>
              </form>
            </div>
          )}

          {/* Incoming Doctor Requests */}
          {pendingIncomingRequests.length > 0 && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Info className="text-warning" /> Incoming Join Requests from Doctors ({pendingIncomingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingIncomingRequests.map((r) => (
                  <div key={r.id} className="p-4 bg-base-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-base-content">Dr. {r.doctor?.full_name}</div>
                      <div className="text-xs text-base-content/60">Proposed Fee: ${r.consultation_fee} · Room: {r.room_number || "N/A"}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRespondRequest(r.id, "ACCEPT")} className="btn btn-success btn-xs text-white">Accept</button>
                      <button onClick={() => handleRespondRequest(r.id, "REJECT")} className="btn btn-error btn-xs text-white">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Doctors */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Stethoscope className="text-primary" /> Active Doctors ({assignedDoctors.length})
            </h2>
            {assignedDoctors.length === 0 ? (
              <div className="text-center py-6 text-xs text-base-content/60">No active doctors linked to your clinic.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignedDoctors.map((d) => (
                  <div key={d.id} className="p-4 bg-base-200/40 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Stethoscope size={18} /></div>
                    <div>
                      <div className="font-bold text-sm text-base-content">Dr. {d.full_name}</div>
                      <div className="text-xs text-base-content/60">{d.qualification}</div>
                      <div className="text-xs text-success font-semibold mt-1">✓ Active Service Agreement</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== APPOINTMENTS TAB ===== */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <span className="font-bold">Clinic Appointments</span>
              <span className="badge badge-primary">{appointments.length}</span>
            </div>

            <button
              onClick={() => {
                setWalkInForm(prev => ({ ...prev, doctor_id: selectedDoctorId || (assignedDoctors[0]?.id || "") }));
                setWalkInModalOpen(true);
              }}
              className="btn btn-primary btn-sm gap-1.5 shadow-md font-bold"
            >
              <UserPlus size={15} /> + New Walk-in Patient
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200 text-base-content/60">
              No appointments found.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-secondary font-black text-xs">
                          Serial #{apt.serial_number || "—"}
                        </span>
                        <div className="font-bold text-base-content">
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </div>
                        {apt.patient?.phone && (
                          <span className="text-xs text-base-content/60">({apt.patient.phone})</span>
                        )}
                        <span className={`badge badge-sm ${
                          apt.status === "CONFIRMED" ? "badge-success badge-soft font-bold" :
                          apt.status === "COMPLETED" ? "badge-info badge-soft font-bold" :
                          apt.status === "CANCELLED" ? "badge-error badge-soft" : "badge-warning badge-soft font-bold"
                        }`}>{apt.status}</span>
                      </div>
                      <div className="text-sm text-base-content/60 flex flex-wrap gap-3 pt-1">
                        <span className="flex items-center gap-1"><Stethoscope size={13} className="text-primary" /> Dr. {apt.doctor?.full_name}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} className="text-primary" /> {apt.appointment_date}</span>
                        <span className="flex items-center gap-1"><Clock size={13} className="text-primary" /> {apt.appointment_time}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      <div className="text-primary font-bold text-lg">৳{apt.amount} BDT</div>
                      <div className="flex items-center gap-2">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => handleCashCheckIn(apt.id)}
                            disabled={checkingInId === apt.id}
                            className="btn btn-success btn-xs text-white font-bold gap-1 shadow-sm"
                            title="Confirm cash paid at counter & check-in patient"
                          >
                            <CreditCard size={12} />
                            {checkingInId === apt.id ? "Checking in..." : "Mark Paid (Cash)"}
                          </button>
                        )}
                        <button
                          onClick={() => setPrintTokenData(apt)}
                          className="btn btn-outline btn-xs gap-1"
                          title="Print thermal token slip"
                        >
                          <Printer size={12} /> Print Token
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SPECIALIZATIONS TAB ===== */}
      {activeTab === "taxonomy" && (
        <div className="space-y-6">
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Award className="text-primary" /> Create Medical Specialization
            </h2>
            <form onSubmit={handleCreateSpec} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Specialization Name *</label>
                <input type="text" required placeholder="e.g. Pediatric Surgery" value={newSpec.name}
                  onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label text-xs font-semibold">Description</label>
                <input type="text" placeholder="Brief description of this specialty" value={newSpec.description}
                  onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })} className="input input-bordered w-full" />
              </div>
              <button type="submit" className="btn btn-secondary w-full gap-2"><Plus size={16} /> Add Specialization</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== WALK-IN PATIENT ENTRY MODAL ===== */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    Walk-in Counter Registration (কাউন্টার সিরিয়াল)
                  </h3>
                  <p className="text-xs text-base-content/60">Issue instant serial token for walk-in patient at clinic counter</p>
                </div>
              </div>
              <button onClick={() => setWalkInModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.walk_in_name}
                    onChange={(e) => setWalkInForm({ ...walkInForm, walk_in_name: e.target.value })}
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. Md. Rafiqul Islam"
                  />
                </div>
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.walk_in_phone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, walk_in_phone: e.target.value })}
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. 01712345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Doctor *</label>
                  <select
                    required
                    value={walkInForm.doctor_id}
                    onChange={(e) => setWalkInForm({ ...walkInForm, doctor_id: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Select Doctor --</option>
                    {assignedDoctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Time Slot (Optional)</label>
                  <input
                    type="time"
                    value={walkInForm.appointment_time}
                    onChange={(e) => setWalkInForm({ ...walkInForm, appointment_time: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">Chief Complaint / Notes (Optional)</label>
                <input
                  type="text"
                  value={walkInForm.problem_description}
                  onChange={(e) => setWalkInForm({ ...walkInForm, problem_description: e.target.value })}
                  className="input input-bordered w-full text-xs"
                  placeholder="e.g. High fever for 3 days, headache"
                />
              </div>

              <div className="p-3 bg-base-200/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-base-content">
                  <span>Payment Mode:</span>
                  <span className="text-success font-black">Cash at Counter (স্বয়ংক্রিয় পরিশোধিত)</span>
                </div>
                <div className="text-[11px] text-base-content/60">
                  Appointment will be immediately confirmed, serial token assigned, and cash transaction recorded.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn btn-primary flex-1 gap-2 font-bold shadow-md"
                >
                  {submittingWalkIn ? <span className="loading loading-spinner loading-xs" /> : <Printer size={16} />}
                  Confirm & Issue Token Slip
                </button>
                <button type="button" onClick={() => setWalkInModalOpen(false)} className="btn btn-ghost flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PRINTABLE THERMAL TOKEN SLIP MODAL ===== */}
      {printTokenData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 print:hidden">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Printer size={15} /> Thermal Token Preview
              </span>
              <button onClick={() => setPrintTokenData(null)} className="btn btn-ghost btn-xs btn-circle">✕</button>
            </div>

            {/* Printable Slip Container */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 font-mono text-xs bg-slate-50">
              <div className="space-y-0.5 border-b border-slate-200 pb-2">
                <div className="font-black text-sm uppercase tracking-wide">{clinic?.name || "Smart Clinic BD"}</div>
                <div className="text-[10px] text-slate-500">{clinic?.address || ""}, {clinic?.city || "Dhaka"}</div>
                <div className="text-[10px] text-slate-500">Phone: {clinic?.phone || "01700-000000"}</div>
              </div>

              <div className="py-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">PATIENT SERIAL TOKEN</div>
                <div className="text-5xl font-black text-emerald-600 my-1">
                  #{printTokenData.serial_number || 1}
                </div>
                <div className="text-[10px] text-slate-400">Date: {printTokenData.appointment_date}</div>
              </div>

              <div className="text-left space-y-1 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{printTokenData.patient?.first_name} {printTokenData.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold">Dr. {printTokenData.doctor?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee:</span>
                  <span className="font-bold text-emerald-600">৳{printTokenData.amount} BDT (PAID)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-bold">{printTokenData.appointment_time}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                Please wait in lobby until your serial is called on the TV screen.
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="btn btn-primary btn-sm flex-1 gap-1.5 font-bold shadow-md"
              >
                <Printer size={15} /> Print Slip
              </button>
              <button
                onClick={() => setPrintTokenData(null)}
                className="btn btn-ghost btn-sm flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT CLINIC PROFILE & BRANDING MODAL ===== */}
      {editClinicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-base-200 my-8">
            <div className="flex items-center justify-between border-b border-base-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    Edit Clinic Profile &amp; Decoration
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Update your clinic identity, operating hours, emergency contact, and branding.
                  </p>
                </div>
              </div>
              <button onClick={() => setEditClinicModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleSaveClinicProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold text-base-content/70">Clinic Official Name *</label>
                  <input
                    type="text"
                    required
                    value={clinicEditForm.name}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, name: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/70">City / Division *</label>
                  <input
                    type="text"
                    required
                    value={clinicEditForm.city}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, city: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">Complete Physical Address *</label>
                <textarea
                  required
                  rows={2}
                  value={clinicEditForm.address}
                  onChange={(e) => setClinicEditForm({ ...clinicEditForm, address: e.target.value })}
                  className="textarea textarea-bordered w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs font-bold text-base-content/70">General Phone</label>
                  <input
                    type="text"
                    value={clinicEditForm.phone}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, phone: e.target.value })}
                    className="input input-bordered w-full text-sm"
                    placeholder="e.g. 01700000000"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/70">Contact Email</label>
                  <input
                    type="email"
                    value={clinicEditForm.email}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, email: e.target.value })}
                    className="input input-bordered w-full text-sm"
                    placeholder="contact@clinic.com"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/70 flex items-center gap-1 text-error">
                    <PhoneCall size={12} /> Emergency Hotline
                  </label>
                  <input
                    type="text"
                    value={clinicEditForm.emergency_contact}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, emergency_contact: e.target.value })}
                    className="input input-bordered w-full text-sm"
                    placeholder="e.g. 01711999999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold text-base-content/70 flex items-center gap-1">
                    <Clock size={12} className="text-primary" /> Operating Hours
                  </label>
                  <input
                    type="text"
                    value={clinicEditForm.opening_hours}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, opening_hours: e.target.value })}
                    className="input input-bordered w-full text-sm"
                    placeholder="e.g. Sat - Thu: 8:00 AM - 10:00 PM"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/70 flex items-center gap-1">
                    <Globe size={12} className="text-primary" /> Official Website
                  </label>
                  <input
                    type="url"
                    value={clinicEditForm.website}
                    onChange={(e) => setClinicEditForm({ ...clinicEditForm, website: e.target.value })}
                    className="input input-bordered w-full text-sm"
                    placeholder="https://yourclinic.com"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">Clinic Logo URL</label>
                <input
                  type="url"
                  value={clinicEditForm.logo_url}
                  onChange={(e) => setClinicEditForm({ ...clinicEditForm, logo_url: e.target.value })}
                  className="input input-bordered w-full text-sm font-mono"
                  placeholder="https://res.cloudinary.com/... or image link"
                />
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">
                  About Clinic &amp; Medical Mission (Public Bio)
                </label>
                <textarea
                  rows={4}
                  value={clinicEditForm.description}
                  onChange={(e) => setClinicEditForm({ ...clinicEditForm, description: e.target.value })}
                  className="textarea textarea-bordered w-full text-sm"
                  placeholder="Describe your clinic's modern facilities, clinical specialties, and patient-centered services..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditClinicModalOpen(false)}
                  className="btn btn-outline flex-1 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClinicEdit}
                  className="btn btn-primary flex-2 font-bold shadow-lg gap-2"
                >
                  {submittingClinicEdit ? <span className="loading loading-spinner loading-xs" /> : <Edit3 size={16} />}
                  Save Clinic Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT CLINICAL SERVICE MODAL ===== */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 border border-base-200 my-8">
            <div className="flex items-center justify-between border-b border-base-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    {editingServiceId ? "Edit Clinical Service" : "Add Clinical Service"}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Specify service name, diagnostic pricing in BDT, and patient prep notes.
                  </p>
                </div>
              </div>
              <button onClick={() => setServiceModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="label text-xs font-bold text-base-content/70">Service / Test Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="input input-bordered w-full text-sm"
                  placeholder="e.g. Ultrasound (USG) Whole Abdomen"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold text-base-content/70">Service Fee (BDT) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-base-content/40">৳</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={serviceForm.fee}
                      onChange={(e) => setServiceForm({ ...serviceForm, fee: e.target.value })}
                      className="input input-bordered w-full pl-8 text-sm font-mono font-bold"
                      placeholder="e.g. 1200"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/70">Estimated Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                    className="input input-bordered w-full text-sm font-mono"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">Department (Optional)</label>
                <select
                  value={serviceForm.department_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, department_id: e.target.value })}
                  className="select select-bordered w-full text-sm"
                >
                  <option value="">-- None / General Facility --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">
                  Preparation / Patient Instructions
                </label>
                <input
                  type="text"
                  value={serviceForm.preparation_instructions}
                  onChange={(e) => setServiceForm({ ...serviceForm, preparation_instructions: e.target.value })}
                  className="input input-bordered w-full text-sm"
                  placeholder="e.g. Overnight 8-hour fasting required; bring prior reports"
                />
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/70">Service Description / Notes</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="textarea textarea-bordered w-full text-sm"
                  placeholder="Additional details about the investigation, equipment, or doctor consultation included..."
                />
              </div>

              <div className="p-3 bg-base-200/50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-base-content">Service Availability Status</div>
                  <div className="text-[11px] text-base-content/60">
                    When active, patients can view this service on your clinic page.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={serviceForm.is_available}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_available: e.target.checked })}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="btn btn-outline flex-1 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="btn btn-primary flex-2 font-bold shadow-lg gap-2"
                >
                  {submittingService ? <span className="loading loading-spinner loading-xs" /> : <Activity size={16} />}
                  {editingServiceId ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT CLINIC PHOTO MODAL ===== */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 border border-base-200 my-8">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    {editingPhotoId ? "Edit Clinic Photo" : "Add Clinic Photo"}
                  </h3>
                  <p className="text-xs text-base-content/60">Showcase your clinic rooms, labs, and amenities</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* Mode Selector: Device File Upload vs Web URL */}
              <div>
                <label className="label text-xs font-bold text-base-content/70">Photo Source</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-base-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`btn btn-sm font-bold ${uploadMode === "file" ? "btn-primary shadow-xs" : "btn-ghost"}`}
                  >
                    <Upload size={14} /> Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("url")}
                    className={`btn btn-sm font-bold ${uploadMode === "url" ? "btn-primary shadow-xs" : "btn-ghost"}`}
                  >
                    <Globe size={14} /> Image Web Link
                  </button>
                </div>
              </div>

              {uploadMode === "file" ? (
                <div>
                  <label className="label text-xs font-bold text-base-content/70">
                    Select Image File (JPG, PNG, WEBP)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="file-input file-input-bordered file-input-primary w-full text-xs rounded-xl"
                  />
                  <span className="text-[11px] text-base-content/50 mt-1 block">
                    Supported up to 10MB. Reads directly and uploads seamlessly.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="label text-xs font-bold text-base-content/70">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required={!photoForm.image_url}
                    value={photoForm.image_url}
                    onChange={(e) => setPhotoForm({ ...photoForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... or cloud storage URL"
                    className="input input-bordered w-full rounded-xl text-sm"
                  />
                </div>
              )}

              {/* Live Preview if image_url exists */}
              {photoForm.image_url && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-base-300 bg-base-200">
                  <img
                    src={photoForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"; }}
                  />
                  <span className="absolute bottom-2 left-2 badge badge-neutral/90 text-xs">
                    Live Preview
                  </span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="label text-xs font-bold text-base-content/70">Facility Area / Category *</label>
                <select
                  value={photoForm.category}
                  onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                  className="select select-bordered w-full rounded-xl text-sm"
                >
                  {GALLERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Caption */}
              <div>
                <label className="label text-xs font-bold text-base-content/70">Photo Title / Caption *</label>
                <input
                  type="text"
                  required
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  placeholder="e.g. Modern Waiting Lounge with AC"
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="label text-xs font-bold text-base-content/70">
                  Detailed Description / Story for Patients
                </label>
                <textarea
                  rows={3}
                  value={photoForm.description}
                  onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                  placeholder="Tell patients about this room, hygiene practices, comfortable seating, modern equipment..."
                  className="textarea textarea-bordered w-full rounded-xl text-sm"
                />
              </div>

              {/* Set as Featured Cover toggle */}
              <label className="label cursor-pointer justify-start gap-3 bg-base-200/50 p-3 rounded-xl border border-base-200">
                <input
                  type="checkbox"
                  checked={photoForm.is_featured}
                  onChange={(e) => setPhotoForm({ ...photoForm, is_featured: e.target.checked })}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <div className="text-xs">
                  <span className="font-bold text-base-content block">Set as Primary Featured Cover</span>
                  <span className="text-base-content/60">This photo will be displayed prominently as hero in your virtual tour.</span>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="btn btn-outline flex-1 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPhoto || !photoForm.image_url || !photoForm.title.trim()}
                  className="btn btn-primary flex-2 rounded-xl shadow-lg font-bold gap-2"
                >
                  {submittingPhoto ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Check size={16} />
                  )}
                  {editingPhotoId ? "Update Photo" : "Add to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PREVIEW LIGHTBOX MODAL IN DASHBOARD ===== */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-base-100 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-base-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black">
              <img
                src={previewPhoto.image_url}
                alt={previewPhoto.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="btn btn-circle btn-sm btn-ghost absolute top-3 right-3 text-white bg-black/60 hover:bg-black/80"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-lg text-base-content">{previewPhoto.title}</h3>
                <span className="badge badge-primary font-bold text-xs">{previewPhoto.category}</span>
              </div>
              <p className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">
                {previewPhoto.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Compliance & Uptime SLA Footer */}
      <div className="border-t border-base-200/80 pt-6 mt-10 pb-4 text-xs text-base-content/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={14} /> HIPAA Compliant Infrastructure
          </span>
          <span className="text-base-content/20">•</span>
          <span className="flex items-center gap-1.5">
            <Lock size={13} /> 256-Bit Encrypted Records
          </span>
          <span className="text-base-content/20">•</span>
          <span className="flex items-center gap-1.5">
            <Award size={14} className="text-primary" /> ISO 27001 Certified Security
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Server size={13} className="text-emerald-500" /> System Status: 99.98% SLA
          </span>
          <span className="text-base-content/20">•</span>
          <span className="flex items-center gap-1.5 text-base-content/70">
            <HeartHandshake size={13} className="text-primary" /> Smart Clinic Enterprise
          </span>
        </div>
      </div>
    </div>
  );
}

