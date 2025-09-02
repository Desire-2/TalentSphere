import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Briefcase, 
  Building, 
  Settings,
  Search,
  Star,
  CreditCard,
  Clock,
  ExternalLink,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Archive
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const EnhancedNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    stats,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    formattedNotifications
  } = useNotifications({
    autoFetch: true,
    enablePolling: true,
    pollingInterval: 30000,
    enableToast: true
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter notifications based on current filters
  const filteredNotifications = formattedNotifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.is_read) return false;
    if (filter === 'read' && !notification.is_read) return false;
    
    // Filter by type
    if (selectedType !== 'all' && notification.notification_type !== selectedType) return false;
    
    // Filter by search query
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const getNotificationIcon = (type, isRead = false) => {
    const iconClass = `h-4 w-4 ${isRead ? 'text-gray-400' : ''}`;
    
    switch (type) {
      case 'application_status':
        return <Briefcase className={`${iconClass} text-blue-500`} />;
      case 'job_alert':
        return <Search className={`${iconClass} text-green-500`} />;
      case 'message':
        return <MessageSquare className={`${iconClass} text-purple-500`} />;
      case 'system':
        return <Settings className={`${iconClass} text-gray-500`} />;
      case 'company':
        return <Building className={`${iconClass} text-orange-500`} />;
      case 'payment':
        return <CreditCard className={`${iconClass} text-emerald-500`} />;
      case 'promotion':
        return <Star className={`${iconClass} text-yellow-500`} />;
      default:
        return <Bell className={`${iconClass} text-blue-500`} />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">High</Badge>;
      case 'normal':
        return null;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    
    // Navigate if action URL exists
    if (notification.action_url) {
      setIsOpen(false);
      window.location.href = notification.action_url;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeDisplayName = (type) => {
    const typeNames = {
      application_status: 'Applications',
      job_alert: 'Job Alerts',
      message: 'Messages',
      system: 'System',
      company: 'Company',
      payment: 'Payment',
      promotion: 'Promotions'
    };
    return typeNames[type] || type;
  };

  const uniqueTypes = [...new Set(notifications.map(n => n.notification_type))];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 hover:scale-105"
        aria-label="Toggle notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs flex items-center justify-center animate-pulse border-2 border-white p-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Enhanced Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Enhanced Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refresh()}
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  <Clock className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs hover:bg-blue-50 hover:text-blue-600 h-8"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                {/* Filter buttons */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="h-7 text-xs"
                  >
                    All ({notifications.length})
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="h-7 text-xs"
                  >
                    Unread ({unreadCount})
                  </Button>
                </div>

                {/* Type filter dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      {selectedType === 'all' ? 'All Types' : getTypeDisplayName(selectedType)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedType('all')}>
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {uniqueTypes.map(type => (
                      <DropdownMenuItem 
                        key={type} 
                        onClick={() => setSelectedType(type)}
                      >
                        {getNotificationIcon(type)}
                        <span className="ml-2">{getTypeDisplayName(type)}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'No matching notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? 'Try adjusting your search terms' : "We'll notify you when something happens"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md group relative ${
                          !notification.is_read
                            ? 'bg-blue-50/50 border border-blue-100 hover:bg-blue-50'
                            : 'bg-white hover:bg-gray-50 border border-gray-100'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 relative">
                            {getNotificationIcon(notification.notification_type, notification.is_read)}
                            {!notification.is_read && (
                              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${notification.priorityColor || 'bg-orange-500'}`} />
                            )}
                            {notification.isRecent && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className={`text-sm font-medium text-gray-900 ${
                                !notification.is_read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1 ml-2">
                                {getPriorityBadge(notification.priority)}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {notification.timeAgo}
                              </span>
                              
                              {notification.action_text && (
                                <div className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  <span>{notification.action_text}</span>
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </div>
                              )}
                            </div>

                            {/* Related object info */}
                            {notification.related_job && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                <span className="font-medium">{notification.related_job.title}</span>
                                {notification.related_job.company_name && (
                                  <span className="text-gray-600"> at {notification.related_job.company_name}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.is_read ? (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  // Implement mark as unread if needed
                                }}>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Mark as unread
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Implement archive functionality
                              }}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Implement delete functionality
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full hover:bg-gray-50"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                        ) : null}
                        Load more notifications
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {stats && (
                  <span>
                    {stats.notifications.total} total • {stats.notifications.recent} recent
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationDropdown;
