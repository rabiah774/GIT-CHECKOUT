import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserRole } from '@/lib/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'patient' | 'pharmacy' | 'clinic' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Always set loading to false when auth state changes
        
        if (session?.user) {
          // Defer role fetching with error handling
          setTimeout(async () => {
            try {
              const userRole = await getUserRole(session.user.id);
              setRole(userRole);
            } catch (error) {
              console.error('Failed to fetch user role:', error);
              // Set a default role if fetch fails
              setRole('patient');
            }
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userRole = await getUserRole(session.user.id);
          setRole(userRole);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          // Set a default role if fetch fails
          setRole('patient');
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Check if there's an active session first
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // No active session, just clear local state
        setSession(null);
        setUser(null);
        setRole(null);
        return;
      }

      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Error signing out:', error);
        // If it's a session missing error, just clear local state
        if (error.message?.includes('Auth session missing')) {
          setSession(null);
          setUser(null);
          setRole(null);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // If it's a session missing error, just clear local state and don't throw
      if (error instanceof Error && error.message?.includes('Auth session missing')) {
        setSession(null);
        setUser(null);
        setRole(null);
        return;
      }
      throw error;
    }
  };

  return { user, session, role, loading, signOut };
};
