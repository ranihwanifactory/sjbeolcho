
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserRole, WorkerProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import KakaoMap from '../components/KakaoMap';
import { Loader2, Save, Upload, Image as ImageIcon, MapPin, Camera, ArrowRight, UserCheck, Wrench, User, Edit2, Clock, X } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const WorkerSettings: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [basicLoading, setBasicLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [basicName, setBasicName] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

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
      isApproved: false,
      photoUrl: ''
  });

  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    setBasicName(user.displayName || '');

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, 'worker_profiles', user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as WorkerProfile;
                setHasApplied(true);
                setProfile({
                    ...data,
                    maxDistance: data.maxDistance || 10,
                    equipmentCount: data.equipmentCount || 1,
                    portfolioUrls: data.portfolioUrls || [],
                    isApproved: data.isApproved || false,
                    photoUrl: data.photoUrl || ''
                });
            } else {
                setHasApplied(false);
                setProfile(prev => ({ 
                    ...prev, 
                    displayName: user.displayName,
                    coordinates: prev.coordinates || { lat: 35.919069, lng: 128.283038 }
                }));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        }
    };
    fetchProfile();
    
  }, [user, navigate]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !user) return;
      const file = e.target.files[0];
      setProfileLoading(true);

      try {
          const fileRef = ref(storage, `profiles/${user.uid}/avatar_${Date.now()}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          
          setProfile(prev => ({ ...prev, photoUrl: url }));
          
          // If already a worker or has applied, update the doc
          if (hasApplied || user.role === UserRole.WORKER) {
              await updateDoc(doc(db, 'worker_profiles', user.uid), { photoUrl: url });
          }
          
          // Also update Auth profile
          if (auth.currentUser) {
              await updateProfile(auth.currentUser, { photoURL: url });
              await refreshProfile();
          }
          
          alert("프로필 사진이 업데이트되었습니다.");
      } catch (e) {
          console.error(e);
          alert("업로드 중 오류가 발생했습니다.");
      } finally {
          setProfileLoading(false);
      }
  };

  const handleUpdateBasicInfo = async () => {
      if(!user) return;
      if(!basicName.trim()) {
          alert("이름을 입력해주세요.");
          return;
      }
      setBasicLoading(true);
      try {
          if(auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: basicName
            });
            await setDoc(doc(db, 'users', user.uid), {
                name: basicName
            }, { merge: true });
            await refreshProfile();
            alert("기본 정보가 수정되었습니다.");
          }
      } catch(e) {
          console.error(e);
          alert("수정 중 오류가 발생했습니다.");
      } finally {
          setBasicLoading(false);
      }
  };

  const handleConvertToWorker = async () => {
      if (!user) return;
      if (!window.confirm("반장님으로 등록하시겠습니까?\n등록하신 정보는 관리자 검토 후 승인됩니다.")) return;

      setConverting(true);
      try {
          const initialProfile = {
              uid: user.uid,
              displayName: user.displayName || basicName,
              phone: '',
              bio: '신규 지원자입니다.',
              address: '',
              coordinates: { lat: 35.919069, lng: 128.283038 },
              experienceYears: 1,
              isAvailable: true,
              maxDistance: 10,
              equipmentCount: 1,
              portfolioUrls: [],
              isApproved: false,
              photoUrl: user.photoURL || ''
          };
          
          await setDoc(doc(db, 'worker_profiles', user.uid), initialProfile);
          setHasApplied(true);
          setProfile(initialProfile);
          alert("지원서가 접수되었습니다.\n상세 프로필을 입력해주시면 심사가 진행됩니다.");
      } catch (error) {
          console.error(error);
          alert("신청 중 오류가 발생했습니다.");
      } finally {
          setConverting(false);
      }
  };

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

  const handleSaveWorkerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profile.address) {
        alert("활동 거점을 지도에서 선택해주세요.");
        return;
    }
    if (!profile.phone) {
        alert("연락처를 입력해주세요.");
        return;
    }

    setLoading(true);

    try {
        let newPortfolioUrls: string[] = [...(profile.portfolioUrls || [])];

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
            isApproved: profile.isApproved === true
        };

        await setDoc(doc(db, 'worker_profiles', user.uid), updatedProfile);
        setPortfolioFiles([]);
        setProfile(updatedProfile);

        if (!updatedProfile.isApproved) {
            alert("정보가 저장되었습니다.\n관리자 승인 대기 중입니다.");
        } else {
            alert("정보가 수정되었습니다.");
        }
        
    } catch (error) {
        console.error(error);
        alert("저장 중 오류가 발생했습니다.");
    } finally {
        setLoading(false);
        setUploading(false);
    }
  };

  const showWorkerForm = user?.role === UserRole.WORKER || hasApplied;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
          {/* Profile Photo Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full md:w-64 flex flex-col items-center">
              <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-50 bg-gray-100 mb-4 shadow-inner flex items-center justify-center">
                      {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          <User size={64} className="text-gray-300" />
                      )}
                      {profileLoading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                              <Loader2 className="animate-spin text-white" size={24} />
                          </div>
                      )}
                  </div>
                  <label className="absolute bottom-4 right-0 bg-brand-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-brand-700 transition">
                      <Camera size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} />
                  </label>
              </div>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                  프로필 사진은 반장님 리스트와<br/>상담 창에 노출되어 신뢰를 높여줍니다.
              </p>
          </div>

          <div className="flex-1 w-full space-y-6">
              {/* --- Basic Info --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={20} className="text-gray-500"/> 기본 계정 정보
                  </h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                          <input type="text" value={user?.email || ''} disabled className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">이름 (닉네임)</label>
                          <div className="flex gap-2">
                              <input type="text" value={basicName} onChange={(e) => setBasicName(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                              <button onClick={handleUpdateBasicInfo} disabled={basicLoading} className="bg-gray-800 hover:bg-gray-900 text-white px-5 rounded-lg text-sm font-bold flex items-center gap-2">
                                  {basicLoading ? <Loader2 size={16} className="animate-spin"/> : <Edit2 size={16}/>}
                                  수정
                              </button>
                          </div>
                      </div>
                      <div className="pt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              user?.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                              user?.role === UserRole.WORKER ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                              {user?.role === UserRole.ADMIN ? '관리자' : 
                               user?.role === UserRole.WORKER ? '반장님 (Worker)' : '일반 회원'}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Support/Apply Banner for Customers */}
              {user?.role === UserRole.CUSTOMER && !hasApplied && (
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-100">
                      <div className="bg-brand-600 p-6 text-white text-center">
                          <Wrench size={48} className="mx-auto mb-4 text-brand-200" />
                          <h1 className="text-2xl font-bold mb-2">반장님으로 지원하시겠습니까?</h1>
                          <p className="text-brand-100 text-sm">성주 지역 벌초 전문가를 모십니다.</p>
                      </div>
                      <div className="p-8">
                          <button onClick={handleConvertToWorker} disabled={converting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 group">
                              {converting ? <Loader2 className="animate-spin"/> : null}
                              {converting ? '처리 중...' : '지원서 작성하기'}
                              {!converting && <ArrowRight size={18} className="group-hover:translate-x-1 transition" />}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {showWorkerForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2 pb-4 border-b">
                <Wrench size={20} className="text-brand-600"/> 반장님 활동 설정
            </h2>

            {user?.role === UserRole.WORKER ? (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-6 border border-green-200 flex items-center gap-2">
                    <span className="font-bold">✓ 승인 완료</span>
                    <span className="text-sm">현재 지도에 정상적으로 노출되고 있습니다.</span>
                </div>
            ) : (
                <div className="bg-yellow-50 text-yellow-800 px-5 py-4 rounded-lg mb-6 border border-yellow-200 shadow-sm">
                    <div className="flex items-center gap-2 font-bold mb-1 text-yellow-900"><Clock size={20} /> 심사 진행 중 (승인 대기)</div>
                    <p className="text-sm">관리자 검토 후 활동 가능합니다.</p>
                </div>
            )}

            <form onSubmit={handleSaveWorkerProfile} className="space-y-6">
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">활동명 (실명 또는 상호명)</label>
                        <input type="text" value={profile.displayName || ''} onChange={e => setProfile({...profile, displayName: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                        <input type="tel" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">경력 (년)</label>
                            <input type="number" value={profile.experienceYears || 0} onChange={e => setProfile({...profile, experienceYears: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">보유 예초기 (대)</label>
                            <input type="number" value={profile.equipmentCount || 1} onChange={e => setProfile({...profile, equipmentCount: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg" min="1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
                        <textarea value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg h-24" />
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold text-md mb-4 flex items-center gap-2"><MapPin size={18} className="text-gray-500"/> 활동 지역 설정</h3>
                    <KakaoMap onLocationSelect={handleLocationSelect} initialLat={profile.coordinates?.lat} initialLng={profile.coordinates?.lng} circleRadius={profile.maxDistance ? profile.maxDistance * 1000 : 0} />
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">작업 가능 반경</label>
                            <span className="text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded text-sm">{profile.maxDistance} km</span>
                        </div>
                        <input type="range" min="1" max="100" value={profile.maxDistance || 10} onChange={e => setProfile({...profile, maxDistance: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold text-md mb-4 flex items-center gap-2"><Camera size={18} className="text-gray-500"/> 작업 포트폴리오 (현장 사진)</h3>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition mb-4">
                        <Upload className="text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">클릭하여 사진 추가</p>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </label>

                    {profile.portfolioUrls && profile.portfolioUrls.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {profile.portfolioUrls.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeExistingPhoto(url)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 transition flex items-center justify-center gap-2">
                    {loading || uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {uploading ? '사진 업로드 중...' : '활동 정보 저장 및 승인 요청'}
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default WorkerSettings;
