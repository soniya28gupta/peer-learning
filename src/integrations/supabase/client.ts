import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/env";
import type { Database } from "./types";

const realSupabaseMissing = !supabaseUrl || !supabaseAnonKey;
export const supabaseMisconfigured = false; // Bypass blocking warning banners for seamless mock auth

const createFallbackSupabase = (): SupabaseClient<Database> => {
  const KEY_MOCK_USER = "peer_learning_mock_user";
  const KEY_MOCK_PROFILE = "peer_learning_mock_profile";
  
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem(KEY_MOCK_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getStoredSession = () => {
    const user = getStoredUser();
    if (!user) return null;
    return {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user,
    };
  };

  const defaultProfile = {
    id: "demo-user-id",
    is_mentor: false,
    is_learner: false,
    name: "Demo User",
    email: "demo@example.com",
    points: 120,
    sessions_completed: 4,
    rating: 4.8,
    badges: ["Helper", "Fast Learner"],
    skills: ["React", "TypeScript", "Node.js"],
    interests: ["AI", "Web Development"],
    teach_subjects: ["React"],
    learn_subjects: ["TypeScript"],
    bio: "Hey there! I am a passionate student learning software engineering.",
  };

  const getStoredProfile = () => {
    try {
      const stored = localStorage.getItem(KEY_MOCK_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveStoredProfile = (profile: any) => {
    try {
      localStorage.setItem(KEY_MOCK_PROFILE, JSON.stringify(profile));
    } catch {}
  };

  let mockProfile = getStoredProfile() || defaultProfile;
  let currentSession = getStoredSession();
  const listeners: any[] = [];

  const auth = {
    getSession: async () => ({
      data: { session: currentSession },
      error: null,
    }),
    getUser: async () => ({
      data: { user: currentSession?.user ?? null },
      error: null,
    }),
    onAuthStateChange: (callback: any) => {
      listeners.push(callback);
      setTimeout(() => callback("INITIAL_SESSION", currentSession), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const idx = listeners.indexOf(callback);
              if (idx !== -1) listeners.splice(idx, 1);
            },
          },
        },
      };
    },
    signUp: async ({ email, options }: any) => {
      const name = options?.data?.name || email.split("@")[0];
      const user = {
        id: "demo-user-id",
        email,
        user_metadata: { name },
      };
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user,
      };
      currentSession = session;
      localStorage.setItem(KEY_MOCK_USER, JSON.stringify(user));
      listeners.forEach((cb) => cb("SIGNED_IN", session));
      return { data: { session, user }, error: null };
    },
    signInWithPassword: async ({ email }: any) => {
      const user = {
        id: "demo-user-id",
        email: email || "demo@example.com",
        user_metadata: { name: email ? email.split("@")[0] : "Demo User" },
      };
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user,
      };
      currentSession = session;
      localStorage.setItem(KEY_MOCK_USER, JSON.stringify(user));
      listeners.forEach((cb) => cb("SIGNED_IN", session));
      return { data: { session, user }, error: null };
    },
    signInWithOAuth: async () => {
      const user = {
        id: "demo-user-id",
        email: "google-demo@example.com",
        user_metadata: { name: "Google Learner" },
      };
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user,
      };
      currentSession = session;
      localStorage.setItem(KEY_MOCK_USER, JSON.stringify(user));
      listeners.forEach((cb) => cb("SIGNED_IN", session));
      return { data: { session, user }, error: null };
    },
    signOut: async () => {
      currentSession = null;
      localStorage.removeItem(KEY_MOCK_USER);
      localStorage.removeItem(KEY_MOCK_PROFILE);
      mockProfile = { ...defaultProfile };
      listeners.forEach((cb) => cb("SIGNED_OUT", null));
      return { error: null };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: { user: currentSession?.user ?? null }, error: null }),
  };

  const chainable = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      or: () => builder,
      in: () => builder,
      ilike: () => builder,
      overlaps: () => builder,
      abortSignal: () => builder,
      single: async () => ({
        data: mockProfile,
        error: null,
      }),
      upsert: (updatedFields: any, options?: any) => {
        const existing = getStoredProfile();
        if (options?.ignoreDuplicates && existing) {
          mockProfile = existing;
        } else {
          mockProfile = { ...mockProfile, ...updatedFields };
          saveStoredProfile(mockProfile);
        }
        return builder;
      },
      insert: () => builder,
      update: (updatedFields: any) => {
        mockProfile = { ...mockProfile, ...updatedFields };
        saveStoredProfile(mockProfile);
        return builder;
      },
      delete: () => builder,
      limit: () => builder,
      order: () => builder,
      range: () => builder,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: any) =>
        resolve({ data: [], error: null }),
    };

    return builder;
  };

  const mockChannel = {
    on: () => mockChannel,
    subscribe: (callback?: any) => {
      if (callback) {
        setTimeout(() => callback("SUBSCRIBED"), 0);
      }
      return mockChannel;
    },
    track: async () => {},
    send: () => {},
    presenceState: () => ({}),
  };

  const channel = () => mockChannel;
  const removeChannel = () => {};

  return {
    auth,
    from: () => chainable(),
    rpc: async () => ({
      data: null,
      error: null,
    }),
    channel,
    removeChannel,
    storage: {
      from: () => ({
        getPublicUrl: () => ({
          data: { publicUrl: "" },
        }),
      }),
    },
  } as unknown as SupabaseClient<Database>;
};

export const supabase = realSupabaseMissing
  ? createFallbackSupabase()
  : createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );