import { createContext, useContext, useEffect, useState } from 'react';
import { io as ioClient } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const socketInstance = ioClient(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      forceNew: true,
    });

    socketInstance.connect();

    console.log(`Socket connecting to ${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`);

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connect error:', error);
    });

    socketInstance.on('new_login_attempt', (data) => {
      console.log('Received new_login_attempt:', data);
      setLastEvent({ type: 'new_login_attempt', data });
      addNotificationDirect({
        type: data.decision === 'BLOCKED' ? 'blocked' :
              data.decision === 'OTP_REQUIRED' ? 'suspicious' : 'allowed',
        message: data.decision === 'BLOCKED'
          ? `🚨 IP ${data.ipAddress} blocked! Risk: ${data.riskScore}`
          : data.decision === 'OTP_REQUIRED'
          ? `⚠️ Suspicious login from ${data.ipAddress}`
          : `✅ New login from ${data.country || 'Unknown'}`,
      });
    });

    socketInstance.on('new_blocked_ip', (data) => {
      console.log('Received new_blocked_ip:', data);
      setLastEvent({ type: 'new_blocked_ip', data });
    });

    socketInstance.on('threat_level_change', (data) => {
      console.log('Received threat_level_change:', data);
      setLastEvent({ type: 'threat_level_change', data });
      if (data.level === 'HIGH') {
        addNotificationDirect({
          type: 'blocked',
          message: '🔴 CRITICAL: System threat level is now HIGH!',
        });
      }
    });

    setSocket(socketInstance);

    function addNotificationDirect(notificationData) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const notification = {
        id,
        ...notificationData
      };
      setNotifications((current) => [notification, ...current]);
      setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== id));
      }, 5000);
    }

    return () => {
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('new_login_attempt');
      socketInstance.off('new_blocked_ip');
      socketInstance.off('threat_level_change');
      socketInstance.disconnect();
    };
  }, []);

  const addNotification = (notification) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((current) => [{ ...notification, id }, ...current]);
    setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  return (
    <SocketContext.Provider value={{ 
      socket, notifications, addNotification, 
      removeNotification, lastEvent 
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}