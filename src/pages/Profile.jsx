import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  Award,
  UserCheck,
  User
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { Badge, Button, Input, Modal, EmptyState, LoadingState } from '../components';
import { userService } from '../services/userService';
import { useListings } from '../context';

export default function Profile() {
  useDocumentTitle('Student Profile');

  const { listings } = useListings();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      // Clean production UI: do not auto-load fake dev fixtures
      const data = await userService.getProfile(false);
      if (isMounted) {
        setProfile(data);
        if (data) {
          setEditFormData({ ...data });
        }
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEdit = () => {
    if (profile) {
      setEditFormData({ ...profile });
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const res = await userService.updateProfile(editFormData);
    setProfile(res.data);
    setIsEditModalOpen(false);
    setSaveSuccessMessage(res.message);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  const activeCount = listings.filter((item) => item.status !== 'sold').length;
  const soldCount = listings.filter((item) => item.status === 'sold').length;

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
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Details or Empty State */}
      {loading ? (
        <LoadingState count={1} />
      ) : profile ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 space-y-6 shadow-2xs">
          {/* Profile Header: Avatar, Name, College, Email, Joined Date, Edit Button */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Avatar Container */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-600/30 dark:border-emerald-500/40 shadow-xs"
                />
              ) : null}
              <div className={`${profile.avatarUrl ? 'hidden' : 'flex'} w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400 border-2 border-emerald-600/30`}>
                <User className="w-10 h-10" />
              </div>
              <span 
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white" 
                title="Verified Student ID"
              >
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            {/* User Details */}
            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {profile.name}
                    </h1>
                    <Badge variant="primary" size="sm" icon={ShieldCheck}>
                      Verified (.edu)
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
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

              {/* Department, Email & Joined Date meta items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 truncate">
                  <School className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{profile.department}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-700 dark:text-slate-200">{profile.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Joined {profile.joinedDate}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Preferred: {profile.pickupSpot}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                About {profile.name.split(' ')[0]}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Real Listing Counts from Shared State */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <Link 
              to="/my-listings" 
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800 transition-colors block group"
            >
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{activeCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Listings</div>
            </Link>

            <Link 
              to="/my-listings" 
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800 transition-colors block group"
            >
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{soldCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Items Sold</div>
            </Link>
          </div>

          {/* Verified Student Badges / Trust Info */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-950 dark:text-emerald-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">Collegiate Safety Record</div>
                <div className="text-emerald-800 dark:text-emerald-300">Always meet in daylight in public campus buildings.</div>
              </div>
            </div>
            <Link 
              to="/my-listings" 
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold inline-flex items-center gap-1 shrink-0"
            >
              <span>Manage My Listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No Profile Connected"
          description="Sign in with your university student email or connect the backend API to view your student profile, listings, and trade history."
          actionLabel="Sign In"
          actionTo="/login"
        />
      )}

      {/* Edit Profile Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        title="Edit Student Profile"
        description="Update your preferred meeting spot, department, or campus bio."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseEdit}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              leftIcon={CheckCircle2}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={editFormData.name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <Input
            label="College / University"
            name="college"
            value={editFormData.college || ''}
            onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
            required
          />

          <Input
            label="Department / Major"
            name="department"
            value={editFormData.department || ''}
            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
            required
          />

          <Input
            label="Preferred Campus Pickup Spot"
            name="pickupSpot"
            value={editFormData.pickupSpot || ''}
            onChange={(e) => setEditFormData({ ...editFormData, pickupSpot: e.target.value })}
            helperText="e.g. Science Library, Student Activity Center, Main Cafeteria"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campus Bio
            </label>
            <textarea
              rows={3}
              value={editFormData.bio || ''}
              onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 p-3 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
