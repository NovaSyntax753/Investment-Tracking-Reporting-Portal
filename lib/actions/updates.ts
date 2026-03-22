"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/actions/guards";
import {
  sendDailySMS,
  sendDailyUpdateEmail,
  sendDailyWhatsApp,
} from "@/lib/notifications";

async function notifyDailyUpdate(
  investor: { name: string; email: string | null; phone: string | null },
  eodAmount: number,
  tradeNotes: string | null,
  updateDate: string,
) {
  const failures: string[] = [];

  if (investor.email) {
    try {
      await sendDailyUpdateEmail(
        investor.email,
        investor.name,
        eodAmount,
        tradeNotes,
        updateDate,
      );
    } catch (error) {
      failures.push(`Email: ${(error as Error).message}`);
    }
  }

  if (investor.phone) {
    try {
      await sendDailySMS(investor.phone, investor.name, eodAmount, updateDate);
    } catch (error) {
      failures.push(`SMS: ${(error as Error).message}`);
    }

    try {
      await sendDailyWhatsApp(
        investor.phone,
        investor.name,
        eodAmount,
        updateDate,
      );
    } catch (error) {
      failures.push(`WhatsApp: ${(error as Error).message}`);
    }
  }

  return failures;
}

export async function createDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin();
  if ("error" in authz) return authz;

  const investorId = formData.get("investorId") as string;
  const amountMode =
    (formData.get("amountMode") as string) === "pnl" ? "pnl" : "eod";
  const eodAmount = parseFloat(formData.get("eodAmount") as string);
  const pnlAmount = Number(formData.get("pnlAmount"));
  const pnlDirection =
    (formData.get("pnlDirection") as string) === "minus" ? "minus" : "plus";
  const signedPnl =
    (pnlDirection === "minus" ? -1 : 1) *
    (Number.isFinite(pnlAmount) ? pnlAmount : 0);
  const tradeNotes = (formData.get("tradeNotes") as string) || null;
  const updateDate = formData.get("updateDate") as string;

  if (!investorId || !updateDate) {
    return { error: "Missing required fields" };
  }

  if (amountMode === "eod" && isNaN(eodAmount)) {
    return { error: "Missing required fields" };
  }

  if (amountMode === "pnl" && (!Number.isFinite(pnlAmount) || pnlAmount < 0)) {
    return { error: "Invalid P&L amount" };
  }

  const supabase = await createServiceClient();
  const notificationFailures: string[] = [];

  async function resolveEodAmountForInvestor(targetInvestorId: string) {
    if (amountMode !== "pnl") return eodAmount;

    const { data: latestUpdate, error: latestUpdateError } = await supabase
      .from("daily_updates")
      .select("eod_amount")
      .eq("investor_id", targetInvestorId)
      .order("update_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestUpdateError) {
      return { error: latestUpdateError.message };
    }

    const baseEod = Number(latestUpdate?.eod_amount ?? 0);
    const computedEod = baseEod + signedPnl;

    if (!Number.isFinite(computedEod) || computedEod < 0) {
      return { error: "P&L results in an invalid EOD amount" };
    }

    return computedEod;
  }

  if (investorId === "all") {
    // Fetch all active investors
    const { data: investors, error: fetchError } = await supabase
      .from("investors")
      .select("id, name, email, phone")
      .eq("is_active", true);

    if (fetchError) return { error: fetchError.message };
    if (!investors?.length) return { error: "No active investors found" };

    // Insert one record per investor
    const rows: {
      investor_id: string;
      eod_amount: number;
      trade_notes: string | null;
      update_date: string;
      status: string;
    }[] = [];

    for (const inv of investors) {
      const resolvedAmount = await resolveEodAmountForInvestor(inv.id);
      if (typeof resolvedAmount !== "number") {
        return { error: `Unable to compute EOD for ${inv.name}: ${resolvedAmount.error}` };
      }
      rows.push({
        investor_id: inv.id,
        eod_amount: resolvedAmount,
        trade_notes: tradeNotes,
        update_date: updateDate,
        status: "completed",
      });
    }

    const { error: insertError } = await supabase
      .from("daily_updates")
      .insert(rows);
    if (insertError) return { error: insertError.message };

    for (const inv of investors) {
      const row = rows.find((r) => r.investor_id === inv.id);
      const notifyEodAmount = Number(row?.eod_amount ?? 0);
      const failures = await notifyDailyUpdate(
        inv,
        notifyEodAmount,
        tradeNotes,
        updateDate,
      );
      if (failures.length > 0) {
        notificationFailures.push(`${inv.name}: ${failures.join(" | ")}`);
      }
    }
  } else {
    const resolvedAmount = await resolveEodAmountForInvestor(investorId);
    if (typeof resolvedAmount !== "number") {
      return { error: resolvedAmount.error };
    }

    // Single investor
    const { error: insertError } = await supabase.from("daily_updates").insert({
      investor_id: investorId,
      eod_amount: resolvedAmount,
      trade_notes: tradeNotes,
      update_date: updateDate,
      status: "completed",
    });
    if (insertError) return { error: insertError.message };

    const { data: investor } = await supabase
      .from("investors")
      .select("name, email, phone")
      .eq("id", investorId)
      .maybeSingle();

    if (investor) {
      const failures = await notifyDailyUpdate(
        investor,
        resolvedAmount,
        tradeNotes,
        updateDate,
      );
      if (failures.length > 0) {
        notificationFailures.push(`${investor.name}: ${failures.join(" | ")}`);
      }
    }
  }

  if (notificationFailures.length > 0) {
    return {
      success: true,
      warning: `Daily update saved, but ${notificationFailures.length} notification delivery failure(s) occurred.`,
      notificationFailures,
    };
  }

  return { success: true };
}

