import React, { useState } from 'react';

const SimpleNotificationTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(2);

  const handleClick = () => {
    console.log('Button clicked!');
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Simple Button Test */}
      <button 
        onClick={handleClick}
        className="relative h-9 w-9 rounded-xl bg-gray-100 hover:bg-orange-50 transition-all duration-300 flex items-center justify-center"
      >
        🔔
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Simple Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Notifications ({count})</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-900">Application Update</h4>
              <p className="text-sm text-blue-700">Your application has been reviewed.</p>
              <span className="text-xs text-blue-600">2 minutes ago</span>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <h4 className="font-medium text-orange-900">New Job Match</h4>
              <p className="text-sm text-orange-700">New position available.</p>
              <span className="text-xs text-orange-600">1 hour ago</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button 
              onClick={() => {
                setCount(0);
                alert('All notifications marked as read!');
              }}
              className="w-full text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg text-sm font-medium"
            >
              Mark all as read
            </button>
          </div>
          
          <div className="mt-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full text-gray-600 hover:bg-gray-50 py-2 px-4 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleNotificationTest;
