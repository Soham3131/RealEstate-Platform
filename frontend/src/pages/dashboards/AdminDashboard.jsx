import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL, { BACKEND_URL } from "../../apiConfig";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  ShieldAlert,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
  UserPlus,
  ShieldBan,
  ShieldCheck,
  Mail,
  Phone,
  Info,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  TrendingUp,
  Clock,
  MapPin,
  Search,
  Filter,
  X as CloseIcon,
  PlusCircle,
  UserCheck,
  Activity,
  Database,
  Globe,
  ChevronRight,
  Home,
  FileText,
  Edit,
  Save,
  Upload,
  Menu, // Added Menu as per instruction
  Truck,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AnimatedCounter from "../../components/common/AnimatedCounter";
import { usePermissions } from "../../hooks/usePermissions";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [stats, setStats] = useState({
    totalInvestors: 0,
    totalLeads: 0,
    totalUsers: 0,
    totalAgencies: 0, // Added missing totalAgencies
    totalInvestedValue: 0,
    activeListings: 0,
    pendingAgencies: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [moversLeads, setMoversLeads] = useState([]);
  const [moversLoading, setMoversLoading] = useState(false);
  const [leadsAnalytics, setLeadsAnalytics] = useState({
    summary: { totalLeads: 0, contactedLeads: 0, closedLeads: 0, conversionRate: "0%" },
    sourcePerformance: [],
    volumeTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || "stats");
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyFilterStatus, setPropertyFilterStatus] = useState("All");
  const [userFilters, setUserFilters] = useState({
    role: "All Roles",
    status: "All Status",
    search: "",
  });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Responsive UI management
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Management States
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencyDetails, setAgencyDetails] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [newAgency, setNewAgency] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    website: "",
    description: "",
  });

  const [showPropForm, setShowPropForm] = useState(false);
  const [editingProp, setEditingProp] = useState(null);
  const [propData, setPropData] = useState({
    title: "",
    description: "",
    location: "",
    mapLocation: "",
    propertyType: "Apartment",
    price: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    amenities: "",
    status: "Available",
    agency: "", // Required for Admin creation
    images: [],
    documents: [],
    threeDModelUrl: "",
  });

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    agencyId: "",
    message: "",
    status: "New Lead",
    source: "Direct",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    totalProjectValue: 0,
    advanceReceived: 0,
    finalPayment: 0,
    collectedAmount: 0,
    balanceDue: 0,
    purposeOrScopeOfWork: "",
    onboardingDate: "",
    status: "Pending",
  });

  const normalizeMoney = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const handlePaymentValueChange = (field, value) => {
    const numericValue = normalizeMoney(value);
    setPaymentFormData((prev) => {
      const next = { ...prev, [field]: numericValue };
      const total = normalizeMoney(next.totalProjectValue);
      const advance = normalizeMoney(next.advanceReceived);
      const final = normalizeMoney(next.finalPayment);
      const collectedAmount = advance + final;
      const balanceDue = Math.max(total - collectedAmount, 0);
      return { ...next, totalProjectValue: total, advanceReceived: advance, finalPayment: final, collectedAmount, balanceDue };
    });
  };

  const handleCollectedChange = (value) => {
    const collectedAmount = normalizeMoney(value);
    setPaymentFormData((prev) => {
      const total = normalizeMoney(prev.totalProjectValue);
      const advance = normalizeMoney(prev.advanceReceived);
      const finalPayment = Math.max(collectedAmount - advance, 0);
      const balanceDue = Math.max(total - collectedAmount, 0);
      return { ...prev, finalPayment, collectedAmount, balanceDue };
    });
  };

  const handleBalanceChange = (value) => {
    const balanceDue = normalizeMoney(value);
    setPaymentFormData((prev) => {
      const total = normalizeMoney(prev.totalProjectValue);
      const advance = normalizeMoney(prev.advanceReceived);
      const collectedAmount = Math.max(total - balanceDue, 0);
      const finalPayment = Math.max(collectedAmount - advance, 0);
      return { ...prev, finalPayment, collectedAmount, balanceDue };
    });
  };

  const agencies = users.filter((u) => u.role === "Agency");

  // Property Filters state
  const [propertyFilters, setPropertyFilters] = useState({
    type: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const [propPage, setPropPage] = useState(1);
  const propsPerPage = 5;

  // Settings State
  const [adminProfile, setAdminProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [engineParameters, setEngineParameters] = useState([
    {
      id: "neural-search",
      label: "Neural Search Indexing",
      desc: "Enable semantic search for property matching",
      active: true,
    },
    {
      id: "blockchain",
      label: "Blockchain Verification",
      desc: "Immutable records for investor identities",
      active: true,
    },
    {
      id: "auto-approval",
      label: "Agency Auto-Approval",
      desc: "Bypass manual audit for registered firms",
      active: false,
    },
    {
      id: "stealth",
      label: "Marketplace Stealth",
      desc: "Hide listings from non-registered visitors",
      active: false,
    },
    {
      id: "data-leak",
      label: "Data Leak Protection",
      desc: "Mask sensitive PII in public exports",
      active: true,
    },
  ]);

  const handleToggleEngineParameter = (id) => {
    setEngineParameters((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, active: !opt.active } : opt,
      ),
    );
  };

  useEffect(() => {
    if (user) {
      setAdminProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const filteredProperties = properties.filter((p) => {
    const matchesType =
      !propertyFilters.type || p.propertyType === propertyFilters.type;
    const matchesLocation =
      !propertyFilters.location ||
      p.location.toLowerCase().includes(propertyFilters.location.toLowerCase());
    const matchesSearch =
      !propertySearch ||
      p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.description.toLowerCase().includes(propertySearch.toLowerCase());
    const matchesModeration =
      propertyFilterStatus === "All" ||
      (propertyFilterStatus === "Approved" && p.isApproved) ||
      (propertyFilterStatus === "Pending" && !p.isApproved) ||
      (propertyFilterStatus === "Blocked" && p.status === "Blocked");

    return matchesType && matchesLocation && matchesSearch && matchesModeration;
  });

  useEffect(() => {
    setPropPage(1);
  }, [propertySearch, propertyFilterStatus, propertyFilters]);

  useEffect(() => {
    if (tab) {
      const tabMap = {
        agencies: "agencies",
        investors: "investors",
        users: "users",
        properties: "properties",
        leads: "leads",
        "movers-leads": "movers-leads",
        tracker: "tracker",
        settings: "settings",
      };
      setActiveTab(tabMap[tab] || "stats");
    } else {
      setActiveTab("stats");
    }
  }, [tab]);

  useEffect(() => {
    fetchAdminData();
    const intervalId = setInterval(fetchAdminData, 30000);
    return () => clearInterval(intervalId);
  }, [tab]);

  useEffect(() => {
    if (activeTab === 'movers-leads') fetchMoversLeads();
  }, [activeTab]);

  const fetchMoversLeads = async () => {
    setMoversLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/packers-movers/leads?limit=200`);
      setMoversLeads(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to fetch movers leads:', err);
    } finally {
      setMoversLoading(false);
    }
  };

  const handleDeleteMoversLead = async (id) => {
    if (!window.confirm('Delete this movers lead permanently?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/packers-movers/leads/${id}`);
      setMoversLeads((list) => list.filter((l) => l._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleUpdateMoversLeadStatus = async (id, status) => {
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/packers-movers/leads/${id}`, { status });
      setMoversLeads((list) => list.map((l) => (l._id === id ? { ...l, status: data.status || status } : l)));
      // Inform admin
      alert(`Lead status updated to ${data.status || status}`);
    } catch (err) {
      console.error('Failed to update movers lead status', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, propertiesRes, leadsRes, leadsAnalyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/stats`),
        axios.get(`${API_BASE_URL}/admin/users`),
        axios.get(`${API_BASE_URL}/properties`),
        axios.get(`${API_BASE_URL}/leads`),
        axios.get(`${API_BASE_URL}/admin/lead-analytics`),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProperties(propertiesRes.data);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
      setLeadsAnalytics(leadsAnalyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchAgencyDetail = async (id) => {
    setFetchingDetails(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/users/${id}/details`,
      );
      setAgencyDetails(
        data.agencyData
          ? {
              agency: data.user,
              properties: data.agencyData.properties,
              leads: data.enquiries,
            }
          : null,
      );
      // If it was just a general user, we might use a different state, but let's keep it consistent
      if (data.user.role === "Agency") {
        setSelectedAgency(id);
      } else {
        setUserDetails(data);
        setSelectedUser(id);
      }
      setFetchingDetails(false);
    } catch (error) {
      console.error(error);
      setFetchingDetails(false);
    }
  };

  const fetchUserDetails = async (id) => {
    setFetchingDetails(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/users/${id}/details`,
      );
      setUserDetails(data);
      setSelectedUser(id);
      setFetchingDetails(false);
    } catch (error) {
      console.error(error);
      setFetchingDetails(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (adminProfile.newPassword && adminProfile.newPassword !== adminProfile.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setSaveLoading(true);
    try {
      // 1. Update Profile (Name/Email - although email is read-only in UI, we still send it)
      await axios.patch(`${API_BASE_URL}/users/profile`, {
        name: adminProfile.name,
      });

      // 2. Update Password if provided
      if (adminProfile.currentPassword && adminProfile.newPassword) {
        await axios.patch(`${API_BASE_URL}/users/profile/password`, {
          currentPassword: adminProfile.currentPassword,
          newPassword: adminProfile.newPassword,
        });
      }

      alert("Settings updated successfully! Please re-login if you changed your password.");
      setAdminProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleBlockUser = async (id, isBlocked) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/users/${id}/block`, {
        isBlocked,
      });
      fetchAdminData(); // Refresh list
      if (userDetails?.user._id === id) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, isBlocked },
        });
      }
    } catch (error) {
      const reason = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to update block status: ${reason}`);
      console.error('Block user error:', error);
    }
  };

  const handleUpdateUserStatus = async (id, status) => {
    if (status === 'inactive' && !window.confirm("Are you sure you want to mark this employee as inactive?")) {
      return;
    }
    try {
      await axios.patch(`${API_BASE_URL}/users/${id}/status`, { status });
      fetchAdminData();
      if (userDetails?.user._id === id) {
        setUserDetails({
          ...userDetails,
          user: { ...userDetails.user, status },
        });
      }
      alert(`User status updated to ${status}`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleFlagLead = async (id) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/admin/leads/${id}/flag`);
      fetchAdminData(); // Refresh leads table
      if (selectedLead?._id === id) {
        setSelectedLead({
          ...selectedLead,
          isFlagged: response.data.isFlagged
        });
      }
    } catch (error) {
      console.error("Failed to flag lead", error);
      alert("Failed to update lead flag status");
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        totalProjectValue: normalizeMoney(paymentFormData.totalProjectValue),
        advanceReceived: normalizeMoney(paymentFormData.advanceReceived),
        finalPayment: normalizeMoney(paymentFormData.finalPayment),
        totalCollected: normalizeMoney(paymentFormData.collectedAmount),
        balanceDue: normalizeMoney(paymentFormData.balanceDue),
        purposeOrScopeOfWork: paymentFormData.purposeOrScopeOfWork,
        onboardingDate: paymentFormData.onboardingDate,
        status: paymentFormData.status,
      };

      await axios.patch(`${API_BASE_URL}/leads/${selectedLead._id}/payment`, payload);
      setShowPaymentModal(false);
      fetchAdminData();
      // Update local state if needed
      const updatedLead = { ...selectedLead, paymentDetails: { ...selectedLead.paymentDetails, ...payload } };
      setSelectedLead(updatedLead);
      alert("Payment details updated successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update payment details");
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this user and all associated data?",
      )
    )
      return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${id}`);
      fetchAdminData();
      if (selectedAgency?._id === id) setSelectedAgency(null);
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const handleApproveProperty = async (id) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/properties/${id}/approve`,
      );
      fetchAdminData();
    } catch (error) {
      console.error("Property Approval Error:", error);
      alert(`Failed to approve listing: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBlockProperty = async (id) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/properties/${id}/block`,
      );
      fetchAdminData();
    } catch (error) {
      console.error("Property Block Error:", error);
      alert(
        `Failed to update moderation status: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/upload`,
        formData,
      );
      if (type === "image") {
        setPropData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      } else if (type === "model") {
        setPropData((prev) => ({
          ...prev,
          threeDModelUrl: data.url,
        }));
      } else {
        setPropData((prev) => ({
          ...prev,
          documents: [...prev.documents, data.url],
        }));
      }
    } catch (error) {
      alert("File upload failed");
    }
  };

  const handlePropSubmit = async (e) => {
    e.preventDefault();

    // Ensure agency is selected for administrative listings
    if (!propData.agency) {
      alert("Critical Requirement: Please assign this listing to a Responsible Agency.");
      return;
    }

    try {
      const payload = {
        ...propData,
        amenities:
          typeof propData.amenities === "string"
            ? propData.amenities
                .split(",")
                .map((a) => a.trim())
                .filter((a) => a)
            : propData.amenities,
      };
      if (editingProp) {
        await axios.put(
          `${API_BASE_URL}/properties/${editingProp._id}`,
          payload,
        );
      } else {
        await axios.post(`${API_BASE_URL}/properties`, payload);
      }
      setShowPropForm(false);
      setEditingProp(null);
      setPropData({
        title: "",
        description: "",
        location: "",
        mapLocation: "",
        propertyType: "Apartment",
        price: "",
        size: "",
        bedrooms: "",
        bathrooms: "",
        amenities: "",
        status: "Available",
        agency: "",
        images: [],
        documents: [],
        threeDModelUrl: "",
      });
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Action failed");
    }
  };

  const handleEditProp = (prop) => {
    setEditingProp(prop);
    setPropData({
      ...prop,
      amenities: prop.amenities.join(", "),
      agency: prop.agency?._id || prop.agency,
    });
    setShowPropForm(true);
  };

  const handleDeleteProperty = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this listing?",
      )
    )
      return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/properties/${id}`);
      fetchAdminData();
    } catch (error) {
      console.error("Property Disposal Error:", error);
      alert(`Critical: Listing removal failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleApproveAgency = async (userId, isApproved) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/users/${userId}/approve`,
        { isApproved },
      );
      setUsers(users.map((u) => (u._id === userId ? { ...u, isApproved } : u)));
      if (agencyDetails?.agency._id === userId) {
        setAgencyDetails({
          ...agencyDetails,
          agency: { ...agencyDetails.agency, isApproved },
        });
      }
      alert(isApproved ? 'Agency approved.' : 'Agency access revoked.');
    } catch (error) {
      const reason = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to ${isApproved ? 'approve' : 'revoke'} agency: ${reason}`);
      console.error('Approve/revoke agency error:', error);
    }
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin/agencies`, newAgency);
      setShowCreateAgency(false);
      setNewAgency({ name: "", email: "", password: "", phoneNumber: "" });
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create agency");
    }
  };

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    if (name === "propertyId") {
      const selectedProp = properties.find((p) => p._id === value);
      setNewLeadData({
        ...newLeadData,
        propertyId: value,
        agencyId: selectedProp?.agency?._id || selectedProp?.agency || "",
      });
    } else {
      setNewLeadData({ ...newLeadData, [name]: value });
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/leads`, newLeadData);
      setShowLeadForm(false);
      setNewLeadData({
        name: "",
        email: "",
        phone: "",
        propertyId: "",
        agencyId: "",
        message: "",
        status: "New Lead",
        source: "Direct",
      });
      fetchAdminData();
      alert("Lead created successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add lead");
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/400x200?text=No+Image";
    if (typeof url !== "string") return url;
    if (url.startsWith("http")) {
      if (window.location.hostname !== "localhost" && url.includes("localhost:5000")) {
        return url.replace("http://localhost:5000", BACKEND_URL);
      }
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    let cleanUrl = url.trim();
    if (cleanUrl.includes('<iframe')) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) cleanUrl = srcMatch[1];
    }
    if (cleanUrl.includes('/maps/embed') || cleanUrl.includes('output=embed')) return cleanUrl;
    const placeMatch = cleanUrl.match(/\/maps\/(search|place)\/([^/@?]+)/);
    if (placeMatch && placeMatch[2]) {
      const query = decodeURIComponent(placeMatch[2].replace(/\+/g, ' '));
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
    const coordMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch && coordMatch[1] && coordMatch[2]) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }
    if (cleanUrl.includes('google.com/maps') || cleanUrl.includes('maps.google')) {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}output=embed`;
    }
    return cleanUrl;
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <div
          className="glass"
          style={{
            padding: "2rem",
            borderRadius: "50%",
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Activity
            className="animate-pulse"
            size={40}
            color="var(--primary)"
          />
        </div>
      </div>
    );

  const activeAgencies = users.filter(
    (u) => u.role?.toLowerCase() === "agency",
  );
  const activeAgenciesSorted = [...activeAgencies].sort((a, b) =>
    b.createdAt > a.createdAt ? 1 : -1,
  );

  const filteredUsersList = users.filter((u) => {
    // Base tab filter - determine which users to show based on the active tab
    const matchesTab =
      activeTab === "investors"
        ? u.role?.toLowerCase() === "investor"
        : activeTab === "users"
          ? u.role?.toLowerCase() === "buyer"
          : true;

    // Role select filter
    const matchesRole =
      userFilters.role === "All Roles" ||
      (userFilters.role === "Agents" && u.role?.toLowerCase() === "agency") ||
      (userFilters.role === "Buyers" && u.role?.toLowerCase() === "buyer") ||
      (userFilters.role === "Investors" &&
        u.role?.toLowerCase() === "investor");

    // Status select filter
    const matchesStatus =
      userFilters.status === "All Status" ||
      (userFilters.status === "Active" && !u.isBlocked) ||
      (userFilters.status === "Suspended" && u.isBlocked);

    // Search filter
    const matchesSearch =
      !userFilters.search ||
      u.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      u.email.toLowerCase().includes(userFilters.search.toLowerCase());

    return matchesTab && matchesRole && matchesStatus && matchesSearch;
  });

  const activeInvestors = users.filter(
    (u) => u.role?.toLowerCase() === "investor",
  );
  const activeBuyers = users.filter((u) => u.role?.toLowerCase() === "buyer");
  const pendingAgenciesList = activeAgencies.filter((a) => !a.isApproved);

  // Quick Stats for other tabs
  const agencyCount = users.filter(u => u.role === 'Agency').length;
  const investorCount = users.filter(u => u.role === 'Investor').length;
  const buyerCount = users.filter(u => u.role === 'Buyer').length;
  const propertyCount = properties.length;
  const totalLeadCount = leads.length;

  return (
    <div className="animate-fade" style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      {/* Back Button for Detail Views */}
      {(selectedAgency || selectedUser || selectedLead) && (
        <button
          className="btn btn-outline"
          onClick={() => {
            setSelectedAgency(null);
            setSelectedUser(null);
            setSelectedLead(null);
          }}
          style={{
            marginBottom: "1.5rem",
            border: "none",
            background: "transparent",
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      )}

      {/* Report Generation Logic */}
      {(() => {
        window.handleGenerateReport = () => {
          const reportData = [
            ["Metric", "Value"],
            ["Total Assets Value", `Rs.${(stats.totalInvestedValue / 1000000).toFixed(1)}M`],
            ["Active Listings", stats.activeListings || stats.totalProperties],
            ["Total Users", (stats.totalUsers || 0) + (stats.totalAgencies || 0) + (stats.totalInvestors || 0)],
            ["Pending Reviews", stats.pendingAgencies || 0],
            ["Total Agencies", stats.totalAgencies || 0],
            ["Total Investors", stats.totalInvestors || 0],
            ["Total Leads", stats.totalLeads || 0],
            ["Total Revenue", `Rs.${stats.totalRevenue?.toLocaleString()}`],
            ["Conversion Rate", leadsAnalytics.summary.conversionRate],
          ];

          const csvContent = "data:text/csv;charset=utf-8," 
            + reportData.map(e => e.join(",")).join("\n");

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `Market_Report_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        return null;
      })()}

      {/* Platform Overview Dashboard */}
      {activeTab === "stats" && !selectedAgency && !selectedLead && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: windowWidth > 1024 ? "minmax(0, 3fr) minmax(0, 1fr)" : "minmax(0, 1fr)",
            gap: "1.2rem",
          }}
        >
          {/* Left Column: Stats and Table */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "1.2rem",
                  letterSpacing: "1px",
                }}
              >
                Market Overview
              </h4>
              <div className="dash-grid" style={{ gap: "1rem" }}>
                {[
                  {
                    label: "Total Assets Value",
                    value: `₹${(stats.totalInvestedValue / 1000000).toFixed(1)}M`,
                    trend: "+12%",
                    icon: TrendingUp,
                    color: "#14b8a6",
                  },
                  {
                    label: "Active Listings",
                    value: stats.activeListings || stats.totalProperties,
                    trend: "Live",
                    icon: Building2,
                    color: "var(--primary)",
                  },
                  {
                    label: "Total Users",
                    value:
                      (stats.totalUsers || 0) +
                      (stats.totalAgencies || 0) +
                      (stats.totalInvestors || 0),
                    trend: "+5.2%",
                    icon: Users,
                    color: "#6366f1",
                  },
                  {
                    label: "Pending Reviews",
                    value: stats.pendingAgencies || 0,
                    trend: "Action",
                    icon: ShieldAlert,
                    color: "#f59e0b",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="glass-card"
                    style={{
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.6rem",
                          fontWeight: "800",
                          color: "var(--text)",
                        }}
                      >
                        <AnimatedCounter value={item.value} />
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: `${item.color}20`,
                          color: item.color,
                          fontWeight: "700",
                        }}
                      >
                        {item.trend}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      From last month
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Listings Grid/Table */}
            <div
              className="glass-card"
              style={{
                padding: "0",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.2rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                    Recent Listings
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Monitor and approve newly submitted properties
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                  onClick={() => setActiveTab("properties")}
                >
                  View All Properties
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--surface-light)" }}>
                    <tr style={{ textAlign: "left" }}>
                      <th
                        style={{
                          padding: "0.8rem 1rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Property
                      </th>
                      <th
                        style={{
                          padding: "0.8rem 1rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Listed By
                      </th>
                      <th
                        style={{
                          padding: "0.8rem 1rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Price
                      </th>
                      <th
                        style={{
                          padding: "0.8rem 1rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "0.8rem 1rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.slice(0, 5).map((p) => (
                      <tr
                        key={p._id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td
                          style={{ padding: "0.8rem 1rem", cursor: "pointer" }}
                          onClick={() => p?._id && navigate(`/property/${p._id}`)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: "var(--surface-light)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {p.images?.[0] ? (
                                <img
                                  src={getImageUrl(p.images[0])}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <Building2 size={16} opacity={0.5} />
                              )}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "600",
                                  color: "var(--text)",
                                }}
                              >
                                {p.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                ID: {p._id.slice(-8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            fontSize: "0.85rem",
                          }}
                        >
                          {p.agency?.name || "Admin"}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                          }}
                        >
                          ₹${p.price.toLocaleString()}
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background:
                                p.status === "Available"
                                  ? "#10b98120"
                                  : "#f59e0b20",
                              color:
                                p.status === "Available"
                                  ? "#10b981"
                                  : "#f59e0b",
                              fontWeight: "800",
                            }}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{ padding: "1rem 1.5rem", textAlign: "right" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => p?._id && navigate(`/property/${p._id}`)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--primary)",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Info size={14} /> VIEW
                            </button>
                            {!p.isApproved && (
                              <button
                                onClick={() => handleApproveProperty(p._id)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#10b981",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle size={14} /> APPROVE
                              </button>
                            )}
                            <button
                              onClick={() => handleBlockProperty(p._id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: p.status === "Blocked" ? "#f59e0b" : "#ef4444",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {p.status === "Blocked" ? (
                                <>
                                  <ShieldCheck size={14} /> UNBLOCK
                                </>
                              ) : (
                                <>
                                  <ShieldBan size={14} /> BLOCK
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Actions and Status */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "1.2rem",
                  letterSpacing: "1px",
                }}
              >
                Quick Actions
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.8rem",
                }}
              >
                {[
                  {
                    label: "Add New Listing",
                    icon: PlusCircle,
                    action: () => {
                      setActiveTab("properties");
                      setShowPropForm(true);
                      setEditingProp(null);
                    },
                  },
                  {
                    label: "Invite Agency",
                    icon: UserPlus,
                    action: () => {
                      setActiveTab("agencies");
                      setShowCreateAgency(true);
                    },
                  },
                  {
                    label: "Generate Report",
                    icon: BarChart3,
                    action: () => window.handleGenerateReport(),
                  },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className="glass-card"
                    style={{
                      padding: "1.2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      transition: "var(--transition)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <btn.icon size={18} color="var(--primary)" />
                      <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                        {btn.label}
                      </span>
                    </div>
                    <ChevronRight size={16} opacity={0.5} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <h4
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                  letterSpacing: "1px",
                }}
              >
                System Status
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
              >
                {[
                  {
                    label: "Database",
                    status: "Stable",
                    icon: Database,
                    color: "#10b981",
                  },
                  {
                    label: "API Gateway",
                    status: "99.9%",
                    icon: Globe,
                    color: "#10b981",
                  },
                  {
                    label: "Storage",
                    status: "82% Full",
                    icon: ShieldCheck,
                    color: "#f59e0b",
                  },
                ].map((sys, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <sys.icon size={16} color="var(--text-muted)" />
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {sys.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        color: sys.color,
                      }}
                    >
                      {sys.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Tabs Refined with the same aesthetic */}
      {/* Redesigned Agency Management Tab */}
      {activeTab === "agencies" && (
        <div className="animate-fade">
          {/* Header Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: windowWidth <= 768 ? "stretch" : "center",
              marginBottom: "2rem",
              flexDirection: windowWidth <= 768 ? "column" : "row",
              gap: "1rem",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  fontSize: windowWidth <= 480 ? "1.4rem" : "1.8rem",
                  fontWeight: "800",
                  marginBottom: "0.4rem",
                }}
              >
                Agency Management
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: windowWidth <= 480 ? "0.85rem" : "0.95rem" }}>
                Oversee and regulate <AnimatedCounter value={activeAgencies.length} /> registered firms
                across the network.
              </p>
            </div>
            {!selectedAgency && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateAgency(!showCreateAgency)}
                style={{
                  padding: "0.8rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 10px 20px -5px rgba(194, 65, 12, 0.3)",
                  whiteSpace: "nowrap",
                  alignSelf: windowWidth <= 768 ? "stretch" : "auto",
                }}
              >
                <UserPlus size={18} />{" "}
                {showCreateAgency ? "Back to Inventory" : "Invite New Agency"}
              </button>
            )}
          </div>

          {!selectedAgency ? (
            <div className="glass-card" style={{ padding: "0" }}>
              {showCreateAgency ? (
                <div style={{ padding: windowWidth <= 768 ? "0.5rem" : "2rem" }} className="animate-fade">
                  <form
                    onSubmit={handleCreateAgency}
                    style={{
                      display: "grid",
                      gridTemplateColumns: windowWidth > 900 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                      gap: windowWidth <= 768 ? "1rem" : "1.5rem",
                      padding: windowWidth <= 480 ? "1rem" : windowWidth <= 768 ? "1.2rem" : "2rem",
                      background: "var(--surface-light)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="input-group">
                      <label>Firm Name</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={newAgency.name}
                        onChange={(e) =>
                          setNewAgency({ ...newAgency, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="input-control"
                        required
                        value={newAgency.email}
                        onChange={(e) =>
                          setNewAgency({ ...newAgency, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Initial Password</label>
                      <input
                        type="password"
                        className="input-control"
                        required
                        value={newAgency.password}
                        onChange={(e) =>
                          setNewAgency({
                            ...newAgency,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={newAgency.phoneNumber}
                        onChange={(e) =>
                          setNewAgency({
                            ...newAgency,
                            phoneNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          padding: "1rem",
                          fontWeight: "800",
                        }}
                      >
                        Confirm Business Registration
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: "1rem 1.2rem",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ position: "relative", flex: 1 }}>
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        className="input-control"
                        placeholder="Search agencies..."
                        style={{
                          background: "var(--surface-light)",
                          paddingLeft: "38px",
                          border: "1px solid var(--border)",
                        }}
                      />
                    </div>
                    <select
                      className="input-control"
                      style={{
                        width: "150px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <option>Verified First</option>
                      <option>Pending First</option>
                    </select>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <th
                            style={{
                              padding: "0.8rem 1.5rem",
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              fontWeight: "800",
                            }}
                          >
                            FIRM IDENTITY
                          </th>
                          <th
                            style={{
                              padding: "0.8rem 1.5rem",
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              fontWeight: "800",
                            }}
                          >
                            VERIFICATION
                          </th>
                          <th
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              fontWeight: "800",
                              textAlign: "right",
                            }}
                          >
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAgencies.map((agency) => (
                          <tr
                            key={agency._id}
                            style={{ borderBottom: "1px solid var(--border)" }}
                            className="hover-light"
                            onClick={() => fetchAgencyDetail(agency._id)}
                          >
                            <td
                              style={{
                                padding: "0.8rem 1.5rem",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    background: "var(--primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "800",
                                    color: "white",
                                  }}
                                >
                                  {agency.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "700",
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    {agency.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {agency.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "1.2rem 1.5rem" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: agency.isApproved
                                      ? "#10b981"
                                      : "#f59e0b",
                                  }}
                                ></div>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "700",
                                    color: agency.isApproved
                                      ? "#10b981"
                                      : "#f59e0b",
                                  }}
                                >
                                  {agency.isApproved
                                    ? "VERIFIED"
                                    : "PENDING REVIEW"}
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "1.2rem 1.5rem",
                                textAlign: "right",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  className="btn btn-outline"
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "700",
                                    borderColor: "rgba(255,255,255,0.1)",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchAgencyDetail(agency._id);
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: "700",
                                    borderColor: "rgba(255,255,255,0.1)",
                                    color: "#ef4444",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(agency._id);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            agencyDetails && (
              <div className="animate-fade">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: windowWidth > 1024 ? "minmax(0, 1fr) minmax(0, 2fr)" : "minmax(0, 1fr)",
                    gap: "2rem",
                  }}
                >
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "1.5rem",
                          background: "var(--primary)",
                          margin: "0 auto 1.2rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          fontWeight: "900",
                          color: "white",
                        }}
                      >
                        {agencyDetails.agency.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h4 style={{ fontSize: "1.5rem", fontWeight: "900" }}>
                        {agencyDetails.agency.name}
                      </h4>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {agencyDetails.agency.email}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          padding: "1rem",
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          Asset Inventory
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          <div
                            style={{ fontSize: "1.5rem", fontWeight: "800" }}
                          >
                            {agencyDetails.properties.length}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#10b981",
                              fontWeight: "700",
                            }}
                          >
                            Properties
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          padding: "1rem",
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          Lead Flow
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          <div
                            style={{ fontSize: "1.5rem", fontWeight: "800" }}
                          >
                            {agencyDetails.leads.length}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--primary)",
                              fontWeight: "700",
                            }}
                          >
                            Active Conversions
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleApproveAgency(
                            agencyDetails.agency._id,
                            !agencyDetails.agency.isApproved,
                          )
                        }
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          background: agencyDetails.agency.isApproved
                            ? "#ef4444"
                            : "var(--primary)",
                          border: "none",
                          boxShadow: agencyDetails.agency.isApproved
                            ? "none"
                            : "0 10px 20px -5px rgba(194, 65, 12, 0.3)",
                        }}
                      >
                        {agencyDetails.agency.isApproved
                          ? "Revoke Agency Access"
                          : "Approve Firm Identity"}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          if (agencyDetails.agency.phoneNumber) {
                            window.location.href = `tel:${agencyDetails.agency.phoneNumber}`;
                          } else {
                            alert("No phone number provided for this agency.");
                          }
                        }}
                        style={{
                          width: "100%",
                          border: "none",
                          color: "var(--text-muted)",
                        }}
                      >
                        Contact Agency Principal
                      </button>
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "2rem",
                      }}
                    >
                      <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
                        Firms Portfolio
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <AnimatedCounter value={agencyDetails.properties.length} /> total listings
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: "1.2rem",
                      }}
                    >
                      {agencyDetails.properties.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => p?._id && navigate(`/property/${p._id}`)}
                          className="hover-card"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            padding: "1.2rem",
                            borderRadius: "1.2rem",
                            border: "1px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "0.95rem",
                              marginBottom: "0.5rem",
                              color: "var(--text)",
                            }}
                          >
                            {p.title}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--primary)",
                                fontWeight: "900",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px"
                              }}
                            >
                              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>₹</span>
                              {p.price.toLocaleString()}
                            </div>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: "800",
                                color: "var(--text-muted)",
                                background: "rgba(255,255,255,0.08)",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                textTransform: "uppercase",
                              }}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Redesigned Property Management Tab */}
      {activeTab === "properties" && (
        <div className="animate-fade">
          {/* Header with Stats */}
          <div
            className="dash-grid"
            style={{
              marginBottom: "1.5rem",
              gap: "1rem",
            }}
          >
            {[
              {
                label: "TOTAL LISTINGS",
                value: stats.totalProperties,
                icon: Building2,
                trend: "+5.2%",
                trendLabel: "vs last month",
                color: "var(--primary)",
              },
              {
                label: "ACTIVE LISTINGS",
                value:
                  stats.activeListings ||
                  properties.filter((p) => p.status === "Available").length,
                icon: Home,
                trend: "+2.1%",
                trendLabel: "avg. occupancy",
                color: "#f59e0b",
              },
              {
                label: "PLATFORM REVENUE",
                value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
                icon: TrendingUp,
                trend: "Managed",
                trendLabel: "1% fee est.",
                color: "var(--primary)",
              },
              {
                label: "PENDING REVIEWS",
                value: stats.pendingAgencies || 0,
                icon: ShieldAlert,
                trend: "Action",
                trendLabel: "Needs review",
                color: "#ef4444",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: "1.2rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                    }}
                  >
                    {card.label}
                  </span>
                  <div
                    style={{
                      background: "var(--surface-light)",
                      padding: "6px",
                      borderRadius: "6px",
                    }}
                  >
                    <card.icon size={16} color={card.color} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "900",
                    marginBottom: "0.4rem",
                    color: "var(--text)",
                  }}
                >
                  <AnimatedCounter value={card.value} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      color: card.trend.startsWith("+") ? "#10b981" : "#ef4444",
                      fontWeight: "700",
                    }}
                  >
                    {card.trend}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {card.trendLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: windowWidth > 1024 ? "minmax(0, 1fr) 300px" : "minmax(0, 1fr)",
              gap: "1.2rem",
              alignItems: "start",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1.2rem", minWidth: 0 }}
            >
              {/* Property Management Form */}
              {showPropForm && (
                <div
                  className="glass-card animate-fade"
                  style={{
                    marginBottom: "3rem",
                    border: "1px solid var(--primary)",
                    background: "var(--surface)",
                    padding: windowWidth <= 768 ? "1.2rem" : "2rem",
                    borderRadius: "1.2rem",
                  }}
                >
                  <h5
                    style={{
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "var(--text)",
                      fontWeight: "800",
                      fontSize: windowWidth <= 768 ? "1rem" : "1.25rem",
                    }}
                  >
                    <PlusCircle size={20} color="var(--primary)" />{" "}
                    {editingProp ? "Edit Listing Data" : "New Property Details"}
                  </h5>
                  <form
                    onSubmit={handlePropSubmit}
                    style={{
                      display: "grid",
                      gridTemplateColumns: windowWidth > 768 ? "repeat(3, 1fr)" : windowWidth > 480 ? "repeat(2, 1fr)" : "1fr",
                      gap: windowWidth <= 768 ? "1rem" : "1.5rem",
                    }}
                  >
                    <div
                      className="input-group"
                      style={{ gridColumn: windowWidth > 480 ? "span 2" : "span 1" }}
                    >
                      <label style={{ color: "var(--text-muted)" }}>
                        Headline Title
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={propData.title}
                        onChange={(e) =>
                          setPropData({ ...propData, title: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        required
                        value={propData.price}
                        onChange={(e) =>
                          setPropData({ ...propData, price: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div
                      className="input-group"
                      style={{ gridColumn: windowWidth > 768 ? "span 3" : windowWidth > 480 ? "span 2" : "span 1" }}
                    >
                      <label style={{ color: "var(--text-muted)" }}>
                        Description
                      </label>
                      <textarea
                        className="input-control"
                        rows="3"
                        required
                        value={propData.description}
                        onChange={(e) =>
                          setPropData({
                            ...propData,
                            description: e.target.value,
                          })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      ></textarea>
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Location / City
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={propData.location}
                        onChange={(e) =>
                          setPropData({ ...propData, location: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Map Embed URL
                      </label>
                      <input
                        type="url"
                        className="input-control"
                        placeholder="https://www.google.com/maps/embed?..."
                        value={propData.mapLocation}
                        onChange={(e) =>
                          setPropData({ ...propData, mapLocation: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                      <small style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "block", marginTop: "4px" }}>
                        Paste Google Maps URL or Embed `src`. <b>Avoid shortened `maps.app.goo.gl` links.</b>
                      </small>
                      {propData.mapLocation && propData.mapLocation.includes('maps.app.goo.gl') && (
                        <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '8px', fontWeight: '700', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>
                          ⚠️ Shortened links (maps.app.goo.gl) are blocked by Google. Please open the link in your browser and copy the FULL URL from the address bar.
                        </div>
                      )}
                      {propData.mapLocation && !propData.mapLocation.includes('maps.app.goo.gl') && (
                        <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', height: '120px' }}>
                          <iframe 
                            src={getEmbedUrl(propData.mapLocation)} 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0 }}
                            title="Map Preview"
                          ></iframe>
                        </div>
                      )}
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Property Category
                      </label>
                      <select
                        className="input-control"
                        value={propData.propertyType}
                        onChange={(e) =>
                          setPropData({
                            ...propData,
                            propertyType: e.target.value,
                          })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          width: "100%",
                          padding: "0.8rem",
                          borderRadius: "8px",
                        }}
                      >
                        <option>Apartment</option>
                        <option>Villa</option>
                        <option>Commercial</option>
                        <option>Land</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Responsible Agency
                      </label>
                      <select
                        className="input-control"
                        required
                        value={propData.agency}
                        onChange={(e) =>
                          setPropData({ ...propData, agency: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          width: "100%",
                          padding: "0.8rem",
                          borderRadius: "8px",
                        }}
                      >
                        <option value="">Select Agency...</option>
                        {agencies.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Area (sqft)
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        required
                        value={propData.size}
                        onChange={(e) =>
                          setPropData({ ...propData, size: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>Beds</label>
                      <input
                        type="number"
                        className="input-control"
                        value={propData.bedrooms}
                        onChange={(e) =>
                          setPropData({ ...propData, bedrooms: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ color: "var(--text-muted)" }}>
                        Baths
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={propData.bathrooms}
                        onChange={(e) =>
                          setPropData({
                            ...propData,
                            bathrooms: e.target.value,
                          })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div
                      className="input-group"
                      style={{ gridColumn: windowWidth > 768 ? "span 3" : windowWidth > 480 ? "span 2" : "span 1" }}
                    >
                      <label style={{ color: "var(--text-muted)" }}>
                        Amenities (comma separated)
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        placeholder="Pool, Gym, Parking, WiFi"
                        value={propData.amenities}
                        onChange={(e) =>
                          setPropData({ ...propData, amenities: e.target.value })
                        }
                        style={{
                          background: "var(--surface-light)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="input-group">
                      <div style={{ marginBottom: "0.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.85rem" }}>
                        Property Images
                      </div>
                      <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', background: 'var(--surface-light)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text)' }}>
                        <Upload size={16} /> Choose Images
                        <input
                          type="file"
                          multiple
                          hidden
                          onChange={(e) => handleFileUpload(e, "image")}
                        />
                      </label>
                      <div
                        style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}
                      >
                        {propData.images.map((img, i) => (
                          <div key={i} style={{ position: "relative", width: "60px", height: "60px" }}>
                            <img
                              src={getImageUrl(img)}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "8px",
                                objectFit: "cover",
                                border: "1px solid var(--border)",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setPropData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                              style={{
                                position: "absolute",
                                top: "-6px",
                                right: "-6px",
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "800",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                                zIndex: 10
                              }}
                            >
                              <CloseIcon size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="input-group">
                      <div style={{ marginBottom: "0.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.85rem" }}>
                        3D Virtual Tour
                      </div>
                      <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', background: 'var(--surface-light)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text)' }}>
                        <Upload size={16} /> Upload 3D Model
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          hidden
                          onChange={(e) => handleFileUpload(e, "model")}
                        />
                      </label>
                      <div style={{ marginTop: "12px" }}>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Or paste 3D Model URL"
                          value={propData.threeDModelUrl || ""}
                          onChange={(e) => setPropData({ ...propData, threeDModelUrl: e.target.value })}
                          style={{
                            background: "var(--surface-light)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem"
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="input-group"
                      style={{ gridColumn: windowWidth > 480 ? "span 2" : "span 1" }}
                    >
                      <div style={{ marginBottom: "0.5rem", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.85rem" }}>
                        Legal & Documents
                      </div>
                      <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: 'fit-content', background: 'var(--surface-light)', border: '1px solid var(--border)', padding: '0.75rem 1.2rem', borderRadius: '8px', color: 'var(--text)' }}>
                        <FileText size={16} /> Attach Documents
                        <input
                          type="file"
                          multiple
                          hidden
                          onChange={(e) => handleFileUpload(e, "doc")}
                        />
                      </label>
                      <div style={{ fontSize: "0.75rem", marginTop: "8px", color: "var(--text-muted)" }}>
                        {propData.documents.length} files attached
                      </div>
                    </div>
                    <div style={{ gridColumn: windowWidth > 768 ? "span 3" : windowWidth > 480 ? "span 2" : "span 1", display: "flex", flexDirection: windowWidth <= 480 ? "column" : "row", gap: "1rem" }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 2, padding: "1rem" }}
                      >
                        <Save size={18} />{" "}
                        {editingProp ? "Finalize Updates" : "Publish Listing"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => { setShowPropForm(false); setEditingProp(null); }}
                        style={{ flex: 1, padding: "1rem" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Main Table Content */}
              <div
                className="glass-card"
                style={{
                  padding: "0",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.2rem",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        className="input-control"
                        placeholder="Search properties by title or location..."
                        style={{
                          background: "var(--surface-light)",
                          paddingLeft: "38px",
                          border: "1px solid var(--border)",
                        }}
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="input-control"
                      style={{
                        width: "180px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                      }}
                      value={propertyFilterStatus}
                      onChange={(e) => setPropertyFilterStatus(e.target.value)}
                    >
                      <option value="All">All Moderation</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Approved">Approved Listings</option>
                      <option value="Blocked">Blocked / Banned</option>
                    </select>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--primary)",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                      }}
                    >
                      <Filter size={16} /> FILTERS:
                    </div>
                    <select
                      className="input-control"
                      style={{
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        width: "auto",
                        padding: "6px 12px",
                        color: "var(--text)",
                      }}
                      value={propertyFilters.type}
                      onChange={(e) =>
                        setPropertyFilters({
                          ...propertyFilters,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="">All Types</option>
                      <option value="Apartment">Apartments</option>
                      <option value="Villa">Villas</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Land">Land</option>
                    </select>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setPropertyFilters({
                          type: "",
                          location: "",
                          minPrice: "",
                          maxPrice: "",
                        });
                        setPropertySearch("");
                        setPropertyFilterStatus("All");
                      }}
                    >
                      Reset all views
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto", width: "100%", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: windowWidth <= 480 ? "520px" : "auto" }}>
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <th
                          style={{
                            padding: "0.8rem 1rem",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                          }}
                        >
                          PROPERTY
                        </th>
                        <th
                          style={{
                            padding: "0.8rem 1rem",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                          }}
                        >
                          FIRM
                        </th>
                        <th
                          style={{
                            padding: "0.8rem 1rem",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                          }}
                        >
                          MODERATION
                        </th>
                        <th
                          style={{
                            padding: "0.8rem 1rem",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                          }}
                        >
                          PRICE
                        </th>
                        <th
                          style={{
                            padding: "0.8rem 1rem",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            textAlign: "right",
                          }}
                        >
                          GOVERNANCE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProperties
                        .slice((propPage - 1) * propsPerPage, propPage * propsPerPage)
                        .map((p) => (
                          <tr
                            key={p._id}
                            style={{ borderBottom: "1px solid var(--border)" }}
                          >
                            <td
                              style={{
                                padding: "0.8rem 1rem",
                                cursor: "pointer",
                              }}
                              onClick={() => p?._id && navigate(`/property/${p._id}`)}
                            >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  background: "var(--surface-light)",
                                  overflow: "hidden",
                                }}
                              >
                                <img
                                  src={getImageUrl(p.images?.[0])}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    color: "var(--text)",
                                  }}
                                >
                                  {p.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {p.location}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "0.8rem 1rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            {p.agency?.name || "Private Seller"}
                          </td>
                          <td style={{ padding: "0.8rem 1rem" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: p.isApproved
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : "rgba(245, 158, 11, 0.1)",
                                  color: p.isApproved ? "#10b981" : "#f59e0b",
                                  fontWeight: "800",
                                  width: "fit-content",
                                }}
                              >
                                {p.isApproved ? "APPROVED" : "PENDING"}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  color:
                                    p.status === "Blocked"
                                      ? "#ef4444"
                                      : "var(--text-muted)",
                                  fontWeight: "700",
                                }}
                              >
                                Status: {p.status}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "0.8rem 1rem",
                              fontWeight: "800",
                              fontSize: "0.9rem",
                            }}
                          >
                            ₹{p.price?.toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "0.8rem 1rem",
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                justifyContent: "flex-end",
                              }}
                            >
                              {!p.isApproved && (
                                <button
                                  title="Approve Listing"
                                  className="btn btn-outline"
                                  style={{
                                    padding: "4px",
                                    fontSize: "0.7rem",
                                    borderColor: "#10b981",
                                    color: "#10b981",
                                  }}
                                  onClick={() => handleApproveProperty(p._id)}
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                title={
                                  p.status === "Blocked"
                                    ? "Unblock Listing"
                                    : "Block Listing"
                                }
                                className="btn btn-outline"
                                style={{
                                  padding: "4px",
                                  fontSize: "0.7rem",
                                  borderColor:
                                    p.status === "Blocked"
                                      ? "var(--primary)"
                                      : "#f59e0b",
                                  color:
                                    p.status === "Blocked"
                                      ? "var(--primary)"
                                      : "#f59e0b",
                                }}
                                onClick={() => handleBlockProperty(p._id)}
                              >
                                {p.status === "Blocked" ? (
                                  <ShieldCheck size={14} />
                                ) : (
                                  <ShieldBan size={14} />
                                )}
                              </button>
                               <button
                                title="Edit Listing"
                                className="btn btn-outline"
                                style={{
                                  padding: "4px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                }}
                                onClick={() => handleEditProp(p)}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                title="Delete Listing"
                                className="btn btn-outline"
                                style={{
                                  padding: "4px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                  color: "#ef4444",
                                }}
                                onClick={() => handleDeleteProperty(p._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                title="View Live"
                                className="btn btn-outline"
                                style={{
                                  padding: "4px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                }}
                                onClick={() => p?._id && navigate(`/property/${p._id}`)}
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    padding: "1rem 1.2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--surface-light)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Showing {(propPage - 1) * propsPerPage + 1}-
                    {Math.min(propPage * propsPerPage, filteredProperties.length)} of{" "}
                    {filteredProperties.length} listings
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className={`btn btn-outline`}
                      disabled={propPage === 1}
                      onClick={() => setPropPage(p => Math.max(1, p - 1))}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                        opacity: propPage === 1 ? 0.5 : 1,
                        cursor: propPage === 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      <ChevronRight
                        size={16}
                        style={{ transform: "rotate(180deg)" }}
                      />
                    </button>
                    {Array.from({ length: Math.ceil(filteredProperties.length / propsPerPage) }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        className={`btn ${propPage === n ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setPropPage(n)}
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: "0",
                          fontSize: "0.8rem",
                          borderColor: propPage === n ? "transparent" : "var(--border)",
                          color: propPage === n ? "white" : "var(--text)",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className={`btn btn-outline`}
                      disabled={propPage === Math.ceil(filteredProperties.length / propsPerPage)}
                      onClick={() => setPropPage(p => Math.min(Math.ceil(filteredProperties.length / propsPerPage), p + 1))}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                        opacity: propPage === Math.ceil(filteredProperties.length / propsPerPage) ? 0.5 : 1,
                        cursor: propPage === Math.ceil(filteredProperties.length / propsPerPage) ? "not-allowed" : "pointer"
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Visualization Placeholder */}
              <div
                className="glass-card"
                style={{
                  padding: "1.5rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "800",
                      color: "var(--text)",
                    }}
                  >
                    Regional Performance
                  </h4>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                    }}
                  >
                    View Full Map
                  </button>
                </div>
                <div
                  style={{
                    height: "240px",
                    background: "var(--surface-light)",
                    borderRadius: "1rem",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      background: "var(--surface)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      fontSize: "0.7rem",
                      color: "var(--text)",
                    }}
                  >
                    <div style={{ fontWeight: "800", marginBottom: "4px" }}>
                      LIVE ACTIVITY
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--primary)",
                        }}
                      ></div>{" "}
                      New Listing in West Park
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#10b981",
                        }}
                      ></div>{" "}
                      Sale Closed in Downtown
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <Globe size={40} opacity={0.1} />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
            >
              {/* Top Agencies Sidebar */}
              <div className="glass-card" style={{ padding: "1.2rem" }}>
                <h4
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    marginBottom: "1rem",
                  }}
                >
                  Top Agencies
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {activeAgenciesSorted.slice(0, 4).map((agency, i) => {
                    const agencyListingCount = properties.filter(
                      (p) =>
                        p.agency?._id === agency._id || p.agency === agency._id,
                    ).length;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: "800",
                              color: "white",
                            }}
                          >
                            {agency.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div
                              style={{ fontSize: "0.85rem", fontWeight: "700" }}
                            >
                              {agency.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              <AnimatedCounter value={agencyListingCount} /> listings
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "800",
                            color: "#10b981",
                          }}
                        >
                          {agency.isApproved ? "Verified" : "Pending"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create New Listing Button (Reference style) */}
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab("properties");
                  setShowPropForm(true);
                  setEditingProp(null);
                }}
                style={{
                  width: "100%",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 10px 20px -5px rgba(194, 65, 12, 0.3)",
                }}
              >
                <PlusCircle size={20} />
                <span style={{ fontWeight: "800" }}>Create New Listing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned User Management Tab */}
      {(activeTab === "users" || activeTab === "investors") && (
        <div className="animate-fade">
          {/* Summary Cards for Users/Investors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: windowWidth > 1024 ? "repeat(4, 1fr)" : "repeat(2, minmax(0, 1fr))",
              gap: windowWidth <= 480 ? "0.75rem" : "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              {
                label:
                  activeTab === "users" ? "TOTAL USERS" : "TOTAL INVESTORS",
                value:
                  activeTab === "users"
                    ? stats.totalUsers
                    : stats.totalInvestors,
                icon: Users,
                trend: "+12%",
                trendLabel: "from last month",
                color: "var(--primary)",
              },
              {
                label: activeTab === "users" ? "ACTIVE AGENTS" : "AUM TOTAL",
                value:
                  activeTab === "users"
                    ? activeAgencies.length
                    : `$${((stats.totalInvestedValue / 1000000) * 0.4).toFixed(1)}M`,
                icon: activeTab === "users" ? UserPlus : Database,
                trend: "92%",
                trendLabel: "platform share",
                color: "#f59e0b",
              },
              {
                label:
                  activeTab === "users" ? "PENDING INVESTORS" : "PROJECTED ROI",
                value: activeTab === "users" ? activeInvestors.length : "12.8%",
                icon: TrendingUp,
                trend: "Action",
                trendLabel: "Avg. Market Yield",
                color: "#ef4444",
              },
              {
                label:
                  activeTab === "users" ? "NEW BUYERS" : "PENDING APPROVALS",
                value:
                  activeTab === "users"
                    ? activeBuyers.length
                    : stats.pendingAgencies || 0,
                icon: activeTab === "users" ? UserCheck : ShieldAlert,
                trend: "+45",
                trendLabel: "today",
                color: "#10b981",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: "1.2rem",
                  position: "relative",
                  overflow: "hidden",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                      letterSpacing: "1px",
                    }}
                  >
                    {card.label}
                  </div>
                  <card.icon
                    size={18}
                    style={{ color: card.color, opacity: 0.8 }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "900",
                    marginBottom: "0.5rem",
                    color: "var(--text)",
                  }}
                >
                  <AnimatedCounter value={card.value} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.75rem",
                  }}
                >
                  <span style={{ color: card.color, fontWeight: "700" }}>
                    {card.trend}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {card.trendLabel}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-10px",
                    right: "-10px",
                    opacity: 0.03,
                    color: "var(--text)",
                  }}
                >
                  <card.icon size={80} />
                </div>
              </div>
            ))}
          </div>

          {/* User Details Detail View */}
          {selectedUser && userDetails && (
            <div className="animate-fade">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: windowWidth > 992 ? "minmax(0, 1fr) minmax(0, 2fr)" : "minmax(0, 1fr)",
                  gap: "2rem",
                }}
              >
                {/* Left Column: User Brief Profile */}
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                  <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "2rem",
                        background: userDetails.user.profileImage ? `url(${getImageUrl(userDetails.user.profileImage)}) center/cover no-repeat` : "var(--surface-light)",
                        margin: "0 auto 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        fontWeight: "900",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {!userDetails.user.profileImage ? userDetails.user.name.slice(0, 2).toUpperCase() : ""}
                    </div>
                    <h4
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: "900",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {userDetails.user.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        background: "var(--surface-light)",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      PLATFORM {userDetails.user.role.toUpperCase()}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.2rem",
                      marginBottom: "2.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          background: "var(--surface-light)",
                          borderRadius: "10px",
                        }}
                      >
                        <Mail size={16} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: "0.9rem" }}>
                        {userDetails.user.email}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          background: "var(--surface-light)",
                          borderRadius: "10px",
                        }}
                      >
                        <Phone size={16} color="var(--primary)" />
                      </div>
                      <div style={{ fontSize: "0.9rem" }}>
                        {userDetails.user.phoneNumber || "N/A"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          background: "var(--surface-light)",
                          borderRadius: "10px",
                        }}
                      >
                        <Clock size={16} color="var(--primary)" />
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Joined{" "}
                        {new Date(
                          userDetails.user.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() =>
                        handleBlockUser(
                          userDetails.user._id,
                          !userDetails.user.isBlocked,
                        )
                      }
                      className="btn btn-outline"
                      style={{
                        width: "100%",
                        borderColor: userDetails.user.isBlocked
                          ? "#10b981"
                          : "#f59e0b",
                        color: userDetails.user.isBlocked
                          ? "#10b981"
                          : "#f59e0b",
                      }}
                    >
                      {userDetails.user.isBlocked ? (
                        <>
                          <ShieldCheck size={16} /> Restore Access
                        </>
                      ) : (
                        <>
                          <ShieldBan size={16} /> Block User Account
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userDetails.user._id)}
                      className="btn btn-outline"
                      style={{
                        width: "100%",
                        color: "#ef4444",
                        borderColor: "#ef4444",
                      }}
                    >
                      <Trash2 size={16} /> Delete User Permanent
                    </button>
                  </div>
                </div>

                {/* Right Column Content Area */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.2rem",
                  }}
                >
                  {/* Investor Specific Section */}
                  {userDetails.user.role === "Investor" &&
                    userDetails.investorData && (
                      <>
                        {/* Portfolio Overview */}
                        <div className="glass-card" style={{ padding: "2rem" }}>
                          <h4
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "800",
                              marginBottom: "1.5rem",
                            }}
                          >
                            Portfolio Overview
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: windowWidth > 600 ? "repeat(3, 1fr)" : "1fr",
                              gap: "1.5rem",
                            }}
                          >
                            <div
                              style={{
                                background: "var(--surface-light)",
                                padding: "1.5rem",
                                borderRadius: "1.2rem",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  color: "var(--text-muted)",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                TOTAL INVESTED
                              </div>
                              <div
                                style={{
                                  fontSize: "1.5rem",
                                  fontWeight: "900",
                                  color: "var(--primary)",
                                }}
                              >
                                $
                                {userDetails.investorData.investments
                                  .reduce(
                                    (acc, inv) => acc + inv.purchasePrice,
                                    0,
                                  )
                                  .toLocaleString()}
                              </div>
                            </div>
                            <div
                              style={{
                                background: "var(--surface-light)",
                                padding: "1.5rem",
                                borderRadius: "1.2rem",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  color: "var(--text-muted)",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                CURRENT VALUATION
                              </div>
                              <div
                                style={{
                                  fontSize: "1.5rem",
                                  fontWeight: "900",
                                  color: "#10b981",
                                }}
                              >
                                $
                                {userDetails.investorData.investments
                                  .reduce(
                                    (acc, inv) => acc + inv.currentValue,
                                    0,
                                  )
                                  .toLocaleString()}
                              </div>
                            </div>
                            <div
                              style={{
                                background: "var(--surface-light)",
                                padding: "1.5rem",
                                borderRadius: "1.2rem",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  color: "var(--text-muted)",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                NET APPRECIATION
                              </div>
                              <div
                                style={{
                                  fontSize: "1.5rem",
                                  fontWeight: "900",
                                  color: "#c2410c",
                                }}
                              >
                                +{" "}
                                {(
                                  (userDetails.investorData.investments.reduce(
                                    (acc, inv) => acc + inv.currentValue,
                                    0,
                                  ) /
                                    (userDetails.investorData.investments.reduce(
                                      (acc, inv) => acc + inv.purchasePrice,
                                      0,
                                    ) || 1) -
                                    1) *
                                  100
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Investment Details Table */}
                        <div className="glass-card" style={{ padding: "2rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "1.5rem",
                            }}
                          >
                            <h4
                              style={{ fontSize: "1.2rem", fontWeight: "800" }}
                            >
                              Active Investments
                            </h4>
                            <button
                              className="btn btn-outline"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "0.6rem 1rem",
                                fontSize: "0.75rem",
                              }}
                            >
                              <FileText size={14} /> View All Docs
                            </button>
                          </div>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    textAlign: "left",
                                    borderBottom: "1px solid var(--border)",
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "1rem",
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                      fontWeight: "800",
                                    }}
                                  >
                                    PROPERTY
                                  </th>
                                  <th
                                    style={{
                                      padding: "1rem",
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                      fontWeight: "800",
                                    }}
                                  >
                                    STAKE
                                  </th>
                                  <th
                                    style={{
                                      padding: "1rem",
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                      fontWeight: "800",
                                    }}
                                  >
                                    VALUATION
                                  </th>
                                  <th
                                    style={{
                                      padding: "1rem",
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                      fontWeight: "800",
                                    }}
                                  >
                                    DOCUMENTS
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {userDetails.investorData.investments.map(
                                  (inv) => (
                                    <tr
                                      key={inv._id}
                                      style={{
                                        borderBottom: "1px solid var(--border)",
                                      }}
                                    >
                                      <td style={{ padding: "1rem" }}>
                                        <div
                                          style={{
                                            fontWeight: "700",
                                            fontSize: "0.85rem",
                                          }}
                                        >
                                          {inv.propertyName}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "0.7rem",
                                            color: "var(--text-muted)",
                                          }}
                                        >
                                          Invested{" "}
                                          {new Date(
                                            inv.investmentDate,
                                          ).toLocaleDateString()}
                                        </div>
                                      </td>
                                      <td style={{ padding: "1rem" }}>
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            fontWeight: "800",
                                            background: "var(--surface-light)",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          {inv.ownershipPercentage}%
                                        </span>
                                      </td>
                                      <td style={{ padding: "1rem" }}>
                                        <div
                                          style={{
                                            fontSize: "0.85rem",
                                            fontWeight: "700",
                                          }}
                                        >
                                          ${inv.currentValue.toLocaleString()}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "0.7rem",
                                            color: "#10b981",
                                          }}
                                        >
                                          Yield: 8.2%
                                        </div>
                                      </td>
                                      <td style={{ padding: "1rem" }}>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "5px",
                                          }}
                                        >
                                          {inv.documents &&
                                            inv.documents.map((doc, idx) => (
                                              <div
                                                key={idx}
                                                style={{
                                                  padding: "6px",
                                                  background:
                                                    "var(--surface-light)",
                                                  borderRadius: "6px",
                                                  cursor: "pointer",
                                                }}
                                                title={doc}
                                              >
                                                <FileText
                                                  size={12}
                                                  color="var(--primary)"
                                                />
                                              </div>
                                            ))}
                                          {(!inv.documents ||
                                            inv.documents.length === 0) && (
                                            <span
                                              style={{
                                                fontSize: "0.7rem",
                                                color: "var(--text-muted)",
                                              }}
                                            >
                                              None
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                          {userDetails.investorData.investments.length ===
                            0 && (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              No active investments found for this account.
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  {/* Agency Specific Section */}
                  {userDetails.user.role === "Agency" &&
                    userDetails.agencyData && (
                      <>
                        <div className="glass-card" style={{ padding: "2rem" }}>
                          <h4 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "1.5rem" }}>Company Profile</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>AGENCY NAME</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{userDetails.user.agencyName || 'Not Provided'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>LOCATION</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{userDetails.user.location || 'Not Provided'}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>WEBSITE</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    {userDetails.user.website ? <a href={userDetails.user.website.startsWith('http') ? userDetails.user.website : `https://${userDetails.user.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{userDetails.user.website}</a> : 'Not Provided'}
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>BIOGRAPHY</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{userDetails.user.bio || 'No biography provided.'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="glass-card" style={{ padding: "2rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "1.5rem",
                            }}
                          >
                            <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
                            Management Inventory
                          </h4>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {userDetails.agencyData.properties.length} active
                            listings
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "1.2rem",
                          }}
                        >
                          {userDetails.agencyData.properties.map((p) => (
                            <div
                              key={p._id}
                              onClick={() => p?._id && navigate(`/property/${p._id}`)}
                              className="hover-card"
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                padding: "1.2rem",
                                borderRadius: "1.2rem",
                                border: "1px solid var(--border)",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: "700",
                                  fontSize: "0.95rem",
                                  marginBottom: "0.5rem",
                                  color: "var(--text)",
                                }}
                              >
                                {p.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--primary)",
                                  fontWeight: "900",
                                }}
                              >
                                ${p.price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      </>
                    )}

                  {/* Enquiry History */}
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
                        Enquiry History
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {userDetails.enquiries.length} enquiries sent
                      </span>
                    </div>
                    {userDetails.enquiries.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        {userDetails.enquiries.map((enq) => (
                          <div
                            key={enq._id}
                            className="hover-light"
                            style={{
                              padding: "1rem",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: "1rem",
                              border: "1px solid var(--border)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: "var(--surface-light)",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <MessageSquare
                                  size={18}
                                  color="var(--primary)"
                                />
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "700",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  {enq.property?.title || "Unknown Property"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  Enquired on{" "}
                                  {new Date(enq.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                enq.property?._id &&
                                navigate(`/property/${enq.property._id}`)
                              }
                              className="btn btn-outline"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                border: "none",
                                color: "var(--primary)",
                                fontWeight: "700",
                              }}
                            >
                              VIEW LISTING
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "3rem",
                          color: "var(--text-muted)",
                          background: "rgba(255,255,255,0.01)",
                          borderRadius: "1rem",
                          border: "1px dashed var(--border)",
                        }}
                      >
                        No enquiry history available for this account.
                      </div>
                    )}
                  </div>

                  {/* Saved Properties */}
                  <div className="glass-card" style={{ padding: "2rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
                        Saved Properties
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {userDetails.savedProperties?.length || 0} items in
                        bucket
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "1.2rem",
                      }}
                    >
                      {userDetails.savedProperties &&
                      userDetails.savedProperties.length > 0 ? (
                        userDetails.savedProperties.map((p) => (
                          <div
                            key={p._id}
                            onClick={() => p?._id && navigate(`/property/${p._id}`)}
                            className="hover-card"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              padding: "1.2rem",
                              borderRadius: "1.2rem",
                              border: "1px solid var(--border)",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "0.95rem",
                                marginBottom: "0.5rem",
                                color: "var(--text)",
                              }}
                            >
                              {p.title}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--primary)",
                                  fontWeight: "900",
                                }}
                              >
                                ${p.price.toLocaleString()}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: "800",
                                  color: "var(--text-muted)",
                                  background: "rgba(255,255,255,0.08)",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  textTransform: "uppercase",
                                }}
                              >
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            gridColumn: "span 2",
                            textAlign: "center",
                            padding: "3rem",
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.01)",
                            borderRadius: "1rem",
                            border: "1px dashed var(--border)",
                          }}
                        >
                          This user hasn't saved any assets yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrated Table Container */}
          {!selectedUser && (
            <div
              className="glass-card"
              style={{
                padding: "0",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Table Header / Filters */}
              <div
                style={{
                  padding: windowWidth <= 480 ? "1rem" : "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", width: "100%" }}>
                  <select
                    className="input-control"
                    value={userFilters.role}
                    onChange={(e) =>
                      setUserFilters({ ...userFilters, role: e.target.value })
                    }
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      flex: "1 1 110px",
                      minWidth: 0,
                      padding: "6px 12px",
                    }}
                  >
                    <option>All Roles</option>
                    <option>Agents</option>
                    <option>Buyers</option>
                    <option>Investors</option>
                  </select>
                  <select
                    className="input-control"
                    value={userFilters.status}
                    onChange={(e) =>
                      setUserFilters({ ...userFilters, status: e.target.value })
                    }
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      flex: "1 1 110px",
                      minWidth: 0,
                      padding: "6px 12px",
                    }}
                  >
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Suspended</option>
                  </select>
                  <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
                    <Search
                      size={14}
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Search users..."
                      value={userFilters.search}
                      onChange={(e) =>
                        setUserFilters({
                          ...userFilters,
                          search: e.target.value,
                        })
                      }
                      style={{
                        paddingLeft: "30px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        width: "100%",
                        boxSizing: "border-box",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* High-Density Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--surface-light)" }}>
                    <tr
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <th
                        style={{
                          padding: "1rem 1.5rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                        }}
                      >
                        USER DETAILS
                      </th>
                      <th
                        style={{
                          padding: "1rem 1.5rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                        }}
                      >
                        ROLE
                      </th>
                      <th
                        style={{
                          padding: "1rem 1.5rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                        }}
                      >
                        LOCATION
                      </th>
                      <th
                        style={{
                          padding: "1rem 1.5rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STATUS
                      </th>
                      <th
                        style={{
                          padding: "1rem 1.5rem",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          textAlign: "right",
                        }}
                      >
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsersList
                      .slice(0, 5)
                      .map((u) => (
                        <tr
                          key={u._id}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "10px",
                                  background: "var(--surface-light)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "800",
                                  fontSize: "0.8rem",
                                  color: "var(--primary)",
                                }}
                              >
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "700",
                                    fontSize: "0.9rem",
                                    color: "var(--text)",
                                  }}
                                >
                                  {u.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                background: "var(--surface-light)",
                                border: "1px solid var(--border)",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "0.85rem",
                              color: "var(--text)",
                            }}
                          >
                            Global Node-01
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background: 
                                    u.status === "active" ? "#10b981" : 
                                    u.status === "inactive" ? "#9ca3af" : "#ef4444",
                                }}
                              ></div>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: "600",
                                  color: 
                                    u.status === "active" ? "#10b981" : 
                                    u.status === "inactive" ? "#9ca3af" : "#ef4444",
                                }}
                              >
                                {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : (u.isBlocked ? "Blocked" : "Active")}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: "6px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                }}
                                onClick={() => fetchUserDetails(u._id)}
                                title="View Profile"
                              >
                                <Info size={14} />
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: "6px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                  color: u.isBlocked ? "#10b981" : "#f59e0b",
                                }}
                                onClick={() =>
                                  handleBlockUser(u._id, !u.isBlocked)
                                }
                                title={
                                  u.isBlocked ? "Unblock User" : "Block User"
                                }
                              >
                                {u.isBlocked ? (
                                  <ShieldCheck size={14} />
                                ) : (
                                  <ShieldBan size={14} />
                                )}
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: "6px",
                                  fontSize: "0.75rem",
                                  borderColor: "var(--border)",
                                  color: "#ef4444",
                                }}
                                onClick={() => handleDeleteUser(u._id)}
                                title="Remove User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div
                style={{
                  padding: "1.2rem 1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--surface-light)",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Showing 1 to 5 of{" "}
                  {
                    filteredUsersList
                      .length
                  }{" "}
                  users
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    className="btn btn-outline"
                    style={{
                      padding: "5px 10px",
                      fontSize: "0.8rem",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    Prev
                  </button>
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      className={`btn ${n === 1 ? "btn-primary" : "btn-outline"}`}
                      style={{
                        width: "32px",
                        height: "32px",
                        padding: "0",
                        fontSize: "0.8rem",
                        borderColor: n === 1 ? "transparent" : "var(--border)",
                        color: n === 1 ? "white" : "var(--text)",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline"
                    style={{
                      padding: "5px 10px",
                      fontSize: "0.8rem",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Activity Banner */}
          <div
            style={{
              marginTop: "2.5rem",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              background: "linear-gradient(90deg, #c6a15b, #a8845a)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 20px 40px -15px rgba(198, 161, 91, 0.4)",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  marginBottom: "0.5rem",
                  color: "white",
                }}
              >
                User Activity Overview
              </h3>
              <p
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" }}
              >
                {pendingAgenciesList.length} {pendingAgenciesList.length === 1 ? 'new agent application is' : 'new agent applications are'} waiting for your approval.
                Processing time is currently within the expected 24-hour window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Lead Management Tab (Global Lead Tracking) */}
      {activeTab === "leads" && (
        <div className="animate-fade">
          {!selectedLead ? (
            <>
              {/* Lead Page Header */}
              <div
                style={{
                  display: "flex",
                  flexDirection: windowWidth <= 768 ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: windowWidth <= 768 ? "flex-start" : "flex-end",
                  gap: windowWidth <= 768 ? "1.5rem" : "1rem",
                  marginBottom: "2.5rem",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: windowWidth <= 768 ? "1.5rem" : "2rem",
                      fontWeight: "900",
                      marginBottom: "0.4rem",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Global Lead Tracking
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: windowWidth <= 768 ? "0.9rem" : "1rem" }}>
                    Monitor multi-agency performance and distribution metrics.
                  </p>
                </div>
                <div style={{ 
                  display: "flex", 
                  gap: "10px",
                  width: windowWidth <= 768 ? "100%" : "auto",
                  flexDirection: windowWidth <= 480 ? "column" : "row"
                }}>
                  <button
                    className="btn btn-outline"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "0.8rem 1.2rem",
                      fontWeight: "700",
                      border: "1px solid rgba(255,255,255,0.1)",
                      flex: windowWidth <= 480 ? 1 : "initial",
                      fontSize: "0.85rem"
                    }}
                  >
                    <TrendingUp size={16} /> Export Data
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowLeadForm(true);
                      setNewLeadData({
                        ...newLeadData,
                        propertyId: properties[0]?._id || "",
                        agencyId: properties[0]?.agency?._id || properties[0]?.agency || "",
                      });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "0.8rem 1.2rem",
                      fontWeight: "800",
                      flex: windowWidth <= 480 ? 1 : "initial",
                      fontSize: "0.85rem"
                    }}
                  >
                    <PlusCircle size={16} /> Add New Lead
                  </button>
                </div>
              </div>

              {/* Lead Performance Summary Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: windowWidth > 1024 ? "repeat(4, 1fr)" : "repeat(2, minmax(0, 1fr))",
                  gap: windowWidth <= 480 ? "0.75rem" : "1.5rem",
                  marginBottom: "2.5rem",
                }}
              >
                {[
                  {
                    label: "TOTAL LEADS",
                    value: leadsAnalytics.summary.totalLeads,
                    icon: UserPlus,
                    trend: "+12%",
                    color: "var(--primary)",
                    trendDir: "up",
                  },
                  {
                    label: "CONTACTED",
                    value: leadsAnalytics.summary.contactedLeads,
                    icon: Phone,
                    trend: "+5.2%",
                    color: "#f59e0b",
                    trendDir: "up",
                  },
                  {
                    label: "CLOSED",
                    value: leadsAnalytics.summary.closedLeads,
                    icon: ShieldCheck,
                    trend: "-2.1%",
                    color: "#10b981",
                    trendDir: "down",
                  },
                  {
                    label: "CONVERSION",
                    value: leadsAnalytics.summary.conversionRate,
                    icon: TrendingUp,
                    trend: "+0.8%",
                    color: "#c2410c",
                    trendDir: "up",
                  },
                ].map((card, i) => (
                    <div
                    key={i}
                    className="glass-card"
                    style={{
                      padding: windowWidth <= 768 ? "1.2rem" : "2rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--surface-light)",
                          padding: "10px",
                          borderRadius: "12px",
                        }}
                      >
                        <card.icon size={22} color={card.color} />
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          color: card.trendDir === "up" ? "#10b981" : "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {card.trend} {card.trendDir === "up" ? "↗" : "↘"}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "0.5rem",
                        letterSpacing: "1px",
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontSize: "2.2rem",
                        fontWeight: "900",
                        color: "var(--text)",
                        letterSpacing: "-1px",
                      }}
                    >
                      <AnimatedCounter value={card.value} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Visualization Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: windowWidth > 1024 ? "1.5fr 1fr" : "1fr",
                  gap: "1.5rem",
                  marginBottom: "2.5rem",
                }}
              >
                {/* Lead Volume Trend */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2.5rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "800",
                        color: "var(--text)",
                      }}
                    >
                      Lead Volume Trend
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "var(--text)",
                      }}
                    >
                      Last 30 Days{" "}
                      <ChevronRight
                        size={14}
                        style={{ transform: "rotate(90deg)" }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Chart Visualization */}
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      overflow: "hidden"
                    }}
                  >
                    <svg
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                      viewBox="0 0 800 200"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--primary)"
                            stopOpacity="0.4"
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--primary)"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d={leadsAnalytics.volumeTrend.length > 1 
                          ? `M${leadsAnalytics.volumeTrend.map((d, i) => 
                              `${(i / (leadsAnalytics.volumeTrend.length - 1)) * 800},${200 - (d.count / Math.max(...leadsAnalytics.volumeTrend.map(v => v.count), 1)) * 180}`
                            ).join(' ')} V200 H0 Z`
                          : "M0,150 Q100,50 200,120 T400,80 T600,160 T800,20 V200 H0 Z"
                        }
                        fill="url(#chartGradient)"
                      />
                      <path
                        d={leadsAnalytics.volumeTrend.length > 1 
                          ? `M${leadsAnalytics.volumeTrend.map((d, i) => 
                              `${(i / (leadsAnalytics.volumeTrend.length - 1)) * 800},${200 - (d.count / Math.max(...leadsAnalytics.volumeTrend.map(v => v.count), 1)) * 180}`
                            ).join(' ')}`
                          : "M0,150 Q100,50 200,120 T400,80 T600,160 T800,20"
                        }
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="4"
                      />
                    </svg>
                    {leadsAnalytics.volumeTrend.length > 0 ? (
                      leadsAnalytics.volumeTrend.filter((_, i, arr) => i % Math.ceil(arr.length / 4) === 0).map((d, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "800",
                            color: "var(--text-muted)",
                            marginBottom: "5px",
                            zIndex: 1
                          }}
                        >
                          {d._id.slice(5)}
                        </div>
                      ))
                    ) : (
                      ["WEEK 1", "WEEK 2", "WEEK 3", "WEEK 4"].map((week, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "800",
                            color: "var(--text-muted)",
                            marginBottom: "5px",
                            zIndex: 1
                          }}
                        >
                          {week}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Source Performance */}
                <div
                  className="glass-card"
                  style={{
                    padding: "2rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      marginBottom: "2.5rem",
                      color: "var(--text)",
                    }}
                  >
                    Source Performance
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.8rem",
                    }}
                  >
                    {leadsAnalytics.sourcePerformance.length > 0 ? (
                      leadsAnalytics.sourcePerformance.map((source, i) => (
                        <div key={i}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                color: "var(--text)",
                              }}
                            >
                              {source._id || "Direct"}
                            </span>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: "800",
                                color: "var(--text-muted)",
                              }}
                            >
                              {source.count} Leads
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              background: "var(--surface-light)",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                width: `${(source.count / Math.max(...leadsAnalytics.sourcePerformance.map(s => s.count), 1)) * 100}%`,
                                height: "100%",
                                background: "var(--primary)",
                                borderRadius: "10px",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      [
                        {
                          name: "Zillow Premium",
                          value: "4,250 Leads",
                          progress: 85,
                        },
                        {
                          name: "Realtor.com",
                          value: "2,180 Leads",
                          progress: 45,
                        },
                        {
                          name: "Facebook Ads",
                          progress: 92,
                          value: "5,410 Leads",
                        },
                        {
                          name: "Organic Search",
                          progress: 25,
                          value: "1,000 Leads",
                        },
                      ].map((source, i) => (
                        <div key={i}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                color: "var(--text)",
                              }}
                            >
                              {source.name}
                            </span>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: "800",
                                color: "var(--text-muted)",
                              }}
                            >
                              {source.value}
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              background: "var(--surface-light)",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                width: `${source.progress}%`,
                                height: "100%",
                                background: "var(--primary)",
                                borderRadius: "10px",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Leads Distribution Table */}
              <div
                className="glass-card"
                style={{
                  padding: "0",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    padding: "2rem",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text)",
                    }}
                  >
                    Recent Leads Distribution
                  </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      style={{
                        padding: "10px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <Filter size={18} />
                    </button>
                    <button
                      style={{
                        padding: "10px",
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "var(--surface-light)" }}>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <th
                          style={{
                            padding: "1.5rem 2rem",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                          }}
                        >
                          LEAD DETAILS
                        </th>
                        <th
                          style={{
                            padding: "1.5rem 2rem",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                          }}
                        >
                          STATUS
                        </th>
                        <th
                          style={{
                            padding: "1.5rem 2rem",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                          }}
                        >
                          SOURCE
                        </th>
                        <th
                          style={{
                            padding: "1.5rem 2rem",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                          }}
                        >
                          ASSIGNED AGENT
                        </th>
                        <th
                          style={{
                            padding: "1.5rem 2rem",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            textAlign: "right",
                          }}
                        >
                          LAST ACTIVITY
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr
                          key={lead._id}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td style={{ padding: "1.2rem 2rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "10px",
                                  background: "var(--surface-light)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "900",
                                  color: "var(--primary)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                {lead.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "800",
                                    fontSize: "1rem",
                                    color: "var(--text)",
                                  }}
                                >
                                  {lead.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {i === 0
                                    ? "Luxury Villa Inquiry"
                                    : i === 1
                                      ? "Commercial Lease"
                                      : "Residential Buying"}
                                </div>
                                {lead.isFlagged && (
                                  <div style={{
                                    fontSize: "0.65rem",
                                    background: "#ef4444",
                                    color: "white",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "800",
                                    display: "inline-block",
                                    marginTop: "4px"
                                  }}>
                                    FLAGGED
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1.2rem 2rem" }}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                background:
                                  lead.status === "Closed"
                                    ? "#14532d"
                                    : lead.status === "Contacted"
                                      ? "#1e3a8a"
                                      : "#4a2512",
                                color:
                                  lead.status === "Closed"
                                    ? "#4ade80"
                                    : lead.status === "Contacted"
                                      ? "#93c5fd"
                                      : "#fdba74",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontWeight: "900",
                                textTransform: "uppercase",
                              }}
                            >
                              {lead.status || "NEW"}
                            </span>
                          </td>
                          <td style={{ padding: "1.2rem 2rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.95rem",
                                fontWeight: "700",
                                color: "var(--text)",
                              }}
                            >
                              <Globe size={16} color="var(--primary)" />{" "}
                              {i === 0
                                ? "Zillow"
                                : i === 1
                                  ? "Facebook"
                                  : "Direct Mail"}
                            </div>
                          </td>
                          <td style={{ padding: "1.2rem 2rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: "var(--surface-light)",
                                  border: "1px solid var(--border)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--text)",
                                }}
                              >
                                <Users size={14} />
                              </div>
                              <span
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "700",
                                  color: "var(--text)",
                                }}
                              >
                                {lead.agency?.name?.split(" ")[0] ||
                                  "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "1.2rem 2rem",
                              textAlign: "right",
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              fontWeight: "700",
                            }}
                          >
                            {i * 12 + 2} mins ago
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div
                  style={{
                    padding: "1.5rem 2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--surface-light)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                    }}
                  >
                    Showing 1-10 of 1,240 new leads
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.8rem",
                        opacity: 0.5,
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      Prev
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{
                        width: "36px",
                        height: "36px",
                        padding: "0",
                        fontSize: "0.85rem",
                      }}
                    >
                      1
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        width: "36px",
                        height: "36px",
                        padding: "0",
                        fontSize: "0.85rem",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      2
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.8rem",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-fade">
              <button
                className="btn btn-outline"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedLead(null);
                }}
                style={{
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <ChevronRight
                  size={18}
                  style={{ transform: "rotate(180deg)" }}
                />{" "}
                Back to Enquiry Ledger
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: windowWidth > 1024 ? "repeat(3, 1fr)" : "1fr",
                  gap: "1.5rem",
                }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: "2rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "2rem",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--primary)",
                        padding: "10px",
                        borderRadius: "12px",
                      }}
                    >
                      <Users size={24} color="white" />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "1px",
                        }}
                      >
                        BUYER PROFILE
                      </h4>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "900",
                          color: "var(--text)",
                        }}
                      >
                        {selectedLead.name}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        VERIFIED EMAIL
                      </div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text)",
                        }}
                      >
                        {selectedLead.email}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        PHONE ACCESS
                      </div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text)",
                        }}
                      >
                        {selectedLead.phoneNumber || "+1 (555) 000-0000"}
                      </div>
                    </div>                   
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    padding: "2rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "2rem",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--surface-light)",
                        border: "1px solid var(--border)",
                        padding: "10px",
                        borderRadius: "12px",
                      }}
                    >
                      <Building2 size={24} color="var(--primary)" />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "1px",
                        }}
                      >
                        INTERESTED ASSET
                      </h4>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "900",
                          color: "var(--text)",
                        }}
                      >
                        {selectedLead.property?.title}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <MapPin size={16} /> {selectedLead.property?.location}
                    </div>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "900",
                        color: "var(--text)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--primary)",
                          fontSize: "1.2rem",
                          verticalAlign: "top",
                          marginRight: "4px",
                        }}
                      >
                        $
                      </span>
                      {selectedLead.property?.price?.toLocaleString()}
                    </div>
                    <button
                      className="btn btn-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!selectedLead.property?._id) {
                          alert('Property information not available');
                          return;
                        }
                        navigate(`/property/${selectedLead.property._id}`);
                      }}
                      style={{
                        width: "100%",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      View Full Listing
                    </button>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    padding: "2rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "2rem",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        padding: "10px",
                        borderRadius: "12px",
                      }}
                    >
                      <ShieldCheck size={24} color="#10b981" />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          fontWeight: "800",
                          letterSpacing: "1px",
                        }}
                      >
                        AUDIT STATUS
                      </h4>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "900",
                          color: "#10b981",
                        }}
                      >
                        VERIFIED
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        RESPONSIBLE FIRM
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "1.1rem",
                          color: "var(--text)",
                        }}
                      >
                        {selectedLead.agency?.name}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          marginBottom: "4px",
                        }}
                      >
                        WORKFLOW STAGE
                      </div>
                      <div
                        style={{
                          background: "var(--primary)",
                          color: "white",
                          display: "inline-block",
                          padding: "6px 14px",
                          borderRadius: "4px",
                          fontWeight: "900",
                          fontSize: "0.8rem",
                        }}
                      >
                        {selectedLead.status?.toUpperCase() || "NEW ENQUIRY"}
                      </div>
                    </div>
                    <button
                      className="btn btn-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFlagLead(selectedLead._id);
                      }}
                      style={{
                        width: "100%",
                        borderColor: selectedLead.isFlagged ? "#10b981" : "#ef4444",
                        color: selectedLead.isFlagged ? "#10b981" : "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      {selectedLead.isFlagged ? "Resolve Audit Flag" : "Flag for Review"}
                    </button>
                  </div>
                </div>

                <div
                  className="glass-card"
                  style={{
                    gridColumn: windowWidth > 1024 ? "span 3" : "span 1",
                    padding: "2rem",
                    background: "var(--surface-light)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <MessageCircle size={18} color="var(--primary)" />
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "var(--text)",
                      }}
                    >
                      Buyer Inquiry Message
                    </span>
                  </div>
                  <div
                    style={{
                      background: "var(--surface)",
                      padding: "2rem",
                      borderRadius: "1.5rem",
                      color: "var(--text)",
                      fontStyle: "italic",
                      fontSize: "1.1rem",
                      lineHeight: "1.8",
                      borderLeft: "4px solid var(--primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    "{selectedLead.message}"
                  </div>
                  {permissions.canUpdatePayment && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setPaymentFormData({
                          totalProjectValue: selectedLead.paymentDetails?.totalProjectValue || 0,
                          advanceReceived: selectedLead.paymentDetails?.advanceReceived || 0,
                          finalPayment: selectedLead.paymentDetails?.finalPayment || 0,
                          collectedAmount: selectedLead.paymentDetails?.totalCollected || ((selectedLead.paymentDetails?.advanceReceived || 0) + (selectedLead.paymentDetails?.finalPayment || 0)),
                          balanceDue: selectedLead.paymentDetails?.balanceDue || Math.max((selectedLead.paymentDetails?.totalProjectValue || 0) - (selectedLead.paymentDetails?.totalCollected || ((selectedLead.paymentDetails?.advanceReceived || 0) + (selectedLead.paymentDetails?.finalPayment || 0))), 0),
                          purposeOrScopeOfWork: selectedLead.paymentDetails?.purposeOrScopeOfWork || "",
                          onboardingDate: selectedLead.paymentDetails?.onboardingDate ? new Date(selectedLead.paymentDetails.onboardingDate).toISOString().split('T')[0] : "",
                          status: selectedLead.paymentDetails?.status || "Pending",
                        });
                        setShowPaymentModal(true);
                      }}
                      style={{ marginTop: '1.5rem', width: '100%', padding: '1rem', fontWeight: '800' }}
                    >
                      Update Payment Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Redesigned Settings Tab */}
      {activeTab === "settings" && (
        <div className="animate-fade">
          <div style={{ marginBottom: "2.5rem" }}>
            <h3
              style={{
                fontSize: "1.8rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
                color: "var(--text)",
              }}
            >
              Platform Governance
            </h3>
            <p style={{ color: "var(--text-muted)" }}>
              Configure core engine parameters and administrative security
              protocols.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: windowWidth > 1024 ? "repeat(2, 1fr)" : "1fr",
              gap: "2.5rem",
            }}
          >
            <div
              className="glass-card"
              style={{
                padding: "2.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "2.5rem",
                }}
              >
                <div
                  style={{
                    background: "var(--primary)",
                    padding: "12px",
                    borderRadius: "14px",
                  }}
                >
                  <ShieldCheck size={24} color="white" />
                </div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "900",
                    color: "var(--text)",
                  }}
                >
                  Identity & Access
                </h4>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                <div className="input-group">
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    ADMINISTRATIVE ALIAS
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={adminProfile.name}
                    onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      padding: "12px 1rem",
                    }}
                  />
                </div>
                <div className="input-group">
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    RECOVERY CHANNEL (EMAIL)
                  </label>
                  <input
                    type="email"
                    className="input-control"
                    value={adminProfile.email}
                    readOnly
                    style={{
                      background: "rgba(226, 232, 240, 0.4)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      padding: "12px 1rem",
                      cursor: "not-allowed",
                    }}
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Email is locked for administrative security.
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 600 ? 'repeat(2, 1fr)' : '1fr', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
                            CURRENT PASSWORD
                        </label>
                        <input
                            type="password"
                            className="input-control"
                            placeholder="Required for any changes"
                            value={adminProfile.currentPassword}
                            onChange={(e) => setAdminProfile({ ...adminProfile, currentPassword: e.target.value })}
                            style={{ background: "var(--surface-light)", border: "1px solid var(--border)", color: "var(--text)", padding: "12px 1rem" }}
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
                            NEW PASSWORD
                        </label>
                        <input
                            type="password"
                            className="input-control"
                            placeholder="Leave blank to keep current"
                            value={adminProfile.newPassword}
                            onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                            style={{ background: "var(--surface-light)", border: "1px solid var(--border)", color: "var(--text)", padding: "12px 1rem" }}
                        />
                    </div>
                </div>

                <div
                  style={{
                    padding: "1.5rem",
                    background: "var(--surface-light)",
                    borderRadius: "1rem",
                    border: "1px dashed var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Security Protocol
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      lineHeight: "1.5",
                    }}
                  >
                    Updating sensitive credentials requires the current administrative 
                    passphrase to verify node ownership.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateSettings}
                  disabled={saveLoading}
                  style={{
                    padding: "1rem",
                    fontWeight: "800",
                    boxShadow: "0 10px 20px -5px rgba(194, 65, 12, 0.4)",
                  }}
                >
                  {saveLoading ? "Synchronizing..." : "Encrypt & Save Changes"}
                </button>
              </div>
            </div>
            <div
              className="glass-card"
              style={{
                padding: "2.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "2.5rem",
                }}
              >
                <div
                  style={{
                    background: "var(--surface-light)",
                    border: "1px solid var(--border)",
                    padding: "12px",
                    borderRadius: "14px",
                  }}
                >
                  <Database size={24} color="var(--primary)" />
                </div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "900",
                    color: "var(--text)",
                  }}
                >
                  Engine Parameters
                </h4>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                }}
              >
                {engineParameters.map((opt) => (
                  <div
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1.2rem",
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      borderRadius: "1.2rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "800",
                          marginBottom: "4px",
                          color: "var(--text)",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                    <div
                      role="button"
                      aria-pressed={opt.active}
                      onClick={() => handleToggleEngineParameter(opt.id)}
                      style={{
                        width: "44px",
                        height: "24px",
                        borderRadius: "24px",
                        background: opt.active
                          ? "var(--primary)"
                          : "#334155",
                        padding: "3px",
                        cursor: "pointer",
                        border: "1px solid var(--border)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "white",
                          marginLeft: opt.active ? "20px" : "0",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showLeadForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: windowWidth <= 768 ? "1rem" : "2rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            className="glass-card animate-fade"
            style={{
              width: "100%",
              maxWidth: "800px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: windowWidth <= 768 ? "1.2rem" : "2rem",
              maxHeight: windowWidth <= 768 ? "95vh" : "auto",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div
              style={{
                padding: "2rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--surface-light)",
              }}
            >
              <div style={{ paddingRight: "10px" }}>
                <h3 style={{ fontSize: windowWidth <= 768 ? "1.2rem" : "1.5rem", fontWeight: "900", lineHeight: 1.2 }}>
                  Add New Lead Manually
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: windowWidth <= 768 ? "0.8rem" : "0.9rem" }}>
                  Create a lead entry for external inquiries or walk-ins.
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => setShowLeadForm(false)}
                style={{ padding: "8px", border: "none" }}
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <form onSubmit={handleAddLead} style={{ padding: windowWidth <= 768 ? "1.5rem" : "2.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: windowWidth > 768 ? "repeat(2, 1fr)" : "1fr",
                  gap: windowWidth <= 768 ? "1rem" : "1.5rem",
                }}
              >
                <div className="input-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    className="input-control"
                    required
                    value={newLeadData.name}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="input-control"
                    required
                    value={newLeadData.phone}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="input-control"
                    required
                    value={newLeadData.email}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>Property</label>
                  <select
                    name="propertyId"
                    className="input-control"
                    required
                    value={newLeadData.propertyId}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="">Select a property...</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Assigned Agency</label>
                  <input
                    type="text"
                    className="input-control"
                    readOnly
                    value={
                      properties.find((p) => p._id === newLeadData.propertyId)
                        ?.agency?.name || "Select property first"
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>Lead Source</label>
                  <select
                    name="source"
                    className="input-control"
                    value={newLeadData.source}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {[
                      "Direct",
                      "Zillow Premium",
                      "Realtor.com",
                      "Facebook Ads",
                      "Organic Search",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Initial Status</label>
                  <select
                    name="status"
                    className="input-control"
                    value={newLeadData.status}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {[
                      "New Lead",
                      "Contacted",
                      "Site Visit",
                      "Negotiation",
                      "Booked",
                      "Sold",
                      "Closed",
                      "Lost",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group" style={{ gridColumn: windowWidth > 768 ? "span 2" : "span 1" }}>
                  <label>Notes</label>
                  <textarea
                    name="message"
                    className="input-control"
                    rows="3"
                    value={newLeadData.message}
                    onChange={handleLeadChange}
                    style={{
                      background: "var(--surface-light)",
                      border: "1px solid var(--border)",
                      resize: "none",
                    }}
                  ></textarea>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: windowWidth <= 480 ? "column" : "row",
                  gap: "1rem",
                  marginTop: windowWidth <= 768 ? "1.5rem" : "2.5rem",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "1rem", fontWeight: "800" }}
                >
                  Confirm Lead Entry
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowLeadForm(false)}
                  style={{ padding: "1rem 2rem", fontWeight: "700" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Movers Leads Tab */}
      {activeTab === "movers-leads" && (
        <div className="animate-fade">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: windowWidth <= 480 ? "1.4rem" : "1.8rem", fontWeight: 800, marginBottom: "0.35rem" }}>Movers Leads</h3>
              <p style={{ color: "var(--text-muted)", fontSize: windowWidth <= 480 ? "0.82rem" : "0.95rem" }}>
                Packers &amp; movers callback requests from the homepage and property pages.
              </p>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "0.5rem 0.9rem", borderRadius: 999,
              background: "rgba(198, 161, 91, 0.12)", border: "1px solid rgba(198, 161, 91, 0.28)",
              color: "var(--primary)", fontWeight: 700, fontSize: "0.8rem",
            }}>
              <Truck size={14} /> <AnimatedCounter value={moversLeads.length} /> total
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: windowWidth <= 480 ? 680 : "auto" }}>
                <thead style={{ background: "var(--surface-light)" }}>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    {['Name', 'Phone', 'City (From → To)', 'Move Date', 'Size', 'Status', 'Submitted', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moversLoading ? (
                    <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center" }}>
                      <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid rgba(198,161,91,0.18)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "mc-spin 0.9s linear infinite" }} />
                    </td></tr>
                  ) : moversLeads.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No movers leads yet.
                    </td></tr>
                  ) : moversLeads.map((lead) => (
                    <tr key={lead._id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "var(--text)" }}>
                        {lead.userName || '—'}
                        {lead.userEmail && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{lead.userEmail}</div>}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text)", fontSize: "0.88rem" }}>
                        <a href={`tel:${lead.phone}`} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>{lead.phone}</a>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text)", fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: 600 }}>{lead.moveFrom}</span>
                        {lead.moveTo && lead.moveTo !== lead.moveFrom && (
                          <><span style={{ color: "var(--text-muted)", margin: "0 6px" }}>→</span><span>{lead.moveTo}</span></>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        <Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {lead.moveDate ? new Date(lead.moveDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "uppercase", fontWeight: 700 }}>{lead.propertySize || '—'}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleUpdateMoversLeadStatus(lead._id, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "var(--text)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <button
                          onClick={() => handleDeleteMoversLead(lead._id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 8,
                            border: "1px solid rgba(239, 68, 68, 0.35)", background: "rgba(239, 68, 68, 0.08)",
                            color: "#ef4444", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                          title="Delete lead"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding & Payment Tracker Tab */}
      {activeTab === "tracker" && permissions.canViewTracker && (
        <div className="animate-fade">
          <div className="dash-header">
            <div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '900', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
                Onboarding & Payment Tracker
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
                Monitor client onboarding lifecycle and financial settlement metrics.
              </p>
            </div>
            {permissions.canExportCSV && (
              <button 
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.2rem', fontWeight: '700' }}
                onClick={() => {
                  const headers = ["Lead Name", "Email", "Scope of Work", "Onboarding Date", "Total Project Value", "Advance Received", "Balance Due", "Status"];
                  const rows = leads.map(l => [
                    l.name,
                    l.email,
                    l.paymentDetails?.purposeOrScopeOfWork || "N/A",
                    l.paymentDetails?.onboardingDate ? new Date(l.paymentDetails.onboardingDate).toLocaleDateString() : "N/A",
                    l.paymentDetails?.totalProjectValue || 0,
                    l.paymentDetails?.advanceReceived || 0,
                    l.paymentDetails?.balanceDue || 0,
                    l.paymentDetails?.status || "N/A"
                  ]);
                  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `onboarding_tracker_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <TrendingUp size={16} /> Export CSV Report
              </button>
            )}
          </div>

          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--surface-light)' }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>CLIENT DETAILS</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SCOPE / SERVICE</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>ONBOARDING</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>VALUE (₹)</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>COLLECTED (₹)</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>BALANCE (₹)</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>STAGE</th>
                </tr>
              </thead>
              <tbody>
                {leads.filter(l => l.paymentDetails?.totalProjectValue > 0).length > 0 ? (
                  leads.filter(l => l.paymentDetails?.totalProjectValue > 0).map(lead => (
                    <tr 
                      key={lead._id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        background: ['complete', 'completed'].includes((lead.paymentDetails?.status || '').toLowerCase()) ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                        {lead.paymentDetails?.purposeOrScopeOfWork || "---"}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                        {lead.paymentDetails?.onboardingDate ? new Date(lead.paymentDetails.onboardingDate).toLocaleDateString() : "---"}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text)' }}>
                        ₹{lead.paymentDetails?.totalProjectValue?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: '800' }}>
                        ₹{lead.paymentDetails?.totalCollected?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: '800' }}>
                        ₹{lead.paymentDetails?.balanceDue?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: ['complete', 'completed'].includes((lead.paymentDetails?.status || '').toLowerCase()) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: ['complete', 'completed'].includes((lead.paymentDetails?.status || '').toLowerCase()) ? '#10b981' : '#f59e0b',
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>
                          {lead.paymentDetails?.status || "NEW"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No leads have been moved to the financial onboarding stage yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Tracker Insights Banner */}
          <div style={{ 
            marginTop: '2.5rem', 
            padding: 'clamp(1.5rem, 5vw, 2.5rem)', 
            borderRadius: '1.5rem', 
            background: 'linear-gradient(90deg, #1e293b, #0f172a)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>Revenue Synchronization</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                All collected amounts are automatically verified against bank statements every 12 hours.
              </p>
            </div>
            <div style={{ textAlign: windowWidth <= 600 ? 'left' : 'right', flex: '1 1 200px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Outstanding</div>
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: '900', color: '#ef4444' }}>
                ₹{leads.reduce((acc, lead) => acc + (lead.paymentDetails?.balanceDue || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Lead Payment Update Modal */}
      {showPaymentModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          zIndex: 1100, padding: "2rem", paddingTop: "4rem", paddingBottom: "4rem", backdropFilter: "blur(10px)"
        }}>
          <div className="glass-card animate-fade" style={{
            width: "100%", maxWidth: "560px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: "1.5rem", maxHeight: 'calc(100% - 8rem)', overflowY: 'auto'
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '900' }}>Update Payment Metrics</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <CloseIcon size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdatePayment} style={{ padding: "1.5rem" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>PURPOSE / SCOPE</label>
                  <input 
                    type="text" 
                    className="input-control"
                    value={paymentFormData.purposeOrScopeOfWork}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, purposeOrScopeOfWork: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>TOTAL VALUE (₹)</label>
                    <input 
                      type="number" 
                      className="input-control"
                      value={paymentFormData.totalProjectValue}
                      onChange={(e) => handlePaymentValueChange('totalProjectValue', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>ADVANCE (₹)</label>
                    <input 
                      type="number" 
                      className="input-control"
                      value={paymentFormData.advanceReceived}
                      onChange={(e) => handlePaymentValueChange('advanceReceived', e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>FINAL PAYMENT (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={paymentFormData.finalPayment || 0}
                    onChange={(e) => handlePaymentValueChange('finalPayment', e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>COLLECTED (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      value={paymentFormData.collectedAmount || 0}
                      onChange={(e) => handleCollectedChange(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>BALANCE (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      value={paymentFormData.balanceDue || 0}
                      onChange={(e) => handleBalanceChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>ONBOARDING DATE</label>
                  <input 
                    type="date" 
                    className="input-control"
                    value={paymentFormData.onboardingDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, onboardingDate: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>PROCESS STATUS</label>
                  <select 
                    className="input-control"
                    value={paymentFormData.status}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-light)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.45rem' }}>
                    <span>Calculated Collected:</span>
                    <span style={{ color: '#10b981' }}>₹{(paymentFormData.collectedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700' }}>
                    <span>Calculated Balance:</span>
                    <span style={{ color: '#ef4444' }}>₹{(paymentFormData.balanceDue || 0).toLocaleString()}</span>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontWeight: '800', marginTop: '1rem' }}>
                  Sync Financial Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