// Update a single daily update entry (admin only)
export async function updateDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin();
  if ("error" in authz) return authz;

  const id = formData.get("id") as string;
  const eodAmount = Number(formData.get("eod_amount"));
  const tradeNotesRaw = formData.get("trade_notes");
  const tradeNotes =
    typeof tradeNotesRaw === "string" && tradeNotesRaw.trim().length > 0
      ? tradeNotesRaw.trim()
      : null;
  const statusRaw = formData.get("status");
  const status = statusRaw === "ongoing" ? "ongoing" : "completed";

  if (!id || !Number.isFinite(eodAmount) || eodAmount < 0) {
    return { error: "Missing or invalid fields" };
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("daily_updates")
    .update({
      eod_amount: eodAmount,
      trade_notes: tradeNotes,
      status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/updates");
  revalidatePath("/admin/investors");
  return { success: true };
}

// Delete a single daily update entry (admin only)
export async function deleteDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin();
  if ("error" in authz) return authz;

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing id" };

  const supabase = await createServiceClient();
  const { error } = await supabase.from("daily_updates").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/updates");
  revalidatePath("/admin/investors");
  return { success: true };
}

// Create an "ongoing" placeholder entry (admin only)
export async function createOngoingEntryAction(formData: FormData) {
  const authz = await requireAdmin();
  if ("error" in authz) return authz;

  const investorId = formData.get("investor_id") as string;
  const updateDateInput = formData.get("update_date") as string | null;
  const updateDate = updateDateInput || new Date().toISOString().slice(0, 10);
  const eodAmountRaw = formData.get("eod_amount");
  const eodAmount = Number(eodAmountRaw ?? 0);
  const tradeNotesRaw = formData.get("trade_notes");
  const tradeNotes =
    typeof tradeNotesRaw === "string" && tradeNotesRaw.trim().length > 0
      ? tradeNotesRaw.trim()
      : null;
  const statusRaw = formData.get("status");
  const status = statusRaw === "completed" ? "completed" : "ongoing";

  if (!investorId) return { error: "Missing investor id" };
  if (!Number.isFinite(eodAmount) || eodAmount < 0)
    return { error: "Invalid EOD amount" };

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("daily_updates")
    .insert({
      investor_id: investorId,
      update_date: updateDate,
      eod_amount: eodAmount,
      trade_notes: tradeNotes,
      status,
    })
    .select("id, created_at, eod_amount, trade_notes, update_date, status")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/updates");
  revalidatePath("/admin/investors");
  return {
    success: true,
    id: data.id,
    created_at: data.created_at,
    eod_amount: data.eod_amount,
    trade_notes: data.trade_notes,
    update_date: data.update_date,
    status: data.status,
  };
}
