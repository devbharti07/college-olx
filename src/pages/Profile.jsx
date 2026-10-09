import React, { useState, useEffect } from 'react';
import { 
  School, 
  Mail, 
  ShieldCheck, 
  Package, 
  Calendar, 
  MapPin, 
  Edit3, 
  CheckCircle2, 
  PlusCircle, 
  AlertCircle,
  LogIn,
  Send,
  RefreshCw,
  ExternalLink,
  Inbox
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button, Input, Modal, EmptyState, LoadingState } from '../components';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';
import { useListings } from '../context';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  useDocumentTitle('Student Profile | Campus Marketplace');

  const { isAuthenticated, refreshUser, refreshEmailVerification, keycloakEmailVerified } = useAuth();
  const { myListings } = useListings();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verification state
  const [resendStatus, setResendStatus] = useState(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await userService.getProfile();
        if (isMounted) {
          setProfile(data);
          if (data) {
            setEditFormData({
              name: data.name || '',
              college: data.college || '',
              department: data.department || '',
              pickupSpot: data.pickupSpot || '',
              avatar: data.avatar || '',
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleOpenEdit = () => {
    if (profile) {
      setEditFormData({
        name: profile.name || '',
        college: profile.college || '',
        department: profile.department || '',
        pickupSpot: profile.pickupSpot || '',
        avatar: profile.avatar || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await userService.updateProfile({
        name: editFormData.name?.trim(),
        college: editFormData.college?.trim(),
        department: editFormData.department?.trim(),
        pickupSpot: editFormData.pickupSpot?.trim(),
        avatar: editFormData.avatar?.trim() || undefined,
      });

      setProfile(res.data);
      await refreshUser();
      setIsEditModalOpen(false);
      setSaveSuccessMessage('Profile updated successfully.');
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 4000);
    } catch (err) {
      alert(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const [keycloakResendStatus, setKeycloakResendStatus] = useState(null);
  const [isResendingKeycloak, setIsResendingKeycloak] = useState(false);
  const [isCheckingKeycloak, setIsCheckingKeycloak] = useState(false);

  const handleResendKeycloakEmail = async () => {
    setIsResendingKeycloak(true);
    setKeycloakResendStatus(null);
    try {
      const res = await apiClient.post('/auth/resend-verification', { type: 'keycloak' });
      setKeycloakResendStatus(res?.message || 'Verification email dispatched to your inbox.');
    } catch (err) {
      setKeycloakResendStatus(err?.response?.data?.error?.message || err?.message || 'Failed to dispatch verification email.');
    } finally {
      setIsResendingKeycloak(false);
    }
  };

  const handleCheckKeycloakVerification = async () => {
    setIsCheckingKeycloak(true);
    try {
      const res = await refreshEmailVerification();
      if (res?.verified) {
        setKeycloakResendStatus('Email verified successfully!');
        const updated = await userService.getProfile();
        setProfile(updated);
      } else {
        setKeycloakResendStatus('Email is not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setKeycloakResendStatus(err?.message || 'Verification check failed.');
    } finally {
      setIsCheckingKeycloak(false);
    }
  };

  const handleResendVerification = async () => {
    if (!profile?.collegeEmail) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await authService.resendVerification(profile.collegeEmail);
      setResendStatus('Verification link dispatched to your institutional email.');
    } catch (err) {
      setResendStatus(err?.message || 'Unable to dispatch verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <PageHeader
          title="Student Profile"
          description="Your verified collegiate identity and campus listings."
        />
        <EmptyState
          icon={LogIn}
          title="Authentication Required"
          description="Please sign in with your student credentials to view and manage your profile."
          actionText="Sign In"
          actionTo="/login?redirect=/profile"
          actionIcon={LogIn}
          secondaryActionText="Browse Listings"
          secondaryActionTo="/listings"
        />
      </div>
    );
  }

  const activeCount = myListings.filter((item) => item.status !== 'sold' && item.status !== 'removed').length;
  const soldCount = myListings.filter((item) => item.status === 'sold').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Student Profile"
        description="Your verified collegiate identity and campus listings."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Collegiate Member
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              to="/my-listings"
              leftIcon={Package}
            >
              My Listings
            </Button>
            <Button
              variant="primary"
              size="sm"
              to="/sell"
              leftIcon={PlusCircle}
            >
              Post an Item
            </Button>
          </div>
        }
      />

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 text-[#16A34A] dark:text-[#22C55E] text-xs sm:text-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccessMessage(null)}
            className="text-[#16A34A] dark:text-[#22C55E] hover:opacity-80 font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Keycloak Account Email Verification Notice Banner */}
      {(keycloakEmailVerified === false || (profile && profile.keycloakEmailVerified === false)) && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Account Email Verification Required</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#6366F1] dark:bg-[#818CF8] text-white dark:text-[#09090B] hover:bg-[#4F46E5] dark:hover:bg-[#A5B4FC] transition"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Mailbox</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckKeycloakVerification}
                leftIcon={RefreshCw}
                isLoading={isCheckingKeycloak}
              >
                Check Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendKeycloakEmail}
                leftIcon={Send}
                isLoading={isResendingKeycloak}
              >
                Resend Link
              </Button>
            </div>
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Please verify your account email address (<strong>{profile.email}</strong>). We sent a confirmation link to your inbox.
          </p>
          {keycloakResendStatus && (
            <p className="font-semibold text-[#16A34A] dark:text-[#22C55E]">{keycloakResendStatus}</p>
          )}
        </div>
      )}

      {/* Institutional Verification Notice Banner */}
      {profile && !profile.isVerified && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Institutional Email Verification Pending</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              leftIcon={Send}
              isLoading={isResending}
            >
              Resend Link
            </Button>
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Verify your official email (<strong>{profile.collegeEmail}</strong>) to publish active marketplace items and trade on campus.
          </p>
          {resendStatus && (
            <p className="font-semibold text-[#16A34A] dark:text-[#22C55E]">{resendStatus}</p>
          )}
        </div>
      )}

      {/* Profile Details */}
      {loading ? (
        <LoadingState count={1} />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Could Not Load Profile"
          description={error}
          actionText="Try Again"
          onActionClick={() => window.location.reload()}
        />
      ) : profile ? (
        <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] p-5 sm:p-7 space-y-6 shadow-2xs">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-[#E4E4E7] dark:border-[#27272A]">
            {/* Avatar Container */}
            <div className="relative shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#6366F1]/30 dark:border-[#818CF8]/40 shadow-xs"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#EEF2FF] dark:bg-[#312E81]/30 items-center justify-center text-[#4F46E5] dark:text-[#A5B4FC] border-2 border-[#6366F1]/30 dark:border-[#818CF8]/40 flex font-bold text-2xl">
                  {profile.name?.charAt(0) || 'U'}
                </div>
              )}
              {profile.isVerified && (
                <span 
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#16A34A] dark:bg-[#22C55E] border-2 border-white dark:border-[#18181B] rounded-full flex items-center justify-center text-white" 
                  title="Verified Student ID"
                >
                  <ShieldCheck className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* User Details */}
            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight">
                      {profile.name}
                    </h1>
                    {profile.isVerified ? (
                      <Badge variant="primary" size="sm" icon={ShieldCheck}>
                        Verified (.edu)
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                    {profile.college}
                  </p>
                </div>

                {/* Edit Profile Button */}
                <Button
                  id="edit-profile-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  leftIcon={Edit3}
                  className="shrink-0"
                >
                  Edit Profile
                </Button>
              </div>

              {/* Department, Email & Metas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 truncate">
                  <School className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                  <span className="truncate">{profile.department || 'General Student'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                  <span className="font-mono text-[#18181B] dark:text-[#FAFAFA]">{profile.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                  <span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] shrink-0" />
                  <span className="truncate">Preferred: {profile.pickupSpot || 'Campus Meetup'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#FAFAFA] dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#27272A] text-center">
              <span className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">{activeCount}</span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Active Listings</span>
            </div>
            <div className="p-3 bg-[#FAFAFA] dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#27272A] text-center">
              <span className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">{soldCount}</span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] block">Completed Trades</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        title="Edit Profile"
        description="Update your public student name, department, or pickup location."
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button variant="outline" size="sm" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              leftIcon={CheckCircle2}
              isLoading={isSaving}
            >
              Save Profile
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <Input
            label="College / University"
            name="college"
            value={editFormData.college}
            onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
            required
          />

          <Input
            label="Department / Major"
            name="department"
            value={editFormData.department}
            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
            placeholder="e.g. Mechanical Engineering"
          />

          <Input
            label="Preferred Campus Pickup Spot"
            name="pickupSpot"
            value={editFormData.pickupSpot}
            onChange={(e) => setEditFormData({ ...editFormData, pickupSpot: e.target.value })}
            placeholder="e.g. Main Library Lobby"
          />

          <Input
            label="Avatar Image URL (Optional)"
            name="avatar"
            type="url"
            value={editFormData.avatar}
            onChange={(e) => setEditFormData({ ...editFormData, avatar: e.target.value })}
            placeholder="https://..."
            helperText="Must be a valid https:// image link"
          />
        </form>
      </Modal>
    </div>
  );
}
