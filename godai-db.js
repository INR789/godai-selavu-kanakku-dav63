// GOD AI தரவு உதவி — உள்நுழைவு + சேமிப்பு. ஒவ்வொரு பயனரும் தன் தரவை மட்டுமே பார்க்க முடியும்.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const sb = createClient("https://etneuiosfnfgwadkudas.supabase.co", "sb_publishable_iGJLP37L3HkwbYX16areMw_Gmc13jFQ");
const APP = "godai-selavu-kanakku-dav63";
export const GodDB = {
  async signUp(email, password) { const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href } }); if (error) throw error; return data.user; },
  async signIn(email, password) { const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; return data.user; },
  async signOut() { await sb.auth.signOut(); },
  async user() { const { data } = await sb.auth.getUser(); return data.user; },
  onAuth(cb) { sb.auth.onAuthStateChange((_e, s) => cb(s?.user ?? null)); },
  async list(collection) { const { data, error } = await sb.from("autobuild_records").select("id,data,created_at").eq("app_id", APP).eq("collection", collection).order("created_at", { ascending: false }); if (error) throw error; return data.map((r) => ({ id: r.id, created_at: r.created_at, ...r.data })); },
  async add(collection, obj) { const { data, error } = await sb.from("autobuild_records").insert({ app_id: APP, collection, data: obj }).select("id").single(); if (error) throw error; return data.id; },
  async update(id, obj) { const { error } = await sb.from("autobuild_records").update({ data: obj, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; },
  async remove(id) { const { error } = await sb.from("autobuild_records").delete().eq("id", id); if (error) throw error; },
};
window.GodDB = GodDB;
