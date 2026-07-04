import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/admin/page-header";
import { saveSettings } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  await requireStaff(MANAGEMENT);
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Property details, tax rate, house times and the policy text shown at checkout and in emails."
      />

      {searchParams.saved && (
        <p className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Settings saved and live across the site.
        </p>
      )}

      <form action={saveSettings} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Property</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="property_name">Property name</Label>
              <Input
                id="property_name"
                name="property_name"
                defaultValue={settings.property_name}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address_line">Address</Label>
              <Input
                id="address_line"
                name="address_line"
                defaultValue={settings.address_line}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={settings.phone} />
            </div>
            <div>
              <Label htmlFor="email">Public email</Label>
              <Input id="email" name="email" defaultValue={settings.email} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Money and times</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="tax_rate_percent">VAT rate (%)</Label>
              <Input
                id="tax_rate_percent"
                name="tax_rate_percent"
                type="number"
                min={0}
                step="0.1"
                defaultValue={settings.tax_rate_percent}
              />
            </div>
            <div>
              <Label htmlFor="check_in_time">Check-in from</Label>
              <Input
                id="check_in_time"
                name="check_in_time"
                defaultValue={settings.check_in_time}
              />
            </div>
            <div>
              <Label htmlFor="check_out_time">Check-out by</Label>
              <Input
                id="check_out_time"
                name="check_out_time"
                defaultValue={settings.check_out_time}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy and messaging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cancellation_policy">
                Cancellation policy (shown before payment, in emails and on the
                policies page)
              </Label>
              <Textarea
                id="cancellation_policy"
                name="cancellation_policy"
                rows={4}
                defaultValue={settings.cancellation_policy}
              />
            </div>
            <div>
              <Label htmlFor="best_rate_note">Best-rate note (booking bar and footer)</Label>
              <Input
                id="best_rate_note"
                name="best_rate_note"
                defaultValue={settings.best_rate_note}
              />
            </div>
            <div>
              <Label htmlFor="notification_email">
                Staff notification email (new bookings, inquiries, messages)
              </Label>
              <Input
                id="notification_email"
                name="notification_email"
                defaultValue={settings.notification_email}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" variant="dark">
          Save Settings
        </Button>
      </form>
    </>
  );
}
