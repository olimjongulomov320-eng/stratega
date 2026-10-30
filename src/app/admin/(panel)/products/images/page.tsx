import { requirePage } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import BulkImageUploader from "./uploader";

export default async function ProductImagesPage() {
  await requirePage("products.write");
  const [total, withoutPhoto] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({ where: { imageUrl: null }, select: { sku: true, name: true }, orderBy: { sku: "asc" }, take: 500 }),
  ]);
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Rasmlarni yuklash"
        description="Ko'p rasmni birdaniga yuklang: har bir fayl nomi mahsulot SKU si bo'lsin."
        back={{ href: "/admin/products", label: "Mahsulotlar" }}
      />
      <Card>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li><b>XS-1218.jpg</b> → SKU &quot;XS-1218&quot; mahsulotning asosiy rasmi bo&apos;ladi (eskisi almashtiriladi).</li>
          <li><b>XS-1218__2.jpg</b>, <b>XS-1218__3.jpg</b> → shu mahsulotga qo&apos;shimcha rasmlar.</li>
          <li>PNG, JPG, WEBP yoki AVIF, har biri 8MB gacha. Papkadagi barcha rasmlarni bir vaqtda tanlash mumkin.</li>
        </ul>
        <BulkImageUploader />
      </Card>
      <Card className="mt-4" title={`Rasmsiz mahsulotlar: ${withoutPhoto.length} / ${total}`}>
        {withoutPhoto.length === 0 ? (
          <p className="text-sm text-slate-500">Barcha mahsulotlarda rasm bor.</p>
        ) : (
          <p className="max-h-60 overflow-auto font-mono text-xs leading-6 text-slate-600">
            {withoutPhoto.map((p) => p.sku ?? p.name).join(", ")}
          </p>
        )}
      </Card>
    </div>
  );
}
