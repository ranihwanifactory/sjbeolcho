import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Crosshair } from 'lucide-react';

interface KakaoMapProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  readOnly?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMap: React.FC<KakaoMapProps> = ({ 
    onLocationSelect, 
    initialLat, 
    initialLng, 
    readOnly = false 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Default: Seongju County Office
  const DEFAULT_LAT = 35.919069; 
  const DEFAULT_LNG = 128.283038;

  useEffect(() => {
    if (!window.kakao || !mapContainer.current) return;

    window.kakao.maps.load(() => {
      const centerLat = initialLat || DEFAULT_LAT;
      const centerLng = initialLng || DEFAULT_LNG;
      
      const options = {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level: 3,
        mapTypeId: window.kakao.maps.MapTypeId.HYBRID
      };
      const createdMap = new window.kakao.maps.Map(mapContainer.current, options);
      setMap(createdMap);

      const markerPosition = new window.kakao.maps.LatLng(centerLat, centerLng);
      const createdMarker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      createdMarker.setMap(createdMap);
      setMarker(createdMarker);

      if (!readOnly) {
          // Click event
          window.kakao.maps.event.addListener(createdMap, 'click', (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            createdMarker.setPosition(latlng);
            
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const addr = result[0].address ? result[0].address.address_name : '주소 정보 없음';
                setAddress(addr);
                if(onLocationSelect) onLocationSelect(latlng.getLat(), latlng.getLng(), addr);
              }
            });
          });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLat, initialLng, readOnly]); // Re-init if props change significantly

  const handleSearch = () => {
    if (readOnly || !map || !searchQuery) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchQuery, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const place = data[0];
        const lat = place.y;
        const lng = place.x;
        
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        map.setCenter(moveLatLon);
        marker.setPosition(moveLatLon);
        
        setAddress(place.address_name || place.place_name);
        if(onLocationSelect) onLocationSelect(parseFloat(lat), parseFloat(lng), place.address_name || place.place_name);
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locPosition = new window.kakao.maps.LatLng(lat, lng);
        
        if (map) {
          map.setCenter(locPosition);
          marker.setPosition(locPosition);
          
          if (!readOnly) {
              const geocoder = new window.kakao.maps.services.Geocoder();
              geocoder.coord2Address(lng, lat, (result: any, status: any) => {
                 if (status === window.kakao.maps.services.Status.OK) {
                    const addr = result[0].address?.address_name || '현위치';
                    setAddress(addr);
                    if(onLocationSelect) onLocationSelect(lat, lng, addr);
                 }
              });
          }
        }
      });
    } else {
      alert("GPS를 사용할 수 없습니다.");
    }
  };

  return (
    <div className="w-full relative h-[400px] rounded-lg overflow-hidden border border-gray-300 shadow-inner">
      {!readOnly && (
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="주소 또는 장소 검색 (예: 성주읍...)"
              className="flex-1 px-4 py-2 text-sm rounded-full shadow-md border-0 focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-brand-600 text-white p-2 rounded-full shadow-md hover:bg-brand-700 transition"
            >
              <Search size={20} />
            </button>
          </div>
      )}

      <div ref={mapContainer} className="w-full h-full bg-gray-200" />

      {!readOnly && (
          <button 
            onClick={handleCurrentLocation}
            className="absolute bottom-4 right-4 bg-white text-gray-700 p-2 rounded-full shadow-lg z-10 hover:bg-gray-100"
            title="현위치"
          >
            <Crosshair size={24} />
          </button>
      )}

      {/* Address Overlay - Show for both modes if available */}
      {(address || readOnly) && (
        <div className="absolute bottom-4 left-4 right-14 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg z-10 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-brand-800 font-bold">
            <MapPin size={14} />
            {readOnly ? '예약된 위치' : '선택된 위치'}
          </div>
          {address && <p className="truncate">{address}</p>}
        </div>
      )}
    </div>
  );
};

export default KakaoMap;