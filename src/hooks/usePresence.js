import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function usePresence(userId, userRole) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = {};
        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            online[key] = {
              online: true,
              lastSeen: presences[0].online_at,
              role: presences[0].role,
            };
          }
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            role: userRole || 'clienta',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);

  const isOnline = useCallback((uid) => !!onlineUsers[uid], [onlineUsers]);

  return { onlineUsers, isOnline };
}
