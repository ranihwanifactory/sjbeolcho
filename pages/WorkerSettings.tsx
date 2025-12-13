import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserRole, WorkerProfile } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import KakaoMap from '../components/KakaoMap';
import { Loader2, Save, Upload, Image as ImageIcon, MapPin, Briefcase, Camera } from 'lucide-react';

const WorkerSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profile, setProfile] = useState<Partial<WorkerProfile>>({
      displayName: '',
      phone: '',
      bio: '',
      address: '',
      experienceYears: 1,
      isAvailable: true,
      coordinates: { lat: 35.919069, lng: 128.283038 },
      maxDistance: 10,
      equipmentCount: 1,
      portfolioUrls: [],
      isApproved: false
  });

  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    if (user.role !== UserRole.WORKER) {
        alert("반장님(Worker) 계정만 접근할 수 있습니다.");
        navigate('/');
        return;
    }

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, 'worker_profiles', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as WorkerProfile;
                setProfile({
                    ...data,
                    // Ensure new fields have defaults if they don't exist in DB yet
                    maxDistance: data.maxDistance || 10,
                    equipmentCount: data.equipmentCount || 1,
                    portfolioUrls: data.portfolioUrls || [],
                    isApproved: data.isApproved || false
                });
            } else {
                setProfile(prev => ({ ...prev, displayName: user.displayName }));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setProfile(prev => ({ ...prev, coordinates: { lat, lng }, address }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setPortfolioFiles(prev => [...prev, ...newFiles]);
      }
  };

  const removeFile = (index: number) => {
      setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (urlToRemove: string) => {
      if (window.confirm("이미지를 삭제하시겠습니까?")) {
        setProfile(prev => ({
            ...prev,
            portfolioUrls: prev.portfolioUrls?.filter(url => url !== urlToRemove)
        }));
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profile.address) {
        alert("활동 거점을 지도에서 선택해주세요.");
        return;
    }

    setLoading(true);

    try {
        let newPortfolioUrls: string[] = [...(profile.portfolioUrls || [])];

        // Upload new files
        if (portfolioFiles.length > 0) {
            setUploading(true);
            for (const file of portfolioFiles) {
                const fileRef = ref(storage, `portfolios/${user.uid}/${Date.now()}_${file.name}`);
                await uploadBytes(fileRef, file);
                const url = await getDownloadURL(fileRef);
                newPortfolioUrls.push(url);
            }
            setUploading(false);
        }

        const updatedProfile = {
            uid: user.uid,
            ...profile,
            portfolioUrls: newPortfolioUrls,
            updatedAt: new Date(),
            // Keep approval status if already approved, otherwise false
            isApproved: profile.isApproved === true
        };

        await setDoc(doc(db, 'worker_profiles', user.uid), updatedProfile);
        
        // Clear uploaded files queue
        setPortfolioFiles([]);
        setProfile(updatedProfile);

        if (!updatedProfile.isApproved) {
            alert("프로필이 저장되었습니다.\n관리자 승인 후 '우리동네 반장' 지도에 노출됩니다.");
        } else {
            alert("정보가 수정되었습니다.");
        }
        
    } catch (error) {
        console.error("Error saving profile", error);
        alert("저장 중 오류가 발생했습니다.");
    } finally {
        setLoading(false);
        setUploading(false);
    }
  };

  return (
    <div className="pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">반장님 프로필 설정</h1>
      
      {profile.isApproved ? (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-6 border border-green-200 flex items-center gap-2">
              <span className="font-bold">✓ 승인됨</span>
              <span className="text-sm">현재 지도에 정상적으로 노출되고 있습니다.</span>
          </div>
      ) : (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6 border border-yellow-200">
              <p className="font-bold mb-1">⚠ 승인 대기 중</p>
              <p className="text-sm">필수 정보를 모두 입력하고 저장하시면, 관리자가 검토 후 승인해 드립니다.</p>
          </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="bg-brand-100 p-1.5 rounded text-brand-600"><Briefcase size={18}/></div>
                  기본 정보 및 경력
              </h2>
              <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성함 (실명 또는 상호명)</label>
                    <input 
                        type="text" 
                        value={profile.displayName || ''}
                        onChange={e => setProfile({...profile, displayName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="예: 김성주"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input 
                        type="tel" 
                        value={profile.phone || ''}
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="010-0000-0000"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">경력 (년)</label>
                        <input 
                            type="number" 
                            value={profile.experienceYears || 0}
                            onChange={e => setProfile({...profile, experienceYears: parseInt(e.target.value)})}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">보유 예초기 (대)</label>
                        <input 
                            type="number" 
                            value={profile.equipmentCount || 1}
                            onChange={e => setProfile({...profile, equipmentCount: parseInt(e.target.value)})}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            min="1"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
                    <textarea 
                        value={profile.bio || ''}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg h-24"
                        placeholder="예: 깔끔한 마무리 약속드립니다. 차량 보유하여 어디든 이동 가능합니다."
                    />
                </div>
              </div>
          </div>

          {/* Section 2: Location & Range */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="bg-brand-100 p-1.5 rounded text-brand-600"><MapPin size={18}/></div>
                  활동 지역
              </h2>
              <p className="text-xs text-gray-500 mb-3">지도에서 거점 위치를 선택하고, 이동 가능한 반경을 설정해주세요.</p>
              <KakaoMap 
                onLocationSelect={handleLocationSelect} 
                initialLat={profile.coordinates?.lat}
                initialLng={profile.coordinates?.lng}
              />
              {profile.address && (
                  <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-bold">선택된 거점:</span> {profile.address}
                  </div>
              )}
              
              <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">작업 가능 반경</label>
                      <span className="text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded text-sm">{profile.maxDistance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={profile.maxDistance || 10} 
                    onChange={e => setProfile({...profile, maxDistance: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1km</span>
                      <span>50km</span>
                      <span>100km</span>
                  </div>
              </div>
          </div>

          {/* Section 3: Portfolio */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="bg-brand-100 p-1.5 rounded text-brand-600"><Camera size={18}/></div>
                  포트폴리오 (작업 사진)
              </h2>
              <p className="text-sm text-gray-600 mb-4">직접 작업하신 벌초 전/후 사진 등을 등록해주세요. (다중 선택 가능)</p>
              
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition mb-4">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500"><span className="font-semibold">클릭하여 사진 추가</span></p>
                      <p className="text-xs text-gray-400">JPG, PNG (최대 10MB)</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
              </label>

              {/* Upload Queue */}
              {portfolioFiles.length > 0 && (
                  <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">업로드 대기 중 ({portfolioFiles.length})</h4>
                      <div className="flex flex-wrap gap-2">
                          {portfolioFiles.map((file, idx) => (
                              <div key={idx} className="relative group">
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                                      <ImageIcon size={20} className="text-gray-400"/>
                                      <span className="text-[10px] absolute bottom-1 text-center w-full truncate px-1">{file.name}</span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Existing Photos */}
              {profile.portfolioUrls && profile.portfolioUrls.length > 0 && (
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 mb-2">등록된 사진</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {profile.portfolioUrls.map((url, idx) => (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                  <img src={url} alt={`Portfolio ${idx}`} className="w-full h-full object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => removeExistingPhoto(url)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
              {loading || uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {uploading ? '사진 업로드 중...' : '프로필 저장 및 승인 요청'}
          </button>
      </form>
    </div>
  );
};

export default WorkerSettings;