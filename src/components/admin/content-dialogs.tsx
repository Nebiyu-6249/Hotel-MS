"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertGalleryImage,
  upsertPackage,
} from "@/app/admin/(dashboard)/content/actions";

export type PackageFormData = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  inclusions: string[];
  priceEuros: number;
  priceNote: string;
  image: string;
  active: boolean;
  sortOrder: number;
};

export function PackageDialog({
  pack,
  triggerLabel,
  triggerVariant = "light",
}: {
  pack?: PackageFormData;
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
      <DialogContent title={pack ? `Edit ${pack.name}` : "New package"} className="max-w-xl">
        <form action={upsertPackage} className="space-y-4">
          {pack && <input type="hidden" name="id" value={pack.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pk-name">Name</Label>
              <Input id="pk-name" name="name" defaultValue={pack?.name} required />
            </div>
            <div>
              <Label htmlFor="pk-tagline">Tagline</Label>
              <Input id="pk-tagline" name="tagline" defaultValue={pack?.tagline} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pk-desc">Description</Label>
              <Textarea
                id="pk-desc"
                name="description"
                rows={3}
                defaultValue={pack?.description}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pk-inc">Inclusions (one per line)</Label>
              <Textarea
                id="pk-inc"
                name="inclusions"
                rows={4}
                defaultValue={pack?.inclusions.join("\n")}
              />
            </div>
            <div>
              <Label htmlFor="pk-price">Price (EUR)</Label>
              <Input
                id="pk-price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={pack?.priceEuros}
                required
              />
            </div>
            <div>
              <Label htmlFor="pk-note">Price note</Label>
              <Input
                id="pk-note"
                name="priceNote"
                defaultValue={pack?.priceNote}
                placeholder="per night for two"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pk-image">Image URL</Label>
              <Input id="pk-image" name="image" defaultValue={pack?.image} required />
            </div>
            <div>
              <Label htmlFor="pk-sort">Sort order</Label>
              <Input
                id="pk-sort"
                name="sortOrder"
                type="number"
                defaultValue={pack?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={pack?.active ?? true}
              className="h-4 w-4"
            />
            Shown on the offers page
          </label>
          <Button type="submit" variant="dark">
            Save Package
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type GalleryFormData = {
  id: string;
  url: string;
  alt: string;
  category: "ROOMS" | "GROUNDS" | "DINING" | "EVENTS";
  sortOrder: number;
  active: boolean;
};

export function GalleryDialog({
  image,
  triggerLabel,
  triggerVariant = "light",
}: {
  image?: GalleryFormData;
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
      <DialogContent title={image ? "Edit gallery image" : "Add gallery image"}>
        <form action={upsertGalleryImage} className="space-y-4">
          {image && <input type="hidden" name="id" value={image.id} />}
          <div>
            <Label htmlFor="gl-url">Image URL</Label>
            <Input id="gl-url" name="url" defaultValue={image?.url} required />
          </div>
          <div>
            <Label htmlFor="gl-alt">Alt text (describe the photo plainly)</Label>
            <Input id="gl-alt" name="alt" defaultValue={image?.alt} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gl-cat">Category</Label>
              <Select id="gl-cat" name="category" defaultValue={image?.category ?? "ROOMS"}>
                <option value="ROOMS">Rooms</option>
                <option value="GROUNDS">Grounds</option>
                <option value="DINING">Dining</option>
                <option value="EVENTS">Events</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="gl-sort">Sort order</Label>
              <Input
                id="gl-sort"
                name="sortOrder"
                type="number"
                defaultValue={image?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={image?.active ?? true}
              className="h-4 w-4"
            />
            Visible in the gallery
          </label>
          <Button type="submit" variant="dark">
            Save Image
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
