
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, Calendar, MessageCircle, ArrowRight, ShieldCheck, Camera, PenTool, UserCheck, Wrench, Users, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import WorkersMap from './WorkersMap';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Review } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [reviewError, setReviewError] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
        try {
            const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(3));
            const snapshot = await getDocs(q);
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setRecentReviews(reviewsData);
            setReviewError(false);
        } catch (error: any) {
            console.error("Error fetching reviews", error);
            if (error.code === 'permission-denied') {
                setReviewError(true);
            }
        }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-12 md:space-y-20 pb-10">
      {/* Hero Section */}
      <section className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl aspect-[1/1] sm:aspect-[4/3] md:aspect-[21/9] bg-gray-900 group">
        <div className="absolute inset-0">
             <img 
                src="https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20220904_178%2F1662246350019JhBeB_JPEG%2F20220901_095750.jpg" 
                alt="Beolcho Background" 
                className="w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 md:p-12">
          <div className="animate-fade-in-up w-full">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-500/20 backdrop-blur-sm border border-brand-400 text-brand-300 text-[10px] md:text-sm font-bold mb-3 md:mb-4">
                  경북 성주권 압도적 1위
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-4 leading-tight tracking-tight">
                  조상님 묘소 관리,<br/>
                  <span className="text-brand-400">젊은 일꾼</span>에게 맡기세요
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm md:text-lg mb-6 md:mb-8 max-w-xl mx-auto opacity-90 leading-relaxed">
                  위성지도를 통한 정확한 위치 확인부터 작업 후 사진 전송까지.
                  가족의 마음으로 정성을 다해 관리해 드립니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full max-w-xs sm:max-w-none mx-auto">
                  <Link to="/reserve" className="bg-brand-600 hover:bg-brand-500 text-white text-sm md:text-lg font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl shadow-lg shadow-brand-900/30 transform transition hover:-translate-y-1 flex items-center justify-center gap-2">
                    <Calendar size={18} className="md:w-5 md:h-5"/>
                    간편 예약하기
                  </Link>
                  <Link to="/chat" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm md:text-lg font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl transition flex items-center justify-center gap-2">
                    <MessageCircle size={18} className="md:w-5 md:h-5"/>
                    실시간 상담
                  </Link>
              </div>
          </div>
        </div>
      </section>

      {/* Nationwide Workers Map */}
      <section>
          <div className="flex items-end justify-between mb-4 px-2">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="text-brand-600" size={24}/> 
                  <span>성주 벌초 반장님 현황</span>
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">
                  현재 활동 중인 검증된 반장님들의 위치를 확인하세요.
              </p>
            </div>
            {!user && (
              <Link to="/login" className="text-xs md:text-sm text-brand-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap bg-brand-50 px-2 py-1 rounded-lg">
                  반장님 지원 <ArrowRight size={12}/>
              </Link>
            )}
          </div>
          <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <WorkersMap isEmbedded={true} />
          </div>
      </section>

      {/* Recent Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Star className="text-yellow-400 fill-yellow-400" size={24}/>
                <span>최신 이용 후기</span>
            </h2>
            <Link to="/reviews" className="text-xs md:text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                전체보기 <ArrowRight size={14}/>
            </Link>
        </div>
        
        {reviewError ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-red-200 text-center flex flex-col items-center">
                <AlertCircle size={32} className="text-red-400 mb-2"/>
                <p className="text-gray-500 text-sm">리뷰를 불러올 권한이 없습니다.<br/>(Firestore 보안 규칙 설정을 확인해주세요)</p>
            </div>
        ) : recentReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentReviews.map((review) => (
                    <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-gray-800 text-sm">{review.userName}님</div>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-xs md:text-sm line-clamp-3 mb-4 flex-1">
                            {review.text}
                        </p>
                        {review.photoUrl && (
                            <div className="h-32 w-full rounded-lg overflow-hidden mt-auto bg-gray-50 border border-gray-100">
                                <img src={review.photoUrl} alt="Review" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {!review.photoUrl && (
                            <div className="h-10 mt-auto flex items-end">
                                <span className="text-[10px] text-gray-400">{review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : ''} 작성</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <Link to="/reviews" className="block bg-white border border-gray-200 border-dashed p-8 rounded-2xl text-center text-gray-400 hover:border-brand-300 hover:text-brand-600 transition">
                <p className="text-sm">아직 등록된 후기가 없습니다.<br/>첫 번째 후기를 작성해보세요!</p>
            </Link>
        )}
      </section>

      {/* Recruitment Banner */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-5 md:p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 relative z-10 mb-4 md:mb-0 w-full md:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <Wrench size={24} className="text-green-300 md:w-8 md:h-8" />
              </div>
              <div className="text-left">
                  <h3 className="text-lg md:text-2xl font-bold mb-0.5">반장님 모집</h3>
                  <p className="text-green-100 text-xs md:text-base">성주 지역 전문가라면 지원하세요.</p>
              </div>
          </div>
          <Link 
            to={user ? "/profile" : "/login"} 
            className="w-full md:w-auto text-center bg-white text-green-900 font-bold py-3 px-6 rounded-xl md:rounded-full hover:bg-green-50 transition shadow-lg text-sm z-10"
          >
              지원하기
          </Link>
      </div>

      {/* Process Section */}
      <section className="bg-brand-50 rounded-2xl md:rounded-3xl p-6 md:p-16 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-8 md:mb-12">
                <h3 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">간편한 이용 절차</h3>
                <p className="text-xs md:text-base text-gray-600">복잡한 절차 없이 앱 하나로 해결하세요.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 relative">
                <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-brand-200 -z-10"></div>
                {[
                    { icon: <MapPin />, title: "위치 선택", desc: "지도에서 묘소 지정" },
                    { icon: <Calendar />, title: "예약 접수", desc: "날짜/내용 입력" },
                    { icon: <ShieldCheck />, title: "작업 진행", desc: "전문가의 꼼꼼한 관리" },
                    { icon: <Camera />, title: "완료 확인", desc: "사진 전송 및 확인" },
                ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group bg-white md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-100 md:bg-white border-2 border-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-sm">
                            {React.cloneElement(step.icon as React.ReactElement, { size: 24 })}
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{step.title}</h4>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8 md:mt-12 text-center">
                <Link to="/reserve" className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 px-8 rounded-xl md:rounded-full shadow-lg transition text-sm md:text-base">
                    지금 바로 예약하기 <ArrowRight size={16} />
                </Link>
            </div>
          </div>
      </section>
    </div>
  );
};

export default Home;
