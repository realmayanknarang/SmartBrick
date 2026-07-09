/**
 * client/src/pages/marketplace/OwnerNotificationsPage.jsx
 *
 * Owner Notifications Page — Sub-phase M4F.
 * Refactored in M5F to use the shared NotificationsList component.
 * Navigation targets remain owner-specific.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import NotificationsList from '../../components/marketplace/NotificationsList';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import './OwnerNotificationsPage.css';

function OwnerNotificationsPage() {
  const navigate = useNavigate();
  const { setUnreadCount } = useOutletContext();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/marketplace/notifications');
      setNotifications(res.data.notifications || []);
      if (setUnreadCount) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[OwnerNotificationsPage] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/marketplace/notifications/mark-read');
      toast.success('All notifications marked as read.');
      await fetchNotifications();
    } catch (err) {
      console.error('[OwnerNotificationsPage] Bulk mark read failed:', err);
      toast.error('Failed to mark notifications as read.');
    }
  };

  const handleNotificationClick = async (item) => {
    // Mark single notification as read in background
    if (!item.isRead) {
      try {
        await apiClient.patch(`/marketplace/notifications/${item._id}/mark-read`);
      } catch (err) {
        console.error('[OwnerNotificationsPage] Mark read failed:', err);
      }
    }

    // Owner-specific navigation routing
    let target = '/marketplace/owner/projects';
    if (item.relatedProject) {
      switch (item.type) {
        case 'proposal_received':
        case 'proposal_approved':
        case 'proposal_rejected':
          target = `/marketplace/owner/projects/${item.relatedProject}`;
          break;
        case 'progress_update':
        case 'milestone_completed':
          target = `/marketplace/owner/projects/${item.relatedProject}/progress`;
          break;
        case 'new_message':
          target = `/marketplace/owner/projects/${item.relatedProject}/chat`;
          break;
        default:
          target = `/marketplace/owner/projects/${item.relatedProject}`;
          break;
      }
    }
    navigate(target);
  };

  return (
    <div className="owner-notifications-page">
      <NotificationsList
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onNotificationClick={handleNotificationClick}
        isLoading={loading}
        emptyDescription="You will receive updates here when builders submit proposals or update project progress."
      />
    </div>
  );
}

export default OwnerNotificationsPage;
