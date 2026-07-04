"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertRoomType } from "@/app/admin/(dashboard)/rooms/actions";

export type RoomTypeFormData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  sizeSqm: number;
  bedConfig: string;
  view: string;
  maxGuests: number;
  baseRateEuros: number;
  images: string[];
  amenities: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
};

export function RoomTypeDialog({
  roomType,
  triggerLabel,
  triggerVariant = "light",
}: {
  roomType?: RoomTypeFormData;
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
      <DialogContent
        title={roomType ? `Edit ${roomType.name}` : "New room type"}
        className="max-w-2xl"
      >
        <form action={upsertRoomType} className="space-y-4">
          {roomType && <input type="hidden" name="id" value={roomType.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rt-name">Name</Label>
              <Input id="rt-name" name="name" defaultValue={roomType?.name} required />
            </div>
            <div>
              <Label htmlFor="rt-slug">URL slug</Label>
              <Input
                id="rt-slug"
                name="slug"
                defaultValue={roomType?.slug}
                placeholder="left empty: made from the name"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="rt-short">Short description (cards and search results)</Label>
              <Input
                id="rt-short"
                name="shortDescription"
                defaultValue={roomType?.shortDescription}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="rt-desc">
                Full description (blank line between paragraphs)
              </Label>
              <Textarea
                id="rt-desc"
                name="description"
                rows={5}
                defaultValue={roomType?.description}
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-size">Size (square meters)</Label>
              <Input
                id="rt-size"
                name="sizeSqm"
                type="number"
                min={5}
                defaultValue={roomType?.sizeSqm}
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-bed">Bed configuration</Label>
              <Input
                id="rt-bed"
                name="bedConfig"
                defaultValue={roomType?.bedConfig}
                placeholder="King bed"
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-view">View</Label>
              <Input
                id="rt-view"
                name="view"
                defaultValue={roomType?.view}
                placeholder="Forest view"
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-guests">Sleeps up to</Label>
              <Input
                id="rt-guests"
                name="maxGuests"
                type="number"
                min={1}
                max={8}
                defaultValue={roomType?.maxGuests ?? 2}
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-rate">Base rate (EUR per night)</Label>
              <Input
                id="rt-rate"
                name="baseRate"
                type="number"
                min={0}
                step="0.01"
                defaultValue={roomType?.baseRateEuros}
                required
              />
            </div>
            <div>
              <Label htmlFor="rt-sort">Sort order</Label>
              <Input
                id="rt-sort"
                name="sortOrder"
                type="number"
                defaultValue={roomType?.sortOrder ?? 0}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="rt-images">Image URLs (one per line, first is the cover)</Label>
              <Textarea
                id="rt-images"
                name="images"
                rows={3}
                defaultValue={roomType?.images.join("\n")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="rt-amenities">Amenities (one per line)</Label>
              <Textarea
                id="rt-amenities"
                name="amenities"
                rows={4}
                defaultValue={roomType?.amenities.join("\n")}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={roomType?.featured}
                className="h-4 w-4"
              />
              Featured on the homepage
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="active"
                defaultChecked={roomType?.active ?? true}
                className="h-4 w-4"
              />
              Bookable (active)
            </label>
          </div>
          <Button type="submit" variant="dark">
            Save Room Type
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
