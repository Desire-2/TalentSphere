import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { EMAIL_CONFIG } from '../../config/environment';

/**
 * ContactInfo Component
 * Displays contact information using environment configuration
 * Usage: <ContactInfo type="support" /> or <ContactInfo type="contact" />
 */
const ContactInfo = ({ 
  type = 'support', 
  showIcon = true, 
  className = '',
  variant = 'default' 
}) => {
  const getEmailByType = (type) => {
    switch (type) {
      case 'support':
        return EMAIL_CONFIG.SUPPORT;
      case 'contact':
        return EMAIL_CONFIG.CONTACT;
      case 'noreply':
        return EMAIL_CONFIG.NOREPLY;
      default:
        return EMAIL_CONFIG.SUPPORT;
    }
  };

  const getDisplayText = (type) => {
    switch (type) {
      case 'support':
        return 'Support';
      case 'contact':
        return 'Contact Us';
      case 'noreply':
        return 'Notifications';
      default:
        return 'Support';
    }
  };

  const email = getEmailByType(type);
  const displayText = getDisplayText(type);

  const baseStyles = "inline-flex items-center gap-2 transition-colors duration-200";
  const variantStyles = {
    default: "text-blue-600 hover:text-blue-800",
    muted: "text-gray-600 hover:text-gray-800",
    white: "text-white hover:text-gray-200",
    accent: "text-purple-600 hover:text-purple-800"
  };

  return (
    <a 
      href={`mailto:${email}`}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      title={`Send email to ${displayText}`}
    >
      {showIcon && <Mail size={16} />}
      <span className="font-medium">{email}</span>
    </a>
  );
};

/**
 * FullContactCard Component
 * Complete contact information card
 */
export const FullContactCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Mail className="text-blue-600" size={20} />
        Get in Touch
      </h3>
      
      <div className="space-y-4">
        {/* Support Email */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="text-blue-600" size={16} />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Technical Support</h4>
            <ContactInfo type="support" showIcon={false} className="text-sm" />
            <p className="text-xs text-gray-600 mt-1">
              For technical issues, password reset, and account problems
            </p>
          </div>
        </div>

        {/* General Contact */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Phone className="text-green-600" size={16} />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">General Inquiries</h4>
            <ContactInfo type="contact" showIcon={false} className="text-sm" />
            <p className="text-xs text-gray-600 mt-1">
              For partnerships, feedback, and general questions
            </p>
          </div>
        </div>

        {/* Business Hours */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="text-purple-600" size={16} />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Business Hours</h4>
            <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM (EAT)</p>
            <p className="text-xs text-gray-600 mt-1">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <strong className="text-gray-800">AfriTech Bridge</strong> - Connecting African talent with global opportunities
        </p>
      </div>
    </div>
  );
};

/**
 * Footer Contact Component
 * Minimal contact info for footers
 */
export const FooterContact = ({ variant = 'muted', className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <ContactInfo type="support" variant={variant} />
      <span className={`hidden sm:inline ${variant === 'white' ? 'text-white' : 'text-gray-400'}`}>|</span>
      <ContactInfo type="contact" variant={variant} />
    </div>
  );
};

export default ContactInfo;
