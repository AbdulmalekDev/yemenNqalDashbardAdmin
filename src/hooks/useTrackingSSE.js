import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RECONNECT_DELAY_MS = 5000;

export const useTrackingSSE = () => {
    const [trackingData, setTrackingData] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `${API_BASE_URL}/tracking/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
            setIsConnected(true);
            console.log("Connected to Tracking SSE");
        };

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'tracking_update') {
                    // payload.data عبارة عن قاموس (Object) حيث المفتاح هو driverId
                    setTrackingData(prev => ({
                        ...prev,
                        ...payload.data
                    }));
                }
            } catch (err) {
                // Heartbeat or parsing error
            }
        };

        es.onerror = () => {
            es.close();
            setIsConnected(false);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    return { trackingData, isConnected };
};
