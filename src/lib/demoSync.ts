import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * When a DEMO activity is created:
 * 1. Create a demo record in the `demos` table
 * 2. Move the linked opportunity to DEMO_SCHEDULED (if not already past that stage)
 */
export async function syncDemoFromActivity(params: {
  accountId: string;
  opportunityId: string;
  demoDate: string;
  location?: string;
  visitedBy?: string[];
  demoNote?: string;
}) {
  const { accountId, opportunityId, demoDate, location, visitedBy, demoNote } = params;

  // 1. Create demo record
  const { error: demoErr } = await supabase.from('demos').insert({
    account_id: accountId,
    opportunity_id: opportunityId,
    demo_date: demoDate,
    location: location || null,
    visited_by: visitedBy || null,
    demo_note: demoNote || null,
  });
  if (demoErr) {
    console.error('Failed to create demo record:', demoErr);
  }

  // 2. Move opportunity to DEMO_SCHEDULED if it's in an earlier stage
  const earlyStages = ['NEW_LEAD', 'CONTACTED'];
  const { data: opp } = await supabase
    .from('opportunities')
    .select('stage')
    .eq('id', opportunityId)
    .single();

  if (opp && earlyStages.includes(opp.stage)) {
    await supabase
      .from('opportunities')
      .update({ stage: 'DEMO_SCHEDULED' })
      .eq('id', opportunityId);

    // Record stage history
    await supabase.from('opportunity_stage_history').insert({
      opportunity_id: opportunityId,
      from_stage: opp.stage,
      to_stage: 'DEMO_SCHEDULED',
      changed_by: 'system (demo sync)',
    });
  }
}

/**
 * When a demo is created directly (from DemosPage):
 * Ensure the account has an opportunity at DEMO_SCHEDULED.
 * - If opportunity exists for this account → move it to DEMO_SCHEDULED (if earlier)
 * - If no opportunity exists → create one at DEMO_SCHEDULED
 * Returns the opportunity_id used.
 */
export async function ensureOpportunityForDemo(params: {
  accountId: string;
  assignedSale?: string;
}): Promise<string | null> {
  const { accountId, assignedSale } = params;

  // Find existing non-terminal opportunity for this account
  const { data: existingOpps } = await supabase
    .from('opportunities')
    .select('id, stage')
    .eq('account_id', accountId)
    .not('stage', 'in', '("WON","LOST")')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingOpps && existingOpps.length > 0) {
    const opp = existingOpps[0];
    const earlyStages = ['NEW_LEAD', 'CONTACTED'];
    if (earlyStages.includes(opp.stage)) {
      await supabase
        .from('opportunities')
        .update({ stage: 'DEMO_SCHEDULED' })
        .eq('id', opp.id);

      await supabase.from('opportunity_stage_history').insert({
        opportunity_id: opp.id,
        from_stage: opp.stage,
        to_stage: 'DEMO_SCHEDULED',
        changed_by: 'system (demo sync)',
      });
    }
    return opp.id;
  }

  // No existing opportunity → create one
  const { data: newOpp, error } = await supabase
    .from('opportunities')
    .insert({
      account_id: accountId,
      stage: 'DEMO_SCHEDULED',
      opportunity_type: 'DEVICE',
      assigned_sale: assignedSale || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create opportunity for demo:', error);
    toast.error('สร้างโอกาสขายอัตโนมัติไม่สำเร็จ');
    return null;
  }

  return newOpp.id;
}
