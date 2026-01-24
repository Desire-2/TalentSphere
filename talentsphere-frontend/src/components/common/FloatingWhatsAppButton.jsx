import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FloatingWhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const whatsappGroupUrl = 'https://chat.whatsapp.com/IQ4H8XNYzXe6aU5rrPpUJl';

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
      {/* Floating Community Call-To-Action Text */}
      <div className="absolute bottom-24 sm:bottom-28 right-0 whitespace-nowrap animate-slideDown">
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg text-xs sm:text-sm font-bold animate-bounce flex items-center space-x-2">
          <span className="inline-block animate-pulse">🎉</span>
          <span>Join Our Community!</span>
          <ChevronDown className="w-3 h-3 animate-bounce" style={{ animationDelay: '0.1s' }} />
        </div>
      </div>

      {/* Notification pulse indicator */}
      <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>

      {/* Floating button */}
      <div
        className="group relative flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a
          href={whatsappGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>

          {/* Main button */}
          <div className="relative w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-emerald-500/50 overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Custom Image Icon */}
            <img 
              src="/image.png" 
              alt="Join Community" 
              className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 group-hover:scale-125 transition-all duration-300 object-contain"
            />

            {/* Rotating border effect */}
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-white border-r-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
        </a>

        {/* Tooltip/label */}
        {isHovered && (
          <div className="absolute bottom-20 sm:bottom-24 right-0 whitespace-nowrap z-50">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold animate-fadeInUp flex items-center space-x-2">
              <span>Join Our WhatsApp Group</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-emerald-600"></div>
          </div>
        )}
      </div>

      {/* Animated Floating Labels */}
      <div className="group absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full pointer-events-none">
        {/* Label 1 - Join Now */}
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce">
          <div className="text-xs sm:text-sm font-bold text-green-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-md">Get Direct Updates</div>
        </div>

        {/* Label 2 - Left side */}
        <div className="absolute top-1/2 -left-24 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-slideLeft">
          <div className="text-xs sm:text-sm font-bold text-emerald-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-md">Real-Time Notifications</div>
        </div>

        {/* Label 3 - Right side */}
        <div className="absolute top-1/2 -right-20 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-slideRight">
          <div className="text-xs sm:text-sm font-bold text-teal-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-md">Join Community</div>
        </div>
      </div>
    </div>
  );
};

export default FloatingWhatsAppButton;
