import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  IndianRupee, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  ShieldCheck,
  Tag,
  RefreshCw,
  LogIn,
  X,
  MapPin
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { 
  Button, 
  Badge, 
  EmptyState, 
  Modal, 
  Input,
  LoadingState,
  ErrorState
} from '../components';
import { formatPrice } from '../utils/formatters';
import { useListings } from '../context';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES_LIST = [
  'Books',
  'Electronics',
  'Lab Equipment',
  'Bicycles',
  'Notes',
  'Lab Coat',
  'Engineering Drafter',
  'Hostel Items',
  'Other',
];

const CONDITIONS_LIST = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

const getImageUrl = (img) => (typeof img === 'object' && img !== null ? img.url : img);

export default function MyListings() {
  useDocumentTitle('My Listings | Campus Marketplace');

  const { isAuthenticated } = useAuth();
  const { 
    myListings, 
    loading, 
    error, 
    fetchMyListings, 
    updateListing, 
    deleteListing, 
    updateListingStatus, 
    deleteListingImage 
  } = useListings();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'sold'
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    price: '',
    category: 'Books',
    condition: 'Good',
    description: '',
    location: '',
  });

  // Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState(null);

  const showTemporaryFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Filter listings by current tab
  const activeListings = myListings.filter((item) => item.status !== 'sold' && item.status !== 'removed');
  const soldListings = myListings.filter((item) => item.status === 'sold');
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  // Mark as sold handler
  const handleMarkAsSold = async (id) => {
    try {
      setActionLoading(true);
      await updateListingStatus(id, 'sold');
      showTemporaryFeedback('Listing marked as sold and moved to Sold tab.');
    } catch (err) {
      showTemporaryFeedback(err?.message || 'Failed to update listing status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Re-list item handler
  const handleRelistAsActive = async (id) => {
    try {
      setActionLoading(true);
      await updateListingStatus(id, 'active');
      showTemporaryFeedback('Item re-listed as active.');
    } catch (err) {
      showTemporaryFeedback(err?.message || 'Failed to re-list item.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title,
      price: item.price.toString(),
      category: item.categoryName || item.category,
      condition: item.condition,
      description: item.description,
      location: item.location || 'Campus Meetup',
    });
  };

  // Save Edit Changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setActionLoading(true);
      await updateListing(editingItem.id, {
        title: editFormData.title,
        price: parseFloat(editFormData.price) || 0,
        category: editFormData.category,
        condition: editFormData.condition,
        description: editFormData.description,
        location: editFormData.location,
      });

      setEditingItem(null);
      showTemporaryFeedback('Listing details updated successfully.');
    } catch (err) {
      showTemporaryFeedback(err?.message || 'Failed to update listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single image from existing listing
  const handleDeleteImage = async (publicId) => {
    if (!editingItem || !publicId) return;
    try {
      const updated = await deleteListingImage(editingItem.id, publicId);
      setEditingItem(updated);
      showTemporaryFeedback('Image deleted from listing.');
    } catch (err) {
      showTemporaryFeedback(err?.message || 'Failed to delete image.');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setActionLoading(true);
      await deleteListing(deletingItem.id);
      setDeletingItem(null);
      showTemporaryFeedback('Listing removed from your records.');
    } catch (err) {
      showTemporaryFeedback(err?.message || 'Failed to delete listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-6">
        <PageHeader
          title="My Campus Listings"
          description="Manage your active classified posts, mark items as sold, or update prices."
        />
        <EmptyState
          icon={LogIn}
          title="Authentication Required"
          description="Please sign in with your student account to view and manage your marketplace listings."
          actionText="Sign In"
          actionTo="/login?redirect=/my-listings"
          actionIcon={LogIn}
          secondaryActionText="Browse Listings"
          secondaryActionTo="/listings"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Campus Listings"
        description="Manage your active classified posts, mark items as sold, or update prices."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            Seller Dashboard
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            to="/sell"
            leftIcon={PlusCircle}
          >
            Post New Item
          </Button>
        }
      />

      {/* Temporary Feedback Notification Banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#16A34A]/30 rounded-xl text-xs text-[#16A34A] dark:text-[#22C55E] flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#22C55E] shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-[#16A34A] dark:text-[#22C55E] hover:opacity-80 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Filter Bar (Active vs Sold) */}
      <div className="flex items-center justify-between border-b border-[#E4E4E7] dark:border-[#27272A] pb-px">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'border-[#6366F1] dark:border-[#818CF8] text-[#4F46E5] dark:text-[#A5B4FC]'
                : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Active Listings ({activeListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sold')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sold'
                ? 'border-[#6366F1] dark:border-[#818CF8] text-[#4F46E5] dark:text-[#A5B4FC]'
                : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA]'
            }`}
          >
            Sold & Archived ({soldListings.length})
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchMyListings()}
          leftIcon={RefreshCw}
          className="text-xs text-slate-500"
        >
          Refresh
        </Button>
      </div>

      {/* Main Listing List */}
      {loading ? (
        <LoadingState message="Loading your campus listings..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Your Listings"
          message={error}
          onRetry={() => fetchMyListings()}
        />
      ) : displayedListings.length > 0 ? (
        <div className="space-y-3">
          {displayedListings.map((item) => {
            const rawPrimary = item.images && item.images.length > 0 ? item.images[0] : null;
            const primaryImgUrl = getImageUrl(rawPrimary);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#6366F1]/40 dark:hover:border-[#818CF8]/40 transition-colors"
              >
                {/* Item Thumbnail & Information */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#27272A] shrink-0">
                    {primaryImgUrl ? (
                      <img
                        src={primaryImgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A] dark:text-[#A1A1AA]">
                        <Tag className="w-5 h-5 text-[#71717A]/60 dark:text-[#A1A1AA]/60" />
                        <span className="text-[9px] mt-0.5">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/listings/${item.id}`}
                        className="text-sm font-bold text-[#18181B] dark:text-[#FAFAFA] hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <Badge
                        variant={item.status === 'sold' ? 'default' : 'success'}
                        size="sm"
                      >
                        {item.status === 'sold' ? 'Sold' : 'Active'}
                      </Badge>
                    </div>

                    <div className="text-sm font-extrabold text-[#18181B] dark:text-[#FAFAFA]">
                      {formatPrice(item.price)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      <span>{item.categoryName || item.category}</span>
                      <span>•</span>
                      <span>Condition: {item.condition}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location || 'Campus Meetup'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Management Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.status !== 'sold' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSold(item.id)}
                        leftIcon={CheckCircle2}
                        disabled={actionLoading}
                      >
                        Mark as Sold
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        leftIcon={Edit3}
                        disabled={actionLoading}
                      >
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRelistAsActive(item.id)}
                      leftIcon={RotateCcw}
                      disabled={actionLoading}
                    >
                      Re-list as Active
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(item)}
                    leftIcon={Trash2}
                    className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#DC2626] dark:hover:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30"
                    aria-label="Delete listing"
                    disabled={actionLoading}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={activeTab === 'active' ? PlusCircle : CheckCircle2}
          title={
            activeTab === 'active'
              ? "You haven't listed anything yet"
              : 'No items marked as sold yet'
          }
          description={
            activeTab === 'active'
              ? 'You do not have any active campus classifieds listings. List textbooks, lab coats, or calculators to connect with students.'
              : 'Items you mark as completed exchanges will be archived here for your records.'
          }
          actionText={activeTab === 'active' ? 'Post Your First Item' : 'View Active Listings'}
          actionTo={activeTab === 'active' ? '/sell' : undefined}
          actionIcon={activeTab === 'active' ? PlusCircle : RefreshCw}
          onActionClick={activeTab === 'sold' ? () => setActiveTab('active') : undefined}
        />
      )}

      {/* Edit Listing Modal Dialog */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Listing"
        description="Update your item pricing, description, location, or condition."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEdit}
              leftIcon={CheckCircle2}
              isLoading={actionLoading}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Item Title"
              name="title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Price (₹)"
                name="price"
                type="number"
                min="0"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                leftIcon={IndianRupee}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  Condition
                </label>
                <select
                  value={editFormData.condition}
                  onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-sm text-[#18181B] dark:text-[#FAFAFA] px-3.5 py-2.5 shadow-2xs focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:outline-none"
                >
                  {CONDITIONS_LIST.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-sm text-[#18181B] dark:text-[#FAFAFA] px-3.5 py-2.5 shadow-2xs focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:outline-none"
                >
                  {CATEGORIES_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Campus Pickup Location"
                name="location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="e.g. Central Library"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Description
              </label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-sm text-[#18181B] dark:text-[#FAFAFA] p-3 shadow-2xs placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#6366F1] dark:focus:border-[#818CF8]"
              />
            </div>

            {/* Existing Images Management */}
            {editingItem.images && editingItem.images.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  Attached Photos ({editingItem.images.length})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {editingItem.images.map((img, idx) => {
                    const imgUrl = getImageUrl(img);
                    const publicId = typeof img === 'object' ? img.publicId : null;
                    return (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-[#E4E4E7] dark:border-[#27272A] aspect-square">
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {publicId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(publicId)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                            title="Delete image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal Dialog */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Delete Listing"
        description="Are you sure you want to remove this item from your campus listings?"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              leftIcon={Trash2}
              isLoading={actionLoading}
            >
              Delete Listing
            </Button>
          </div>
        }
      >
        {deletingItem && (
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>
                This will soft-delete <strong>"{deletingItem.title}"</strong> ({formatPrice(deletingItem.price)}) from your listings. This preserves past student messages while removing the item from public searches.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
