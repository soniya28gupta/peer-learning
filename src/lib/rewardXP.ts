import { supabase } from "@/integrations/supabase/client";

export const rewardXP = async (
  userId: string,
  amount: number
) => {
  // We pass _amount to the secure RPC. The RPC uses auth.uid() 
  // so it guarantees the user can only award XP to themselves (if allowed by logic)
  // or it could be modified to accept an admin role in the future.
  await (supabase as any).rpc("increment_user_xp", { _amount: amount });
};

