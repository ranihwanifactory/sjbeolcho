import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarPlus, MessageCircle, LogOut, Share2, Shield, Star, Menu, Phone, Mail, MapPin, Users, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Reservation, ReservationStatus } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CompletionModal from './CompletionModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Notification State
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // Listen for Completed Reservations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', user.uid),
      where('status', '==', ReservationStatus.COMPLETED)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Reservation;
        const reservationId = doc.id;
        const storageKey = `notified_completion_${reservationId}`;

        const hasNotified = localStorage.getItem(storageKey);

        if (!hasNotified) {
          setCompletedReservation({ id: reservationId, ...data });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleCloseNotification = () => {
    if (completedReservation) {
      localStorage.setItem(`notified_completion_${completedReservation.id}`, 'true');
      setCompletedReservation(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '젊은벌초 - 성주권 벌초 예약',
          text: '성주 지역 전문 벌초 대행 서비스입니다. 앱에서 간편하게 예약하세요.',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert('주소가 복사되었습니다: ' + window.location.href);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
        alert("이미 설치되어 있거나 설치를 지원하지 않는 환경입니다.");
    }
  };

  const navItems = [
    { path: '/', label: '홈', icon: <Home size={20} /> },
    { path: '/reserve', label: '예약하기', icon: <CalendarPlus size={20} /> },
    { path: '/reviews', label: '이용후기', icon: <Star size={20} /> },
  ];

  // Everyone gets a profile menu
  navItems.push({ path: '/profile', label: '프로필', icon: <User size={20} /> });

  if (user?.role === UserRole.ADMIN) {
    navItems.push({ path: '/admin', label: '관리자', icon: <Shield size={20} /> });
  }

  // Chat is separate or handled differently in mobile bar usually, but putting it in list for consistency
  if (!navItems.find(i => i.path === '/chat')) {
      navItems.push({ path: '/chat', label: '문의', icon: <MessageCircle size={20} /> });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Notification Modal */}
      {completedReservation && (
        <CompletionModal 
          reservation={completedReservation} 
          onClose={handleCloseNotification} 
        />
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                <span className="font-bold text-lg">성주</span>
             </div>
             <span className="font-bold text-xl text-gray-800 tracking-tight group-hover:text-brand-600 transition">젊은벌초</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
             <nav className="flex gap-6">
                {navItems.filter(item => item.path !== '/').map(item => (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`text-sm font-bold transition hover:text-brand-600 ${location.pathname === item.path ? 'text-brand-600' : 'text-gray-600'}`}
                    >
                        {item.label}
                    </Link>
                ))}
             </nav>
             <div className="h-4 w-[1px] bg-gray-300"></div>
             <div className="flex items-center gap-3">
                <button onClick={handleShare} className="text-gray-500 hover:text-brand-600 transition" title="공유하기">
                    <Share2 size={20} />
                </button>
                {user ? (
                <button onClick={logout} className="text-sm font-bold text-gray-500 hover:text-red-500 transition" title="로그아웃">
                    로그아웃
                </button>
                ) : (
                <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full text-sm font-bold transition shadow-md shadow-brand-100">
                    로그인
                </Link>
                )}
             </div>
          </div>

          {/* Mobile Actions (Keep minimal) */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={handleShare} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
              <Share2 size={20} />
            </button>
            {user ? (
              <button onClick={logout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                <LogOut size={20} />
              </button>
            ) : (
              <Link to="/login" className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mb-20 md:mb-0">
        {children}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-gray-900 text-gray-400 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="bg-brand-600 text-white p-1 rounded text-xs">성주</span> 젊은벌초
                  </h3>
                  <p className="text-sm leading-relaxed mb-4">
                      경북 성주군 전 지역 벌초 대행 전문 업체입니다.<br/>
                      조상님 묘소를 내 가족의 묘소처럼 정성을 다해 관리해드립니다.
                  </p>
                  <p className="text-xs text-gray-500">
                      © {new Date().getFullYear()} Young Beolcho. All rights reserved.
                  </p>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">고객센터</h4>
                  <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2"><Phone size={16}/> 010-7545-0038</li>
                      <li className="flex items-center gap-2"><Mail size={16}/> hwanace@naver.com</li>
                      <li className="flex items-center gap-2"><MessageCircle size={16}/> 1:1 채팅 상담 환영</li>
                      <li className="text-xs text-gray-500 mt-2">상담시간: 09:00 - 18:00 (연중무휴)</li>
                  </ul>
              </div>
              <div>
                   <h4 className="text-white font-bold mb-4">찾아오시는 길</h4>
                   <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="mt-1 flex-shrink-0"/>
                        <span>경북 성주군 성주읍 성주순환로2길 69</span>
                   </div>
              </div>
          </div>
      </footer>

      {/* Mobile Install Prompt */}
      {deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-80 bg-brand-900 text-white p-4 rounded-xl shadow-2xl z-50 flex justify-between items-center animate-bounce-slight">
            <div>
                <p className="font-bold text-sm">앱 설치하기</p>
                <p className="text-xs text-gray-300">더 편리하게 예약하세요!</p>
            </div>
            <button onClick={handleInstall} className="bg-white text-brand-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition">설치</button>
        </div>
      )}

      {/* Mobile Bottom Navigation - Showing max 5 items for better UI */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex justify-around">
          {navItems.slice(0, 5).map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center py-3 px-2 flex-1 transition-colors ${isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
             );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;