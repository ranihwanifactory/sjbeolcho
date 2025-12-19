import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Crosshair } from 'lucide-react';

export interface MapMarkerData {
  lat: number;
  lng: number;
  title?: string;
  content?: string; // HTML content for InfoWindow
  imageUrl?: string; // Marker image (e.g., profile photo)
  isAvailable?: boolean; // Availability status
  onClick?: () => void;
}

interface KakaoMapProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  readOnly?: boolean;
  markers?: MapMarkerData[]; // Array of markers to display
  circleRadius?: number; // Radius in meters
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
    readOnly = false,
    markers = [],
    circleRadius = 0
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [singleMarker, setSingleMarker] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const circleRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  
  const DEFAULT_LAT = 35.919069; 
  const DEFAULT_LNG = 128.283038;

  useEffect(() => {
    const initMap = () => {
        if (!window.kakao || !window.kakao.maps) return;

        window.kakao.maps.load(() => {
            if (!mapContainer.current) return;
            
            mapContainer.current.innerHTML = '';
            // Clear existing overlays
            overlaysRef.current.forEach(ov => ov.setMap(null));
            overlaysRef.current = [];

            const centerLat = initialLat || DEFAULT_LAT;
            const centerLng = initialLng || DEFAULT_LNG;
            
            const options = {
                center: new window.kakao.maps.LatLng(centerLat, centerLng),
                level: markers.length > 0 ? 9 : (circleRadius > 5000 ? 9 : 7),
                mapTypeId: window.kakao.maps.MapTypeId.HYBRID
            };
            const createdMap = new window.kakao.maps.Map(mapContainer.current, options);
            setMap(createdMap);

            if (markers.length > 0) {
                const bounds = new window.kakao.maps.LatLngBounds();

                markers.forEach(m => {
                    const pos = new window.kakao.maps.LatLng(m.lat, m.lng);
                    bounds.extend(pos);

                    if (m.imageUrl) {
                        // Create circular photo marker using CustomOverlay
                        const content = document.createElement('div');
                        content.className = 'custom-photo-marker';
                        
                        const isAvailable = m.isAvailable !== false; // Default to true

                        content.style.cssText = `
                            position: relative;
                            width: 50px;
                            height: 50px;
                            border: 3px solid ${isAvailable ? 'white' : '#9ca3af'};
                            border-radius: 50%;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            cursor: pointer;
                            background-color: #f3f4f6;
                            background-image: url('${m.imageUrl}');
                            background-size: cover;
                            background-position: center;
                            transform: translate(-50%, -100%);
                            margin-top: -10px;
                            filter: ${isAvailable ? 'none' : 'grayscale(100%) opacity(0.8)'};
                            transition: all 0.3s;
                        `;
                        
                        // Add a status badge if not available
                        if (!isAvailable) {
                            const badge = document.createElement('div');
                            badge.innerText = '작업중';
                            badge.style.cssText = `
                                position: absolute;
                                top: -10px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: #4b5563;
                                color: white;
                                font-size: 9px;
                                font-weight: bold;
                                padding: 2px 6px;
                                border-radius: 4px;
                                white-space: nowrap;
                                border: 1px solid white;
                            `;
                            content.appendChild(badge);
                        }

                        // Add a small pointer triangle at the bottom
                        const arrow = document.createElement('div');
                        arrow.style.cssText = `
                            position: absolute;
                            bottom: -10px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 0;
                            height: 0;
                            border-left: 8px solid transparent;
                            border-right: 8px solid transparent;
                            border-top: 10px solid ${isAvailable ? 'white' : '#9ca3af'};
                        `;
                        content.appendChild(arrow);

                        const customOverlay = new window.kakao.maps.CustomOverlay({
                            position: pos,
                            content: content,
                            yAnchor: 1
                        });
                        customOverlay.setMap(createdMap);
                        overlaysRef.current.push(customOverlay);

                        // Event listener for CustomOverlay
                        content.onclick = () => {
                            if (m.onClick) m.onClick();
                            if (m.content) {
                                const infowindow = new window.kakao.maps.InfoWindow({
                                    content: m.content,
                                    removable: true
                                });
                                infowindow.open(createdMap);
                                infowindow.setPosition(pos);
                            }
                        };
                    } else {
                        // Standard marker
                        const marker = new window.kakao.maps.Marker({
                            position: pos,
                            map: createdMap,
                            title: m.title
                        });
                        if (m.content || m.onClick) {
                            window.kakao.maps.event.addListener(marker, 'click', () => {
                                if (m.onClick) m.onClick();
                                if (m.content) {
                                    const infowindow = new window.kakao.maps.InfoWindow({
                                        content: m.content,
                                        removable: true
                                    });
                                    infowindow.open(createdMap, marker);
                                }
                            });
                        }
                    }
                });
                
                if (markers.length > 1) {
                    createdMap.setBounds(bounds);
                }
            } else {
                const markerPosition = new window.kakao.maps.LatLng(centerLat, centerLng);
                const createdMarker = new window.kakao.maps.Marker({
                    position: markerPosition
                });
                createdMarker.setMap(createdMap);
                setSingleMarker(createdMarker);

                if (circleRadius > 0) {
                    const circle = new window.kakao.maps.Circle({
                        center : markerPosition,
                        radius: circleRadius,
                        strokeWeight: 1,
                        strokeColor: '#16a34a',
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid',
                        fillColor: '#22c55e',
                        fillOpacity: 0.2
                    }); 
                    circle.setMap(createdMap);
                    circleRef.current = circle;
                }

                if (!readOnly) {
                    window.kakao.maps.event.addListener(createdMap, 'click', (mouseEvent: any) => {
                        const latlng = mouseEvent.latLng;
                        createdMarker.setPosition(latlng);
                        if (circleRef.current) circleRef.current.setPosition(latlng);

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
            }
        });
    };

    if (window.kakao && window.kakao.maps) {
        initMap();
    } else {
        const interval = setInterval(() => {
            if (window.kakao && window.kakao.maps) {
                clearInterval(interval);
                initMap();
            }
        }, 100);
        return () => clearInterval(interval);
    }
  }, [initialLat, initialLng, readOnly, JSON.stringify(markers)]); 

  useEffect(() => {
      if (!map || !singleMarker) return;
      if (circleRadius > 0) {
          if (circleRef.current) {
              circleRef.current.setRadius(circleRadius);
              circleRef.current.setMap(map);
          } else {
              const circle = new window.kakao.maps.Circle({
                  center : singleMarker.getPosition(),
                  radius: circleRadius,
                  strokeWeight: 1,
                  strokeColor: '#16a34a',
                  strokeOpacity: 0.8,
                  strokeStyle: 'solid',
                  fillColor: '#22c55e',
                  fillOpacity: 0.2
              }); 
              circle.setMap(map);
              circleRef.current = circle;
          }
      } else if (circleRef.current) {
          circleRef.current.setMap(null);
      }
  }, [circleRadius, map, singleMarker]);

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
        if (singleMarker) {
            singleMarker.setPosition(moveLatLon);
            if (circleRef.current) circleRef.current.setPosition(moveLatLon);
        }
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
          if (singleMarker) {
              singleMarker.setPosition(locPosition);
              if (circleRef.current) circleRef.current.setPosition(locPosition);
          }
          if (!readOnly && onLocationSelect) {
              const geocoder = new window.kakao.maps.services.Geocoder();
              geocoder.coord2Address(lng, lat, (result: any, status: any) => {
                 if (status === window.kakao.maps.services.Status.OK) {
                    const addr = result[0].address?.address_name || '현위치';
                    setAddress(addr);
                    onLocationSelect(lat, lng, addr);
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
              placeholder="주소 또는 장소 검색"
              className="flex-1 px-4 py-2 text-sm rounded-full shadow-md border-0 focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="bg-brand-600 text-white p-2 rounded-full shadow-md hover:bg-brand-700 transition">
              <Search size={20} />
            </button>
          </div>
      )}
      <div ref={mapContainer} className="w-full h-full bg-gray-200" />
      {!readOnly && (
          <button onClick={handleCurrentLocation} className="absolute bottom-4 right-4 bg-white text-gray-700 p-2 rounded-full shadow-lg z-10 hover:bg-gray-100" title="현위치">
            <Crosshair size={24} />
          </button>
      )}
      {(address && !readOnly) && (
        <div className="absolute bottom-4 left-4 right-14 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg z-10 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-brand-800 font-bold"><MapPin size={14} />선택된 위치</div>
          <p className="truncate">{address}</p>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;