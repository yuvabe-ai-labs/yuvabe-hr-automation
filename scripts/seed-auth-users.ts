/**
 * Seed Supabase Auth + users table for local dev.
 *
 * Creates three role-based accounts in Supabase Auth and mirrors them into
 * the public.users table so the app can read roles.
 *
 *   hr@yuvabe.com   / hr@yuvabe    → admin
 *   hm@yuvabe.com   / hm@yuvabe    → manager
 *   viewer@yuvabe.com / viewer@yuvabe → viewer
 *
 * Idempotent — uses upsert so safe to re-run. Passwords can be changed any
 * time via the Supabase dashboard (Authentication → Users).
 *
 * Run: pnpm db:seed-auth
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  { email: "hr@yuvabe.com",     password: "hr@yuvabe",     name: "HR Admin",        role: "admin"   },
  { email: "hm@yuvabe.com",     password: "hm@yuvabe",     name: "Hiring Manager",  role: "manager" },
  { email: "viewer@yuvabe.com", password: "viewer@yuvabe", name: "Viewer",          role: "viewer"  },
] as const;

async function seedAuthUsers() {
  console.log("Seeding Supabase Auth users...\n");

  for (const u of USERS) {
    // 1 — Create or update in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // skip email verification for dev seed
      user_metadata: { name: u.name, role: u.role },
    });

    let authUserId: string;

    if (error) {
      if (error.message.includes("already been registered")) {
        // User exists — fetch their ID then reset password to match seed
        const { data: list, error: listErr } =
          await supabase.auth.admin.listUsers();
        if (listErr) throw listErr;
        const existing = list.users.find((usr) => usr.email === u.email);
        if (!existing) throw new Error(`Could not find existing user ${u.email}`);
        authUserId = existing.id;
        // Ensure password matches what the seed defines
        const { error: updateErr } = await supabase.auth.admin.updateUserById(
          authUserId,
          { password: u.password, user_metadata: { name: u.name, role: u.role } }
        );
        if (updateErr) throw new Error(`Failed to update password for ${u.email}: ${updateErr.message}`);
        console.log(`  ↩  ${u.email} (already exists, password reset, id ${authUserId})`);
      } else {
        throw error;
      }
    } else {
      authUserId = data.user.id;
      console.log(`  ✓  ${u.email} created (${authUserId})`);
    }

    // 2 — Upsert into public.users with the Supabase Auth UUID as id
    const { error: dbErr } = await supabase.from("users").upsert(
      {
        id: authUserId,
        email: u.email,
        name: u.name,
        role: u.role,
      },
      { onConflict: "email" }
    );

    if (dbErr) throw new Error(`DB upsert failed for ${u.email}: ${dbErr.message}`);
    console.log(`  ✓  users table synced for ${u.email} (role: ${u.role})\n`);
  }

  console.log("Done. All auth users seeded.");
}

seedAuthUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
