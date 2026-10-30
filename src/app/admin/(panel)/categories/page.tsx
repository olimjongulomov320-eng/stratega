import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, LinkButton } from "@/components/admin/ui";

export default async function CategoriesPage() {
  const session = await requirePage("products.read");
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div>
      <PageHeader title="Kategoriyalar" description={`${categories.length} ta kategoriya`} actions={can(session.role, "products.write") && <LinkButton href="/admin/categories/new">+ Yangi kategoriya</LinkButton>} />
      <Table head={["Kategoriya", "Slug", "Tarjimalar", "Tartib", "Mahsulotlar", "Holat"]}>
        {categories.map((c) => (
          <tr key={c.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/categories/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.icon} {c.name}</Link></Td>
            <Td className="font-mono text-xs">{c.slug}</Td>
            <Td>{c.nameRu ? <Badge tone="green">RU</Badge> : <Badge tone="amber">RU yo&apos;q</Badge>} {c.nameEn ? <Badge tone="green">EN</Badge> : <Badge>EN yo&apos;q</Badge>}</Td>
            <Td right>{c.sortOrder}</Td>
            <Td right><Link href={`/admin/products?category=${c.id}`} className="text-indigo-600">{c._count.products} ta →</Link></Td>
            <Td>{c.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Yashirin</Badge>}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
