import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export const signUp = async (data: SignupData, role: 'patient' | 'pharmacy' | 'clinic') => {
  // Set redirect URL based on role
  const redirectUrls = {
    patient: `${window.location.origin}/dashboard/patient`,
    pharmacy: `${window.location.origin}/dashboard/pharmacy`,
    clinic: `${window.location.origin}/dashboard/clinic`,
  };

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        phone: data.phone || '',
        address: data.address || '',
        role: role,
      },
      emailRedirectTo: redirectUrls[role],
    },
  });
  
  return { error };
};

export const signIn = async (data: LoginData) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  return { error };
};

export const getUserRole = async (userId: string): Promise<'patient' | 'pharmacy' | 'clinic' | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    if (!data) {
      console.warn('No role found for user:', userId);
      return null;
    }
    
    return data.role as 'patient' | 'pharmacy' | 'clinic';
  } catch (err) {
    console.error('Exception fetching user role:', err);
    return null;
  }
};
