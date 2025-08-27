import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink,
  Award,
  Eye,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import apiService from '../services/api';

const FeaturedAdsCarousel = () => {
  const [featuredAds, setFeaturedAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeaturedAds();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || featuredAds.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredAds.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredAds.length]);

  const loadFeaturedAds = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicFeaturedAds(5);
      setFeaturedAds(response.featured_ads || []);
    } catch (error) {
      console.error('Error loading featured ads:', error);
      setError(error.message);
      // Fallback to mock data
      setFeaturedAds([
        {
          id: 1,
          type: 'job_promotion',
          title: 'Senior React Developer - Remote Opportunity',
          description: 'Build the next generation of web applications with cutting-edge technologies. Competitive salary, full benefits, and unlimited PTO.',
          image: '/api/placeholder/800/400',
          company: {
            name: 'InnovateLabs',
            logo: '/api/placeholder/80/80',
            location: 'Remote'
          },
          job: {
            id: 1,
            salary_min: 120000,
            salary_max: 160000,
            salary_currency: 'USD',
            employment_type: 'full-time'
          },
          callToAction: 'Apply Now',
          link: '/jobs/1',
          stats: {
            impressions: 12450,
            clicks: 734,
            applications: 89
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? featuredAds.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === featuredAds.length - 1 ? 0 : currentIndex + 1);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleAdClick = (ad) => {
    console.log(`Featured ad clicked: ${ad.title}`);
    window.open(ad.link, '_blank');
  };

  if (loading) {
    return (
      <div className="h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading featured opportunities...</span>
      </div>
    );
  }

  if (error || featuredAds.length === 0) {
    return null; // Hide carousel if no ads
  }

  const currentAd = featuredAds[currentIndex];

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden carousel-container animate-fade-in">
      {/* Main Carousel Content */}
      <div className="relative h-96 md:h-80 overflow-hidden">
        {featuredAds.map((ad, index) => (
          <div
            key={ad.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 transform translate-x-0' 
                : 'opacity-0 transform translate-x-full'
            }`}
          >
            <div className="flex flex-col md:flex-row h-full">
              {/* Image Section */}
              <div className="md:w-1/2 h-48 md:h-full relative overflow-hidden">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>
                
                {/* Featured Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-600 text-white flex items-center gap-1 shadow-lg">
                    <Award className="w-3 h-3" />
                    Featured
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                {/* Company Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={ad.company.logo}
                    alt={ad.company.name}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {ad.company.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{ad.company.location}</p>
                  </div>
                </div>

                {/* Title and Description */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                  {ad.title}
                </h2>
                
                <p className="text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>

                {/* Job Details */}
                {ad.job && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ad.job.salary_min && ad.job.salary_max && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ${ad.job.salary_min.toLocaleString()} - ${ad.job.salary_max.toLocaleString()}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {ad.job.employment_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                )}

                {/* Stats and CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {ad.stats.impressions?.toLocaleString() || '0'} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3" />
                      {ad.stats.clicks || 0} clicks
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAdClick(ad)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg group"
                  >
                    {ad.callToAction}
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {featuredAds.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Previous ad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Next ad"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {featuredAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play Control */}
          <button
            onClick={toggleAutoPlay}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Progress Bar */}
          {isAutoPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 progress-fill"
                key={currentIndex} // Reset animation on slide change
              ></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeaturedAdsCarousel;
