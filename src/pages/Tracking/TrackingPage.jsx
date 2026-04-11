import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  MarkerClusterer,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';
import {
  MapPin,
  Navigation,
  Truck,
  Battery,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Zap,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDrivers } from '../../hooks/useDrivers';



import { getActiveOrderByDriver } from '../../services/orderService';
import toast from 'react-hot-toast';

// --- إعدادات الخريطة ---
const MAP_CENTER = { lat: 15.3694, lng: 44.191 }; // صنعاء، اليمن
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  maxZoom: 19,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_ID || 'orbital-heaven-478118-d6', // استخدام المعرف الرسمي لربط الخريطة بالخدمات المتقدمة
  styles: [
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry",
      "stylers": [{ "visibility": "on" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#c9d2d4" }]
    }
  ]
};
const LIBRARIES = ['marker', 'places', 'geometry']; // وضع المكتبات كثابت لمنع إعادة تحميل السكريبت بشكل متكرر

const TrackingPage = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
    });

  const { data: drivers, isLoading, isError, refetch } = useDrivers();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [map, setMap] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // --- حالات تحسين الأداء المتقدمة (Performance Optimization) ---
  const [showMap, setShowMap] = useState(false);
  // نحدد عرض أول 20 سائق فقط لمنع اختناق الرام (Out of Memory) بمتصفح الإدارة لكثرة عناصر (DOM Nodes)
  const [visibleCount, setVisibleCount] = useState(20); 

  // هذه الخوارزمية (Lazy Loading) أو التحميل التدريجي لتقليل حمل الـ DOM.
  // بدلاً من رسم 1000 مقطع HTML في ثانية واحدة، نرسم 20 مقطع وبعد ثبات الشاشة نحمل البقية لضمان سلاسة الواجهة.
  useEffect(() => {
    if (drivers) {
      const timer = setTimeout(() => {
        setVisibleCount(onlineDrivers.length);
      }, 3000); // تحميل البقية بعد 3 ثواني من الاستقرار
      // تنظيف المؤقت الزمني لمنع حدوث تسرب في الذاكرة (Memory Leak) عند تبديل الصفحات
      return () => clearTimeout(timer);
    }
  }, [drivers, searchTerm]);

  // تأخير استدعاء الخريطة الثقيلة لتحسين مقياس (LCP - Largest Contentful Paint)
  // حيث أن الخرائط تحتاج لأكثر من 50 طلب شبكة للظهور، تأخيرها يجعل التطبيق يبدو صاروخياً للمستخدم للوهلة الأولى.
  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- حالات مسار الطلب ---
  const [activeOrder, setActiveOrder] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [driverLocationName, setDriverLocationName] = useState("جاري التحديد...");

  // جلب بيانات التتبع اللحظية من كاش React Query (المحدّث بـ useRealTime)
  const { data: trackingData = {} } = useQuery({
    queryKey: ['tracking'],
    staleTime: Infinity
  });


  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // استخراج مصفوفة السائقين سواء كانت النتيجة مصفوفة مباشرة أو كائن يحتوي على داتا (Pagination)
  const driversList = useMemo(() => {
    if (!drivers) return [];
    if (Array.isArray(drivers)) return drivers;
    return drivers.data || [];
  }, [drivers]);

  // تصفية السائقين المتصلين فقط ودمج بيانات التتبع اللحظية معهم
  // نقطة قوة (للمناقشة): نستخدم (useMemo) لمنع React من إعادة معالجة المصفوفة المليونية مع كل رندرة صغيرة للشاشة.
  // المصفوفة ستتم معالجتها *فقط* في حال تغير بيانات السائقين، أو تغير نص البحث. ويحافظ على المعالج.
  const onlineDrivers = useMemo(() => {
    return driversList.filter(d =>
      d.isOnline === true &&
      (searchTerm === "" || (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
    ).map(d => {
      // عملية دمج حية (Real-Time Fusion):
      // نأخذ بيانات التتبع اللحظية القادمة من SSE. إذا انقطع الاتصال للحظات،
      // نستخدم الإحداثيات الثابتة القديمة للسائق (Fallback Logic) حتى لا تختفي سيارته من الخريطة فجأة.
      const liveData = trackingData[d.id];
      return {
        ...d,
        lat: liveData?.lat || d.lat || d.currentLocation?.lat || d.currentLocation?.latitude || d.currentLocation?._latitude,
        lng: liveData?.lng || d.lng || d.currentLocation?.lng || d.currentLocation?.longitude || d.currentLocation?._longitude,
        speed: liveData?.speed || d.speed || 0,
        heading: liveData?.heading || d.heading || 0,
        lastLocationUpdate: liveData?.updatedAt
      };
    });
  }, [driversList, searchTerm, trackingData]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const total = onlineDrivers.length;
    const busy = onlineDrivers.filter(d => d.isBusy).length;
    const avgSpeed = total > 0 ? Math.round(onlineDrivers.reduce((acc, d) => acc + (d.speed || 0), 0) / total) : 0;
    const avgBattery = total > 0 ? Math.round(onlineDrivers.reduce((acc, d) => acc + (d.battery || 100), 0) / total) : 0;

    return { total, busy, avgSpeed, avgBattery };
  }, [onlineDrivers]);

  // استخدام useCallback لمنع إعادة تعريف الدالة في كل رندرة
  // --- ربط السائق المحدد بالبيانات اللحظية (لضمان التحديث المباشر في النافذة المنبثقة) ---
  const currentSelectedDriver = useMemo(() => {
    if (!selectedDriver) return null;
    // ابحث عن السائق في القائمة اللحظية التي يتم تحديثها عبر SSE للحصول على أحدث موقع وسرعة
    // إذا لم يوجد (مثلاً أصبح أوفلاين)، نُبقي البيانات القديمة لمنع الاختفاء المفاجئ للنافذة
    return onlineDrivers.find(d => d.id === selectedDriver.id) || selectedDriver;
  }, [selectedDriver, onlineDrivers]);

  const handleFocusDriver = useCallback(async (driver) => {
    const rawLat = driver.lat || driver.currentLocation?.lat || driver.currentLocation?.latitude || driver.currentLocation?._latitude;
    const rawLng = driver.lng || driver.currentLocation?.lng || driver.currentLocation?.longitude || driver.currentLocation?._longitude;

    if (!rawLat || !rawLng) {
      toast.error('لم يتم تحديد موقع هذا السائق', { icon: '📍' });
      return;
    }

    // إعادة ضبط المسار القديم لحماية الخريطة من التعليق
    setDirectionsResponse(null);
    setActiveOrder(null);

    // هذه الخدعة الهندسية (Trick) مهمة جداً: نقوم بتفريغ السائق المحدد مؤقتاً بصفر (null)
    // السبب: إجبار مكتبة React على حرق (Destroy) وتدمير نافذة InfoWindow القديمة من الذاكرة الرام (RAM)
    // قبل إنشائها من جديد بالإحداثيات الحديثة، هذا يمنع تعارض مكتبة Google Maps وانهيار المتصفح (Crash).
    setSelectedDriver(null);
    setDriverLocationName("جاري التحديد...");

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    setTimeout(async () => {
      setSelectedDriver(driver);

      if (map && !isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
        map.setZoom(15);

        // جلب اسم الشارع/المدينة (Reverse Geocoding)
        try {
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setDriverLocationName(results[0].formatted_address);
              } else {
                console.warn('Geocoding notice:', status);
                setDriverLocationName('موقع غير معروف');
              }
            });
          } else {
             setDriverLocationName('خدمة العناوين غير مفعلة');
          }
        } catch (err) {
          setDriverLocationName('تعذر جلب العنوان');
        }
      }

      // جلب الطلب النشط إذا كان السائق مشغولاً
      if (driver.isBusy) {
        setIsFetchingRoute(true);
        try {
          const order = await getActiveOrderByDriver(driver.id);
          if (order) {
            setActiveOrder(order);
          } else {
            toast.error("لا يوجد طلب نشط لهذا السائق حالياً", {
              icon: '⚠️',
              style: { borderRadius: '15px', fontWeight: 'bold' }
            });
          }
        } catch (err) {
          console.error("Error fetching active order:", err);
        } finally {
          setIsFetchingRoute(false);
        }
      } else {
        toast("السائق متاح حالياً ولا يوجد لديه طلب نشط", {
          icon: 'ℹ️',
          style: { borderRadius: '15px', fontWeight: 'bold' }
        });
      }
    }, 50); // تأخير بسيط لضمان تنظيف DOM
  }, [map]); // تعتمد فقط على الـ map instance

  // معالجة نتيجة اتجاهات جوجل
  const directionsCallback = useCallback((response) => {
    if (response !== null) {
      if (response.status === 'OK') {
        setDirectionsResponse(response);
      } else {
        console.error('Directions request failed:', response.status);
      }
    }
  }, []);

  // حساب نقاط المسار
  const routePoints = useMemo(() => {
    if (!selectedDriver || !activeOrder) return null;

    const driverPos = {
      lat: Number(selectedDriver.lat || selectedDriver.currentLocation?.lat || selectedDriver.currentLocation?.latitude || selectedDriver.currentLocation?._latitude),
      lng: Number(selectedDriver.lng || selectedDriver.currentLocation?.lng || selectedDriver.currentLocation?.longitude || selectedDriver.currentLocation?._longitude)
    };

    const pickupPos = {
      lat: Number(activeOrder.pickupLocation?.lat || activeOrder.pickupLocation?._latitude || activeOrder.pickupLocation?.latitude),
      lng: Number(activeOrder.pickupLocation?.lng || activeOrder.pickupLocation?._longitude || activeOrder.pickupLocation?.longitude)
    };

    const dropoffPos = {
      lat: Number(activeOrder.dropoffLocation?.lat || activeOrder.dropoffLocation?._latitude || activeOrder.dropoffLocation?.latitude),
      lng: Number(activeOrder.dropoffLocation?.lng || activeOrder.dropoffLocation?._longitude || activeOrder.dropoffLocation?.longitude)
    };

    if (!pickupPos.lat || !dropoffPos.lat) return null;

    return { origin: driverPos, waypoint: pickupPos, destination: dropoffPos };
  }, [selectedDriver, activeOrder]);

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-red-50 rounded-3xl p-10 border border-red-100">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
      <h2 className="text-2xl font-black text-red-900 mb-2">خطأ في تحميل الخريطة</h2>
      <p className="text-red-700 font-bold mb-6 text-center max-w-md">فشل الاتصال بخوادم Google Maps. يرجى التحقق من مفتاح الـ API وتأكد من تفعيل الخدمة.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200">إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      {/* --- الهيدر و الإحصائيات --- */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        {/* Title Section */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-primary-900/5 border border-gray-50 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-normal text-gray-900 italic">التتبع المباشر</h1>
              <p className="text-gray-500 font-normal text-sm tracking-wide">مراقبة حركة الأسطول في الوقت الفعلي</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-[2]">
          <StatCard icon={<Truck className="w-5 h-5" />} label="إجمالي السائقين" value={onlineDrivers.length} color="bg-green-500" />
          <StatCard icon={<Zap className="w-5 h-5" />} label="في مهمة حالية" value={onlineDrivers.filter(d => d.isBusy).length} color="bg-orange-500" />
          <StatCard icon={<Navigation className="w-5 h-5" />} label="سائقون متاحون" value={onlineDrivers.filter(d => !d.isBusy).length} color="bg-blue-500" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="جاري التتبع" value="مفعل" color="bg-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* --- القائمة الجانبية للسائقين --- */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-2xl shadow-primary-900/5 border border-gray-50 flex flex-col h-[650px] overflow-hidden">
          <div className="p-6 pb-4 border-b border-gray-50 bg-gray-50/30">
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input
                type="text"
                placeholder="ابحث عن سائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-4 bg-white rounded-3xl border border-gray-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-normal text-sm text-gray-700 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-3xl" />)}
              </div>
            ) : onlineDrivers.length > 0 ? (
              <>
                {onlineDrivers.slice(0, visibleCount).map(driver => (
                  <MemoizedDriverCard
                    key={driver.id}
                    driver={driver}
                    isSelected={currentSelectedDriver?.id === driver.id}
                    onClick={handleFocusDriver}
                  />
                ))}
                {visibleCount < onlineDrivers.length && (
                  <div className="py-4 text-center">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] text-gray-400 font-normal mt-2 font-arabic">جاري تحميل بقية الأسطول...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center px-6">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Truck className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-normal text-sm">لم يتم العثور على سائقين متصلين حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* --- الخريطة الاحترافية --- */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] shadow-2xl shadow-primary-900/5 border border-gray-50 relative overflow-hidden h-[650px]">
          {(!isLoaded || !showMap) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-normal animate-pulse">جاري تهيئة مركز التتبع المباشر...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={MAP_CENTER}
              zoom={13}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              onClick={() => setSelectedDriver(null)}
            >
              <MarkerClusterer
                options={{
                  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                  gridSize: 60,
                  minimumClusterSize: 2,
                  averageCenter: true, // تحسين الأداء
                  maxZoom: 15, // إيقاف التجميع عند التقريب تجنباً لاختفاء الخريطة
                  styles: [
                    {
                      textColor: 'white',
                      url: 'https://raw.githubusercontent.com/googlemaps/js-markerclustererplus/master/images/m1.png',
                      height: 53,
                      width: 52,
                      textSize: 12
                    }
                  ]
                }}
              >
                {(clusterer) => (
                  <>
                    {onlineDrivers.map(driver => (
                      <MemoizedMarker
                        key={driver.id}
                        driver={driver}
                        clusterer={clusterer}
                        onClick={handleFocusDriver}
                      />
                    ))}
                  </>
                )}
              </MarkerClusterer>

              {/* --- رسم المسار --- */}
              {routePoints && !directionsResponse && (
                <DirectionsService
                  options={{
                    origin: routePoints.origin,
                    destination: routePoints.destination,
                    waypoints: [{ location: routePoints.waypoint, stopover: true }],
                    travelMode: 'DRIVING',
                  }}
                  callback={directionsCallback}
                />
              )}

              {directionsResponse && (
                <DirectionsRenderer
                  options={{
                    directions: directionsResponse,
                    suppressMarkers: true, // سنقوم برسم الماركرز الخاصة بنا يدوياً
                    polylineOptions: {
                      strokeColor: "#2563EB",
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    }
                  }}
                />
              )}

              {/* --- ماركرز نقاط الطلب --- */}
              {activeOrder && (
                <>
                  {/* نقطة الاستلام - أزرق */}
                  <Marker
                    position={{
                      lat: Number(activeOrder.pickupLocation?.lat || activeOrder.pickupLocation?._latitude || activeOrder.pickupLocation?.latitude),
                      lng: Number(activeOrder.pickupLocation?.lng || activeOrder.pickupLocation?._longitude || activeOrder.pickupLocation?.longitude)
                    }}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    }}
                    title="نقطة الاستلام"
                  />
                  {/* نقطة التسليم - أحمر */}
                  <Marker
                    position={{
                      lat: Number(activeOrder.dropoffLocation?.lat || activeOrder.dropoffLocation?._latitude || activeOrder.dropoffLocation?.latitude),
                      lng: Number(activeOrder.dropoffLocation?.lng || activeOrder.dropoffLocation?._longitude || activeOrder.dropoffLocation?.longitude)
                    }}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }}
                    title="نقطة التسليم"
                  />
                </>
              )}

              {currentSelectedDriver && (currentSelectedDriver.lat || currentSelectedDriver.currentLocation) && (
                <InfoWindow
                  position={{
                    lat: Number(currentSelectedDriver.lat || currentSelectedDriver.currentLocation?.lat || currentSelectedDriver.currentLocation?._latitude || currentSelectedDriver.currentLocation?.latitude),
                    lng: Number(currentSelectedDriver.lng || currentSelectedDriver.currentLocation?.lng || currentSelectedDriver.currentLocation?._longitude || currentSelectedDriver.currentLocation?.longitude)
                  }}
                  onCloseClick={() => setSelectedDriver(null)}
                >
                  <div className="p-2 min-w-[200px] font-arabic" dir="rtl">
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSelectedDriver.isBusy ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-normal text-gray-900 text-sm">{currentSelectedDriver.name || 'سائق'}</h5>
                        <p className="text-[10px] text-gray-400 font-normal">{currentSelectedDriver.vehicleType || 'مركبة نقل'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-normal">
                        <span className="text-gray-400">رقم السائق:</span>
                        <span className="text-primary-600 italic">#{currentSelectedDriver.id?.substring(0, 8) || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-400">الحالة:</span>
                        <span className={`${currentSelectedDriver.isBusy ? 'text-orange-600' : 'text-green-600'}`}>
                          {currentSelectedDriver.isBusy ? 'في رحلة نشطة' : 'متصل ومتاح'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/drivers/${currentSelectedDriver.id}`)}
                      className="w-full mt-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-gray-800 transition-colors"
                    >
                      عرض الملف الشخصي الكامل
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}

          {/* Legend Overlay */}
          <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl shadow-primary-900/10 space-y-2 z-10 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-200" />
              <span className="text-[10px] font-black text-gray-700 underline underline-offset-4 decoration-green-200">سائق متاح للهبات</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-200" />
              <span className="text-[10px] font-black text-gray-700 underline underline-offset-4 decoration-orange-200">سائق مشغول بطلب</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- المكونات الفرعية الجاهزة للإنتاج (Performance Optimized Components) ---

// 1. الماركر المحفوظ في الذاكرة (Memoized Driver Marker)
// لماذا استخدمنا memo؟
// في الخريطة الطبيعية، أي تغير بسيط بالشاشة (مثلا كتابة حرف في مربع البحث) سيؤدي لإعادة رسم الجرافيكس لجميع السيارات بالخريطة!
// هذه الدالة توقف إعادة الرسم (Re-render) المجهد، ولا تقوم برسم السيارة من جديد *إلا إذا* تحرك مكانها الحقيقي فعلاً، مما يوفر أداء خيالي.
const MemoizedMarker = memo(({ driver, clusterer, onClick }) => {
  const latRaw = driver.lat || driver.currentLocation?.lat || driver.currentLocation?._latitude || driver.currentLocation?.latitude;
  const lngRaw = driver.lng || driver.currentLocation?.lng || driver.currentLocation?._longitude || driver.currentLocation?.longitude;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!lat || !lng) return null;

  return (
    <Marker
      position={{ lat, lng }}
      clusterer={clusterer} // دمج الماركر داخل المجمع (Clusterer) بدلاً من تركه حراً لتجنب زحمة الخريطة عند تصغيرها
      onClick={() => onClick(driver)}
      icon={{
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z", // أيقونة فيكتور (SVG) لأنها أخف من تحميل الصور العادية
        fillColor: driver.isBusy ? "#F97316" : "#22C55E", // اللون البرتقالي للسائق في مهمة، والأخضر للمتاح
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
        scale: 2,
        anchor: { x: 12, y: 22 }
      }}
    />
  );
}, (prevProps, nextProps) => {
  // دالة الشروط المعمارية للرسم: 
  // تخبر الرياكت ألا ينفذ الكود بالأعلى إطلاقاً، وتعامله كصورة مخبأة (Cached) طالما هذه القيم لم تتغير.
  return (
    prevProps.driver.lat === nextProps.driver.lat &&
    prevProps.driver.lng === nextProps.driver.lng &&
    prevProps.driver.currentLocation?.lat === nextProps.driver.currentLocation?.lat &&
    prevProps.driver.currentLocation?.lng === nextProps.driver.currentLocation?.lng &&
    prevProps.driver.isBusy === nextProps.driver.isBusy &&
    prevProps.driver.isOnline === nextProps.driver.isOnline
  );
});

// 2. كرت السائق المحفوظ (Memoized Driver Card)
const MemoizedDriverCard = memo(({ driver, isSelected, onClick }) => {
  return (
    <div
      onClick={() => onClick(driver)}
      className={`p-4 rounded-3xl border transition-all cursor-pointer group ${isSelected
        ? 'bg-primary-50 border-primary-200 shadow-lg shadow-primary-100 scale-[1.02]'
        : 'bg-white border-gray-50 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${driver.isBusy ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          <h4 className="font-black text-gray-900 group-hover:text-primary-700 transition-colors truncate max-w-[120px]">{driver.name || 'سائق'}</h4>
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${driver.isBusy ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
          {driver.isBusy ? 'مشغول' : 'متاح'}
        </span>
      </div>
      <div className="text-[10px] font-bold text-gray-400">
        <p className="truncate">معرّف: {driver.id?.substring(0, 8)}</p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.driver.isBusy === nextProps.driver.isBusy &&
    prevProps.driver.speed === nextProps.driver.speed &&
    prevProps.driver.battery === nextProps.driver.battery
  );
});

const StatCard = memo(({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-primary-900/5 border border-gray-50 flex items-center gap-4 group hover:scale-[1.03] transition-transform duration-300">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} group-hover:rotate-12 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 font-bold text-[10px] mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  </div>
));

export default TrackingPage;