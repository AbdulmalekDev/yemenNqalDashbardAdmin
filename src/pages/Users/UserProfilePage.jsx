import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRight, 
  User, 
  Mail, 
  ShieldCheck, 
  Shield, 
  Calendar, 
  Settings, 
  History,
  Edit2,
  Loader2,
  Lock,
  Smartphone
} from 'lucide-react';
import { getUsers } from './UserService';

import { useAuth } from '../../context/AuthContext';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, hasPermission } = useAuth();
  const isSelf = currentUser?.uid === id;
  const canManage = hasPermission('manage_users');

  const { data, isLoading } = useQuery({
    queryKey: ['allAdminsProfile'],
    queryFn: getUsers
  });

  const user = data?.data?.find(u => u.uid === id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات الملف الشخصي...</p>
      </div>
    );
  }

  if (!user || (!isSelf && !canManage)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 bg-white rounded-3xl border border-gray-100 mx-4">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح لك بالوصول</h2>
        <p className="text-gray-500 mb-8 max-w-sm">ليس لديك الصلاحية لمشاهدة ملف تعريف هذا المستخدم.</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
          العودة للخلف
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 font-arabic" dir="rtl">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between mb-8">
        {canManage ? (
          <Link to="/users" className="group flex items-center text-gray-500 hover:text-primary-700 transition-all font-bold">
            <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-primary-50 ml-3 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            العودة للقائمة
          </Link>
        ) : (
          <button onClick={() => navigate(-1)} className="group flex items-center text-gray-500 hover:text-primary-700 transition-all font-bold">
            <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-primary-50 ml-3 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            العودة
          </button>
        )}
        
        {canManage && (
          <Link 
            to={`/users/edit/${user.uid}`}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-50 transition-all font-bold shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            تعديل الملف
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
        {/* Left Column - Essential Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary-50 border border-gray-100 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-700 shadow-sm shadow-primary-200"></div>
            
            <div className="w-32 h-32 bg-primary-50 border-4 border-white shadow-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl font-black text-primary-700 relative overflow-hidden">
               {user.name.charAt(0)}
               <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-tl-[1rem] flex items-center justify-center border-t border-l border-gray-50">
                 {user.role === 'manager' ? <ShieldCheck className="w-6 h-6 text-purple-600" /> : <Shield className="w-6 h-6 text-blue-600" />}
               </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">{user.name}</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">{user.email}</p>

            <div className={`inline-flex items-center px-4 py-1.5 rounded-2xl text-xs font-bold gap-2 mb-8 ${
              user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              حالة الحساب: {user.status === 'active' ? 'نشط' : 'معطل'}
            </div>

            <div className="py-6 border-t border-gray-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="block text-xl font-bold text-gray-900">0</span>
                <span className="text-[10px] text-gray-400 uppercase font-black">الطلبات المسجلة</span>
              </div>
              <div className="text-center border-r border-gray-100">
                <span className="block text-xl font-bold text-gray-900">0</span>
                <span className="text-[10px] text-gray-400 uppercase font-black">النشاطات الشهرية</span>
              </div>
            </div>
          </div>


        </div>

        {/* Right Column - Detailed Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Details */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
               <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600"><Settings className="w-5 h-5" /></div>
               تفاصيل الحساب
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0"><User className="w-5 h-5" /></div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black mb-1">الاسم الكامل</label>
                    <span className="text-gray-900 font-bold">{user.name}</span>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0"><Mail className="w-5 h-5" /></div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black mb-1">البريد الإلكتروني</label>
                    <span className="text-gray-900 font-bold">{user.email}</span>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black mb-1">رتبة الصلاحية</label>
                    <span className={`text-sm font-bold ${user.role === 'manager' ? 'text-purple-600' : 'text-blue-600'}`}>
                      {user.role === 'manager' ? 'مدير نـظام (Full Access)' : 'مشـرف (Restricted Access)'}
                    </span>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black mb-1">تاريخ الانضمام</label>
                    <span className="text-gray-900 font-bold">
                       {new Date(user.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
               </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
