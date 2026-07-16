// Scheduled edge function: emails trial users whose 14-day trial is about to end
// or has just ended, so they aren't silently locked out.
//
// Deploy:   supabase functions deploy send-trial-reminders
// Schedule: run daily. Easiest option is Supabase Dashboard -> Edge Functions ->
//           send-trial-reminders -> Cron, schedule "0 14 * * *" (once a day).
//           Alternatively, schedule via pg_cron + pg_net from the SQL editor:
//
//   select cron.schedule(
//     'send-trial-reminders-daily',
//     '0 14 * * *',
//     $$
//     select net.http_post(
//       url := 'https://<project-ref>.supabase.co/functions/v1/send-trial-reminders',
//       headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
//     );
//     $$
//   );
//
// ASSUMPTIONS (verify/adjust against your actual schema before relying on this):
//   - Trial start = auth.users.created_at (no separate trial_start column was found
//     anywhere in the frontend code, so signup time is used as the trial clock).
//   - Trial length = 14 days, matching the app's advertised free trial.
//   - "Still on trial" = the user has no row in public.subscriptions with a status
//     of 'active', 'trialing', or 'past_due'. ADJUST the table/column names in the
//     query below to match your real subscriptions table if this doesn't match.
//   - Reminders are sent once each at 3 days left and 0 days left (trial-just-ended),
//     tracked via a `trial_reminders_sent` table (created by the migration below) so
//     the same user doesn't get double-emailed if this function runs more than once
//     in a day.
//
// This function reuses the existing `send-email` function (already used for
// estimate/invoice emails) so it goes through whatever email provider is already
// configured there, rather than introducing a second email pathway.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REMINDER_WINDOWS = [3, 0]; // days left: "3 days left" and "trial ended today"

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Pull users who signed up 11-14 days ago (covers both reminder windows) and
    // don't have an active/trialing/past_due subscription row.
    // NOTE: adjust the `subscriptions` table/column names to match your schema.
    const { data: users, error: usersError } = await supabase
      .from('users_view_for_trial_reminders') // see migration below for this view
      .select('id, email, full_name, created_at, days_left')
      .in('days_left', REMINDER_WINDOWS);

    if (usersError) throw usersError;

    const results: { userId: string; daysLeft: number; ok: boolean }[] = [];

    for (const user of users ?? []) {
      const { data: already } = await supabase
        .from('trial_reminders_sent')
        .select('id')
        .eq('user_id', user.id)
        .eq('days_left', user.days_left)
        .maybeSingle();

      if (already) continue; // already emailed for this milestone

      const templateType = user.days_left === 0 ? 'trial_ended' : 'trial_ending_soon';

      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          templateType,
          data: {
            clientName: user.full_name || 'there',
            daysLeft: user.days_left,
          },
        },
      });

      if (!sendError) {
        await supabase.from('trial_reminders_sent').insert({
          user_id: user.id,
          days_left: user.days_left,
        });
      }

      results.push({ userId: user.id, daysLeft: user.days_left, ok: !sendError });
    }

    return new Response(JSON.stringify({ success: true, sent: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
