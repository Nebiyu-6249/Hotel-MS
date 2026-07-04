/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/db";
import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { eur } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import {
  GalleryDialog,
  PackageDialog,
} from "@/components/admin/content-dialogs";
import { deleteGalleryImage, deletePackage } from "./actions";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  await requireStaff(MANAGEMENT);

  const [packages, gallery] = await Promise.all([
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.galleryImage.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Site content"
        description="Offers, packages and gallery images on the public site, editable without touching code."
      />

      {searchParams.saved && (
        <p className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Saved and live.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Something was missing. Check the form and try again.
        </p>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Offers and packages
          </h2>
          <PackageDialog triggerLabel="New package" triggerVariant="dark" />
        </div>
        <Table>
          <THead>
            <tr>
              <Th>Package</Th>
              <Th>Price</Th>
              <Th>Inclusions</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </THead>
          <tbody>
            {packages.map((pack) => (
              <tr key={pack.id}>
                <Td>
                  <span className="font-medium text-zinc-900">{pack.name}</span>
                  <span className="block text-[12px] text-zinc-400">
                    {pack.tagline}
                  </span>
                </Td>
                <Td>
                  {eur(pack.priceCents)}
                  <span className="block text-[12px] text-zinc-400">
                    {pack.priceNote}
                  </span>
                </Td>
                <Td>{pack.inclusions.length} items</Td>
                <Td>
                  <Badge tone={pack.active ? "green" : "neutral"}>
                    {pack.active ? "Live" : "Hidden"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <PackageDialog
                      triggerLabel="Edit"
                      pack={{
                        id: pack.id,
                        name: pack.name,
                        slug: pack.slug,
                        tagline: pack.tagline,
                        description: pack.description,
                        inclusions: pack.inclusions,
                        priceEuros: pack.priceCents / 100,
                        priceNote: pack.priceNote,
                        image: pack.image,
                        active: pack.active,
                        sortOrder: pack.sortOrder,
                      }}
                    />
                    <form action={deletePackage}>
                      <input type="hidden" name="id" value={pack.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Gallery</h2>
          <GalleryDialog triggerLabel="Add image" triggerVariant="dark" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((image) => (
            <div key={image.id} className="border border-zinc-200 bg-white">
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="space-y-2 p-3">
                <p className="line-clamp-1 text-[12px] text-zinc-600">{image.alt}</p>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{image.category.toLowerCase()}</Badge>
                  {!image.active && <Badge tone="amber">Hidden</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <GalleryDialog
                    triggerLabel="Edit"
                    image={{
                      id: image.id,
                      url: image.url,
                      alt: image.alt,
                      category: image.category,
                      sortOrder: image.sortOrder,
                      active: image.active,
                    }}
                  />
                  <form action={deleteGalleryImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
