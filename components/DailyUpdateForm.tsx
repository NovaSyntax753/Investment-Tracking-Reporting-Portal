"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createDailyUpdateAction } from "@/lib/actions/updates";

interface Investor {
  id: string;
  name: string;
}

const schema = z.object({
  investorId: z.string().min(1, "Select an investor"),
  pnlAmount: z.coerce.number().nonnegative("Enter a valid non-negative amount"),
  tradeNotes: z.string().optional(),
  updateDate: z.string().min(1, "Select a date"),
});

type FormData = z.infer<typeof schema>;

export default function DailyUpdateForm({
  investors,
}: {
  investors: Investor[];
}) {
  const [selectedInvestor, setSelectedInvestor] = useState("all");
  const [pnlDirection, setPnlDirection] = useState<"plus" | "minus">("plus");
  const selectedInvestorLabel = selectedInvestor
    ? selectedInvestor === "all"
      ? "All Investors"
      : investors.find((i) => i.id === selectedInvestor)?.name ||
        "Unknown Investor"
    : "";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      investorId: "all",
      updateDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(data: FormData) {
    const fd = new FormData();
    fd.append("investorId", data.investorId);
    fd.append("amountMode", "pnl");
    fd.append("pnlAmount", String(data.pnlAmount));
    fd.append("pnlDirection", pnlDirection);
    fd.append("tradeNotes", data.tradeNotes ?? "");
    fd.append("updateDate", data.updateDate);

    const res = await createDailyUpdateAction(fd);
    if (res?.error) {
      toast.error(res.error);
    } else {
      const label =
        data.investorId === "all"
          ? "All investors"
          : investors.find((i) => i.id === data.investorId)?.name;
      if (res && "warning" in res && res.warning) {
        const failures =
          "notificationFailures" in res &&
          Array.isArray(res.notificationFailures)
            ? res.notificationFailures
            : [];
        const details =
          failures.length > 0 ? `\n${failures.slice(0, 2).join("\n")}` : "";
        toast.warning(`${res.warning}${details}`);
      } else {
        toast.success(`Daily update posted for ${label}`);
      }
      reset({
        investorId: "all",
        pnlAmount: 0,
        updateDate: format(new Date(), "yyyy-MM-dd"),
      });
      setSelectedInvestor("all");
      setPnlDirection("plus");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-6 rounded-xl border border-gold/20 bg-gradient-to-b from-charcoal to-navy/70 p-5 shadow-xl shadow-black/25"
    >
      {/* Investor selector */}
      <div className="space-y-1.5">
        <Label>Investor</Label>
        <Select
          value={selectedInvestor}
          onValueChange={(v) => {
            if (v) {
              setSelectedInvestor(v);
              setValue("investorId", v, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger className="bg-navy border-gold/20">
            <SelectValue placeholder="Select investor...">
              {selectedInvestorLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-charcoal border-gold/20">
            <SelectItem value="all" className="text-gold font-medium">
              All Investors
            </SelectItem>
            {investors.map((inv) => (
              <SelectItem key={inv.id} value={inv.id}>
                {inv.name || "Unknown Investor"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.investorId && (
          <p className="text-sm text-destructive">
            {errors.investorId.message}
          </p>
        )}
      </div>

      {/* P&L Amount */}
      <div className="space-y-2 rounded-lg border border-gold/15 bg-navy/45 p-3">
        <Label htmlFor="pnlAmount">P&L Amount (₹)</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className={`h-10 w-12 border-gold/30 px-0 ${
              pnlDirection === "minus"
                ? "border-red-400/60 bg-red-500/15 text-red-300"
                : "bg-charcoal text-muted-foreground"
            }`}
            onClick={() => setPnlDirection("minus")}
            aria-label="Negative P&L"
          >
            -
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`h-10 w-12 border-gold/30 px-0 ${
              pnlDirection === "plus"
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "bg-charcoal text-muted-foreground"
            }`}
            onClick={() => setPnlDirection("plus")}
            aria-label="Positive P&L"
          >
            +
          </Button>
          <Input
            id="pnlAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 2500"
            className="border-gold/20 bg-navy terminal-text font-tabular focus:border-gold"
            {...register("pnlAmount")}
          />
        </div>
        {errors.pnlAmount && (
          <p className="text-sm text-destructive">{errors.pnlAmount.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {selectedInvestor === "all"
            ? "Applied as signed P&L to each active investor's latest EOD value."
            : "Applied as signed P&L over this investor's latest EOD value."}
        </p>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="updateDate">Update Date</Label>
        <Input
          id="updateDate"
          type="date"
          className="bg-navy border-gold/20 focus:border-gold"
          {...register("updateDate")}
        />
        {errors.updateDate && (
          <p className="text-sm text-destructive">
            {errors.updateDate.message}
          </p>
        )}
      </div>

      {/* Trade notes */}
      <div className="space-y-1.5">
        <Label htmlFor="tradeNotes">Trade Notes (optional)</Label>
        <Textarea
          id="tradeNotes"
          rows={4}
          placeholder="Market outlook, key trades, strategy notes…"
          className="bg-navy border-gold/20 focus:border-gold resize-none"
          {...register("tradeNotes")}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold font-bold text-navy-deep hover:bg-gold-light"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting Update…
          </>
        ) : (
          "Post Daily Update"
        )}
      </Button>
    </form>
  );
}
