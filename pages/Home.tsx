import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, CheckCircle, Calendar, MessageCircle, ArrowRight, ShieldCheck, Camera, PenTool, UserCheck } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-12 md:space-y-24">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] md:aspect-[21/9] bg-gray-900 group">
        <div className="absolute inset-0">
             <img 
                src="https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20220904_178%2F1662246350019JhBeB_JPEG%2F20220901_095750.jpg" 
                alt="Beolcho Background" 
                className="w-full h-full object-cover opacity-70 scale-100 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 md:p-12">
          <div className="animate-fade-in-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-500/20 backdrop-blur-sm border border-brand-400 text-brand-300 text-xs md:text-sm font-bold mb-4">
                  경북 성주권 압도적 1위
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                  조상님 묘소 관리,<br className="md:hidden"/>
                  <span className="text-brand-400">젊은 일꾼</span>에게 맡기세요
              </h1>
              <p className="text-gray-200 text-sm md:text-lg mb-8 max-w-2xl mx-auto opacity-90">
                  위성지도를 통한 정확한 위치 확인부터 작업 후 사진 전송까지.<br className="hidden md:block"/>
                  가족의 마음으로 정성을 다해 관리해 드립니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                  <Link to="/reserve" className="bg-brand-600 hover:bg-brand-500 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-brand-900/30 transform transition hover:-translate-y-1 flex items-center justify-center gap-2">
                    <Calendar size={20} />
                    간편 예약하기
                  </Link>
                  <Link to="/chat" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-lg font-bold py-4 px-8 rounded-xl transition flex items-center justify-center gap-2">
                    <MessageCircle size={20} />
                    실시간 상담
                  </Link>
              </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div>
            <div className="text-3xl md:text-4xl font-bold text-brand-700 mb-1">100%</div>
            <div className="text-gray-500 text-xs md:text-sm font-medium">고객 만족도</div>
        </div>
        <div>
            <div className="text-3xl md:text-4xl font-bold text-brand-700 mb-1">500+</div>
            <div className="text-gray-500 text-xs md:text-sm font-medium">누적 작업 묘소</div>
        </div>
        <div>
            <div className="text-3xl md:text-4xl font-bold text-brand-700 mb-1">성주</div>
            <div className="text-gray-500 text-xs md:text-sm font-medium">전 지역 출장</div>
        </div>
        <div>
            <div className="text-3xl md:text-4xl font-bold text-brand-700 mb-1">AS</div>
            <div className="text-gray-500 text-xs md:text-sm font-medium">확실한 보장</div>
        </div>
      </div>

      {/* Feature / Why Choose Us */}
      <section>
          <div className="text-center mb-10 md:mb-16">
              <h2 className="text-sm font-bold text-brand-600 tracking-wider uppercase mb-2">Why Choose Us</h2>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900">젊은벌초를 선택해야 하는 이유</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <MapPin size={28} />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">위성 지도 정확한 접수</h4>
                <p className="text-gray-600 leading-relaxed">
                    전화로 위치 설명하느라 고생하지 마세요. 앱 내 지도로 정확한 묘소 위치를 찍어주시면 직접 찾아갑니다.
                </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <UserCheck size={28} />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">전문 장비와 인력</h4>
                <p className="text-gray-600 leading-relaxed">
                    경험 풍부한 젊은 인력들이 고성능 장비를 사용하여 잡초 제거부터 뒷정리까지 깔끔하게 처리합니다.
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Camera size={28} />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">작업 전/후 사진 전송</h4>
                <p className="text-gray-600 leading-relaxed">
                    현장에 가지 않으셔도 안심하세요. 작업 완료 직후 깔끔해진 묘소 사진을 앱과 문자로 보내드립니다.
                </p>
            </div>
          </div>
      </section>

      {/* Process Section */}
      <section className="bg-brand-50 rounded-3xl p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">간편한 이용 절차</h3>
                <p className="text-gray-600">복잡한 절차 없이 앱 하나로 모든 것이 해결됩니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0 relative">
                {/* Connector Line (Desktop) */}
                <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-brand-200 -z-10"></div>

                {[
                    { icon: <MapPin />, title: "위치 선택", desc: "지도에서 묘소 위치 지정" },
                    { icon: <Calendar />, title: "예약 접수", desc: "날짜 및 요청사항 입력" },
                    { icon: <ShieldCheck />, title: "작업 진행", desc: "전문가의 꼼꼼한 벌초" },
                    { icon: <Camera />, title: "완료 확인", desc: "사진 확인 및 후기 작성" },
                ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group">
                        <div className="w-16 h-16 bg-white border-2 border-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                            {React.cloneElement(step.icon as React.ReactElement, { size: 28 })}
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Link to="/reserve" className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition">
                    지금 바로 예약하기 <ArrowRight size={18} />
                </Link>
            </div>
          </div>
      </section>

      {/* Info & Reviews Preview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageCircle className="text-brand-600"/> 1:1 맞춤 상담
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    견적이 궁금하시거나 특별한 요청사항이 있으신가요?<br/>
                    채팅으로 문의주시면 친절하게 답변해 드립니다.
                </p>
            </div>
            <Link to="/chat" className="self-start text-brand-600 font-bold hover:text-brand-800 flex items-center gap-2">
                상담하러 가기 <ArrowRight size={16} />
            </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-8 text-white flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <PenTool className="text-brand-400"/> 생생한 이용 후기
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                    많은 고객님들이 만족하신 젊은벌초의 서비스를 확인해보세요.<br/>
                    실제 이용 고객님들의 솔직한 후기가 증명합니다.
                </p>
            </div>
            <Link to="/reviews" className="self-start text-brand-400 font-bold hover:text-brand-300 flex items-center gap-2">
                후기 보러 가기 <ArrowRight size={16} />
            </Link>
        </div>
      </section>

      {/* Company Info Box (Mobile style detail, clearer on desktop) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">업체 상세 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Phone size={20}/></div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">예약/문의 전화</p>
                    <a href="tel:010-7545-0038" className="font-bold text-lg text-brand-700 hover:underline">010-7545-0038</a>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Mail size={20}/></div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">이메일</p>
                    <p className="text-sm font-medium">hwanace@naver.com</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><MapPin size={20}/></div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">주소</p>
                    <p className="text-sm font-medium">경북 성주군 성주읍 성주순환로2길 69</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;