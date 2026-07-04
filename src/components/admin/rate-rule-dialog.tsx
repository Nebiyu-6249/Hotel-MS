"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { upsertRateRule } from "@/app/admin/(dashboard)/rooms/actions";

export type RateRuleFormData = {
  id: string;
  name: string;
  kind: "MULTIPLIER" | "FIXED";
  value: number; // percent for MULTIPLIER, euros for FIXED
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
  roomTypeId: string | null;
};

export function RateRuleDialog({
  rule,
  roomTypes,
  triggerLabel,
  triggerVariant = "light",
}: {
  rule?: RateRuleFormData;
  roomTypes: { id: string; name: string }[];
  triggerLabel: string;
  triggerVariant?: "light" | "dark" | "ghost";
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent title={rule ? `Edit rule: ${rule.name}` : "New rate rule"}>
        <form action={upsertRateRule} className="space-y-4">
          {rule && <input type="hidden" name="id" value={rule.id} />}
          <div>
            <Label htmlFor="rr-name">Name</Label>
            <Input
              id="rr-name"
              name="name"
              defaultValue={rule?.name}
              placeholder="Summer season, Christmas week..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rr-kind">Kind</Label>
              <Select id="rr-kind" name="kind" defaultValue={rule?.kind ?? "MULTIPLIER"}>
                <option value="MULTIPLIER">Percent of base rate</option>
                <option value="FIXED">Fixed nightly rate</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="rr-value">Value</Label>
              <Input
                id="rr-value"
                name="value"
                type="number"
                step="0.01"
                defaultValue={rule?.value}
                required
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Percent: 125 means base +25%. Fixed: the EUR nightly rate.
              </p>
            </div>
            <div>
              <Label htmlFor="rr-start">From (inclusive)</Label>
              <Input
                id="rr-start"
                name="startDate"
                type="date"
                defaultValue={rule?.startDate}
                required
              />
            </div>
            <div>
              <Label htmlFor="rr-end">To (inclusive)</Label>
              <Input
                id="rr-end"
                name="endDate"
                type="date"
                defaultValue={rule?.endDate}
                required
              />
            </div>
            <div>
              <Label htmlFor="rr-scope">Applies to</Label>
              <Select id="rr-scope" name="roomTypeId" defaultValue={rule?.roomTypeId ?? ""}>
                <option value="">Every room type</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="rr-priority">Priority (higher wins)</Label>
              <Input
                id="rr-priority"
                name="priority"
                type="number"
                defaultValue={rule?.priority ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={rule?.active ?? true}
              className="h-4 w-4"
            />
            Active
          </label>
          <Button type="submit" variant="dark">
            Save Rule
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
