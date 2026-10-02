import React, { useState } from 'react';
import { 
  PlusCircle, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  ShieldCheck,
  Tag,
  RefreshCw
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../layouts';
import { 
  Button, 
  Badge, 
  EmptyState, 
  Modal, 
  Input 
} from '../components';
import { formatPrice } from '../utils/formatters';
import { useListings } from '../context';

export default function MyListings() {
  useDocumentTitle('My Listings');

  const { listings, updateListing, deleteListing, markListingSold, relistListingActive } = useListings();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'sold'
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    price: '',
    category: '',
    condition: '',
    description: '',
  });

  // Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState(null);

  // Filter listings by current tab (status 'sold' vs anything active/available)
  const activeListings = listings.filter((item) => item.status !== 'sold');
  const soldListings = listings.filter((item) => item.status === 'sold');
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  const showTemporaryFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Mark as sold handler
  const handleMarkAsSold = (id) => {
    markListingSold(id);
    showTemporaryFeedback('Listing marked as sold and moved to Sold tab.');
  };

  // Re-list item handler
  const handleRelistAsActive = (id) => {
    relistListingActive(id);
    showTemporaryFeedback('Item re-listed as active.');
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title,
      price: item.price.toString(),
      category: item.category,
      condition: item.condition,
      description: item.description,
    });
  };

  // Save Edit Changes
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    updateListing(editingItem.id, {
      title: editFormData.title,
      price: parseFloat(editFormData.price) || 0,
      category: editFormData.category,
      condition: editFormData.condition,
      description: editFormData.description,
    });

    setEditingItem(null);
    showTemporaryFeedback('Listing details updated locally in session.');
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteListing(deletingItem.id);
    setDeletingItem(null);
    showTemporaryFeedback('Listing removed from your records.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Campus Listings"
        description="Manage your active classified posts, mark items as sold, or update prices."
        badge={
          <Badge variant="primary" size="sm" icon={ShieldCheck}>
            {activeListings.length} Active • {soldListings.length} Sold
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            to="/sell"
            leftIcon={PlusCircle}
          >
            Post an Item
          </Button>
        }
      />

      {/* Temporary Alert Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Active Listings Tab */}
          <button
            type="button"
            id="tab-active-listings"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Active Listings</span>
            <span 
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                activeTab === 'active' ? 'bg-slate-700 dark:bg-emerald-800 text-slate-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {activeListings.length}
            </span>
          </button>

          {/* Sold Listings Tab */}
          <button
            type="button"
            id="tab-sold-listings"
            onClick={() => setActiveTab('sold')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'sold'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Sold Listings</span>
            <span 
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                activeTab === 'sold' ? 'bg-slate-700 dark:bg-emerald-800 text-slate-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {soldListings.length}
            </span>
          </button>
        </div>
      </div>

      {/* Listings List / Grid */}
      {displayedListings.length > 0 ? (
        <div className="space-y-4">
          {displayedListings.map((item) => {
            const itemImage = (item.images && item.images[0]) || item.image;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 ${
                  item.status === 'sold' ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 opacity-90' : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Item Info (Image + Details) */}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {itemImage ? (
                      <>
                        <img
                          src={itemImage}
                          alt={item.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                          className={`w-full h-full object-cover ${item.status === 'sold' ? 'grayscale-[40%]' : ''}`}
                        />
                        <div className="hidden w-full h-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <Tag className="w-6 h-6" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                    {item.status === 'sold' && (
                      <span className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white text-[10px] font-extrabold uppercase tracking-wider">
                        Sold
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100 truncate block">
                        {item.title}
                      </span>
                      <Badge variant={item.status === 'sold' ? 'default' : 'success'} size="sm">
                        {item.status === 'sold' ? 'Sold' : 'Active'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {formatPrice(item.price)}
                      </span>
                      <span>•</span>
                      <span>{item.categoryName || item.category}</span>
                      <span>•</span>
                      <span>{item.condition}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.postedAt || 'Recently'}</span>
                      </span>
                    </div>

                    {item.status === 'sold' && item.soldTo && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        Sold to: {item.soldTo}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  {item.status !== 'sold' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSold(item.id)}
                        leftIcon={CheckCircle2}
                        className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        Mark as Sold
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        leftIcon={Edit3}
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
                    >
                      Re-list as Active
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(item)}
                    leftIcon={Trash2}
                    className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label="Delete listing"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Reusable Empty State */
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
          actionLabel={activeTab === 'active' ? 'Post Your First Item' : 'View Active Listings'}
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
        description="Update your item pricing, description, or condition."
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
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                leftIcon={IndianRupee}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Condition
                </label>
                <select
                  value={editFormData.condition}
                  onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 px-3.5 py-2.5 shadow-2xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 p-3 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
              />
            </div>
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
                This will delete <strong>"{deletingItem.title}"</strong> ({formatPrice(deletingItem.price)}) from your listings. This action cannot be undone.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
