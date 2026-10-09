import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  FileText, 
  Flag, 
  AlertTriangle, 
  Search, 
  Eye, 
  Ban, 
  CheckCircle2, 
  IndianRupee, 
  Trash2, 
  Check, 
  RotateCcw,
  ChevronRight,
  Server
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button, Modal } from '../components';
import { formatPrice } from '../utils/formatters';
import { adminService } from '../services/adminService';

export default function AdminDashboard() {
  useDocumentTitle('Campus Admin Dashboard');

  // Navigation tab: 'overview' | 'users' | 'listings' | 'reports'
  const [activeTab, setActiveTab] = useState('overview');

  // Dataset states initialized from adminService abstraction
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  const [listingSearch, setListingSearch] = useState('');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('all');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');

  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Modal dialog states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [listingToDelete, setListingToDelete] = useState(null);

  // Feedback banner state
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [u, l, r] = await Promise.all([
        adminService.getUsers(),
        adminService.getListings(),
        adminService.getReports(),
      ]);
      setUsers(u);
      setListings(l);
      setReports(r);
    };
    loadData();
  }, []);

  const showFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Dashboard Overview Metrics
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.department.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.studentId.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.sellerName.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.sellerEmail.toLowerCase().includes(listingSearch.toLowerCase());
      const matchCategory =
        listingCategoryFilter === 'all' || l.category === listingCategoryFilter;
      const matchStatus =
        listingStatusFilter === 'all' || l.status === listingStatusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [listings, listingSearch, listingCategoryFilter, listingStatusFilter]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      return reportStatusFilter === 'all' || r.status === reportStatusFilter;
    });
  }, [reports, reportStatusFilter]);

  // User Actions: Block / Unblock
  const handleToggleBlockUser = (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    setSelectedUser(null);
    showFeedback(
      `User ${user.name} status updated to ${newStatus === 'blocked' ? 'blocked' : 'active'}.`
    );
  };

  // Listing Actions: Remove Listing
  const handleConfirmRemoveListing = () => {
    if (!listingToDelete) return;
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingToDelete.id ? { ...item, status: 'removed' } : item
      )
    );
    setListingToDelete(null);
    showFeedback(`Listing "${listingToDelete.title}" marked as removed.`);
  };

  // Report Actions: Resolve / Dismiss / Remove Listing
  const handleReportAction = (reportId, action) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
    );
    setSelectedReport(null);
    showFeedback(`Report ticket ${reportId} marked as ${action}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Campus Admin Dashboard"
        description="Comprehensive moderation of verified student users, marketplace listings, and safety reports."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Campus Safety Staff Portal
          </Badge>
        }
      />

      {/* Honest Backend Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Admin Console:</strong> Administrative metrics, user directory, and community safety reports will appear when the backend API is connected.
          </span>
        </div>
        <Badge variant="default" size="sm" className="self-start sm:self-auto shrink-0">
          Backend Disconnected
        </Badge>
      </div>

      {/* Global Temporary Feedback Toast */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#E4E4E7] dark:border-[#27272A] pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          id="admin-tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#E4E4E7] dark:bg-[#27272A] text-[#18181B] dark:text-[#FAFAFA]'}`}>
            {users.length}
          </span>
        </button>

        <button
          type="button"
          id="admin-tab-listings"
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'listings'
              ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Listings</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeTab === 'listings' ? 'bg-white/20 text-white' : 'bg-[#E4E4E7] dark:bg-[#27272A] text-[#18181B] dark:text-[#FAFAFA]'}`}>
            {listings.length}
          </span>
        </button>

        <button
          type="button"
          id="admin-tab-reports"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'reports'
              ? 'bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] shadow-xs'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Reports</span>
          {pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingReportsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          1. DASHBOARD OVERVIEW
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 5 KPI Stat Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Total Users */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">--</div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Data will appear when the backend is connected.</p>
            </div>

            {/* Total Listings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Listings</span>
                <div className="w-7 h-7 rounded-lg bg-[#F4F4F5] dark:bg-[#27272A] text-[#18181B] dark:text-[#FAFAFA] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">--</div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Data will appear when the backend is connected.</p>
            </div>

            {/* Active Listings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Listings</span>
                <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] dark:bg-[#14532D]/40 text-[#16A34A] dark:text-[#22C55E] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#16A34A] dark:text-[#22C55E]">--</div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Data will appear when the backend is connected.</p>
            </div>

            {/* Sold Listings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Sold Listings</span>
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/40 text-[#4F46E5] dark:text-[#A5B4FC] flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA]">--</div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Data will appear when the backend is connected.</p>
            </div>

            {/* Pending Reports */}
            <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[#71717A] dark:text-[#A1A1AA]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Reports</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">--</div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Data will appear when the backend is connected.</p>
            </div>
          </div>

          {/* Quick Action & Overview Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Urgent Reports Review Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Urgent Safety & Policy Reports</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Student reports awaiting moderation decision</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {reports.length > 0 ? (
                  reports.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={r.status === 'pending' ? 'warning' : 'default'} size="sm">
                            {r.status.toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {r.reason}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 truncate">
                          Listing: {r.listingTitle}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(r);
                          setActiveTab('reports');
                        }}
                        className="shrink-0"
                      >
                        Review
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No reports found. Data will appear when the backend is connected.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Staff Shortcuts & Directives */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrative Tools & Directives</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jump quickly into active marketplace sections</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all text-left space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Manage Student Users</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inspect student accounts, view .edu domains, or block offending sellers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('listings')}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all text-left space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <ShoppingBag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Audit Active Listings</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Filter by textbook, drafter, or bike category and remove prohibited items.
                  </p>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Campus Rule Enforcement:</strong> Real-time automated domain filter allows only accredited <code>.edu</code> student registrations.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. USERS MANAGEMENT PAGE
      ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Top Controls: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Campus Registered Students</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search student directory, view profiles, or manage platform access</p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="admin-search-users"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, or dept..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Status Filter */}
              <select
                id="admin-filter-user-status"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-600 focus:outline-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department / College</th>
                  <th className="py-3 px-4">Campus Email</th>
                  <th className="py-3 px-3">Joined Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Listings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[140px]">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {user.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* College / Department */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                        {user.department}
                      </td>

                      {/* Campus Email */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {user.email}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {user.joinedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge
                          variant={user.status === 'active' ? 'primary' : 'danger'}
                          size="sm"
                        >
                          {user.status === 'active' ? 'Active' : 'Blocked'}
                        </Badge>
                      </td>

                      {/* Listings Count */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {user.listingsCount}
                      </td>

                      {/* Action buttons: View User & Block Button */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          leftIcon={Eye}
                        >
                          View
                        </Button>
                        <Button
                          variant={user.status === 'active' ? 'danger' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleBlockUser(user)}
                          leftIcon={user.status === 'active' ? Ban : RotateCcw}
                        >
                          {user.status === 'active' ? 'Block' : 'Unblock'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No student users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          3. LISTINGS MANAGEMENT PAGE
      ======================================================== */}
      {activeTab === 'listings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Top Controls: Search, Category Filter, Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Campus Classified Listings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monitor peer posts, filter categories, or remove inappropriate listings</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="admin-search-listings"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Search item title or seller..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Category Filter */}
              <select
                id="admin-filter-listing-category"
                value={listingCategoryFilter}
                onChange={(e) => setListingCategoryFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-600 focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Categories</option>
                <option value="Books">Books</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Lab Coat">Lab Coat</option>
                <option value="Engineering Drafter">Engineering Drafter</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Electronics">Electronics</option>
                <option value="Notes">Notes</option>
                <option value="Other">Other</option>
              </select>

              {/* Status Filter */}
              <select
                id="admin-filter-listing-status"
                value={listingStatusFilter}
                onChange={(e) => setListingStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-600 focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="removed">Removed</option>
              </select>
            </div>
          </div>

          {/* Listings Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Posted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredListings.length > 0 ? (
                  filteredListings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[200px]">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {item.condition}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatPrice(item.price)}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge variant="default" size="sm">
                          {item.category}
                        </Badge>
                      </td>

                      {/* Seller */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate max-w-[140px]">
                          {item.sellerName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.sellerEmail}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            item.status === 'active'
                              ? 'primary'
                              : item.status === 'sold'
                              ? 'secondary'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Posted */}
                      <td className="py-3 px-3 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {item.postedDate}
                      </td>

                      {/* Action buttons: Remove Listing */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status !== 'removed' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setListingToDelete(item)}
                            leftIcon={Trash2}
                          >
                            Remove
                          </Button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs italic">Removed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No listings found matching your search and category filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          4. REPORTS MODERATION PAGE
      ======================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Header & Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Community Safety & Infraction Reports</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review flagged items, seller misconduct, or commercial listings</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter by:</span>
              <select
                id="admin-filter-report-status"
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-600 focus:outline-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Reports</option>
                <option value="pending">Pending Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Report Reason</th>
                  <th className="py-3 px-4">Reported Listing</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Reason */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                            report.severity === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-500'
                          }`} />
                          <span className="font-bold text-slate-900 dark:text-slate-100 max-w-[200px] truncate block">
                            {report.reason}
                          </span>
                        </div>
                      </td>

                      {/* Listing */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[220px]">
                          {report.listingTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          Seller: {report.sellerName}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <span className="block truncate max-w-[140px] font-medium text-slate-800 dark:text-slate-200">
                          {report.reporterName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {report.reporterEmail}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {report.date}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            report.status === 'pending'
                              ? 'warning'
                              : report.status === 'resolved'
                              ? 'primary'
                              : 'default'
                          }
                          size="sm"
                        >
                          {report.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Review Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          leftIcon={Eye}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIEW USER DETAILS
      ======================================================== */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Student User Profile"
        description="Verified student marketplace credentials and compliance status"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant={selectedUser?.status === 'active' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => {
                if (selectedUser) handleToggleBlockUser(selectedUser);
              }}
              leftIcon={selectedUser?.status === 'active' ? Ban : RotateCcw}
            >
              {selectedUser?.status === 'active' ? 'Block Account' : 'Restore Account'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{selectedUser.name}</h3>
                  <Badge variant={selectedUser.status === 'active' ? 'primary' : 'danger'} size="sm">
                    {selectedUser.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.college}</p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Student ID</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.studentId}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Major / Dept</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedUser.department}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Completed Trades</div>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedUser.tradesCompleted} exchanges</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold">Peer Rating</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">★ {selectedUser.rating} / 5.0</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          MODAL: REVIEW REPORT
      ======================================================== */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Moderation Review: Report Ticket"
        description="Inspect claims submitted by students and determine action"
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReportAction(selectedReport?.id, 'dismissed')}
            >
              Dismiss Report
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (selectedReport) {
                    setListings((prev) =>
                      prev.map((l) =>
                        l.id === selectedReport.listingId ? { ...l, status: 'removed' } : l
                      )
                    );
                    handleReportAction(selectedReport.id, 'resolved');
                  }
                }}
                leftIcon={Trash2}
              >
                Remove Listing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReportAction(selectedReport?.id, 'resolved')}
                leftIcon={Check}
              >
                Mark Resolved
              </Button>
            </div>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>{selectedReport.reason}</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed pt-1">
                "{selectedReport.details}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Target Listing</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{selectedReport.listingTitle}</div>
                <div className="text-slate-500 dark:text-slate-400">Seller: {selectedReport.sellerName} ({selectedReport.sellerEmail})</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Reporter Information</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{selectedReport.reporterName}</div>
                <div className="text-slate-500 dark:text-slate-400">{selectedReport.reporterEmail} • {selectedReport.date}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          MODAL: REMOVE LISTING CONFIRMATION
      ======================================================== */}
      <Modal
        isOpen={Boolean(listingToDelete)}
        onClose={() => setListingToDelete(null)}
        title="Confirm Remove Listing"
        description="This will immediately remove the listing from public search and category pages."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setListingToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmRemoveListing}
              leftIcon={Trash2}
            >
              Remove Listing
            </Button>
          </div>
        }
      >
        {listingToDelete && (
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Are you sure you want to remove <strong>"{listingToDelete.title}"</strong> ({formatPrice(listingToDelete.price)}) posted by {listingToDelete.sellerName}?
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
