import React from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';
import { Button } from './button';

const LogoutDialog = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Confirm Logout</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 text-base leading-relaxed">
              {userName ? (
                <>
                  <span className="font-semibold">{userName}</span>, are you sure you want to logout from your account?
                </>
              ) : (
                'Are you sure you want to logout from your account?'
              )}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              You'll need to login again to access your dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Yes, Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutDialog;
