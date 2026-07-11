/**
 * client/src/pages/marketplace/BuilderNotificationsPage.jsx
 *
 * Builder Notifications Page — Sub-phase M5F.
 * Renders notifications using the shared NotificationsList component.
 * Navigation targets are builder-specific (different from M4F owner routes).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import NotificationsList from '../../components/marketplace/NotificationsList';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

function BuilderNotificationsPage() {
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
      // Update sidebar badge via outlet context
      if (setUnreadCount) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[BuilderNotificationsPage] Fetch failed:', err);
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
      console.error('[BuilderNotificationsPage] Bulk mark read failed:', err);
      toast.error('Failed to mark notifications as read.');
    }
  };

  const handleNotificationClick = async (item) => {
    // Mark single notification as read in background
    if (!item.isRead) {
      try {
        await apiClient.patch(`/marketplace/notifications/${item._id}/mark-read`);
      } catch (err) {
        console.error('[BuilderNotificationsPage] Mark read failed:', err);
      }
    }

    // Builder-specific navigation routing
    const projectId = item.relatedProject;
    let target = '/marketplace/builder/proposals';

    if (projectId) {
      switch (item.type) {
        case 'proposal_approved':
          target = '/marketplace/builder/proposals';
          break;
        case 'proposal_rejected':
          target = '/marketplace/builder/proposals';
          break;
        case 'progress_update':
        case 'milestone_completed':
          target = `/marketplace/builder/workspace/${projectId}`;
          break;
        case 'new_message':
          target = `/marketplace/builder/workspace/${projectId}?tab=chat`;
          break;
        default:
          target = '/marketplace/builder/proposals';
          break;
      }
    }

    navigate(target);
  };

  return (
    <NotificationsList
      notifications={notifications}
      onMarkAllRead={handleMarkAllRead}
      onNotificationClick={handleNotificationClick}
      isLoading={loading}
      emptyDescription="You will receive updates here when owners respond to your proposals or there is project activity."
    />
  );
}

export default BuilderNotificationsPage;
