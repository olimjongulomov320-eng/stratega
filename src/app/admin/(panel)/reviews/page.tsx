import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Table, Td, Badge, Card, Field, inputCls } from "@/components/admin/ui";
import { ActionForm, ActionButton, Submit } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { addReview, toggleReview } from "./actions";

export default async function ReviewsPage() {
  await requirePage("products.write");
  const [reviews, products] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Sharhlar" description="Faqat haqiqiy mijozlarning sharhlari. Tasdiqlangan sharhlar saytda va Google'da (yulduzchalar) ko'rinadi." />
      <Card title="Mijoz sharhini qo'shish" className="mb-6">
        <ActionForm action={addReview} resetOnSuccess className="grid gap-3 sm:grid-cols-4">
          <Field label="Mahsulot" className="sm:col-span-2">
            <select name="productId" required className={inputCls}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </Field>
          <Field label="Muallif (ism)"><input name="authorName" required className={inputCls} /></Field>
          <Field label="Kompaniya"><input name="company" className={inputCls} /></Field>
          <Field label="Baho (1–5)"><input name="rating" type="number" min={1} max={5} defaultValue={5} className={inputCls} /></Field>
          <Field label="Sharh matni" className="sm:col-span-3"><input name="comment" required className={inputCls} /></Field>
          <div className="sm:col-span-4"><Submit size="sm">Qo&apos;shish</Submit> <span className="ml-2 text-xs text-slate-400">Mijozning roziligi bilan va uning so&apos;zlarini o&apos;zgartirmasdan kiriting.</span></div>
        </ActionForm>
      </Card>
      <Table head={["Sana", "Mahsulot", "Muallif", "Baho", "Sharh", "Holat", ""]} empty="Sharhlar yo'q.">
        {reviews.map((r) => (
          <tr key={r.id}>
            <Td className="text-xs">{formatDate(r.createdAt)}</Td>
            <Td>{r.product.name}</Td>
            <Td>{r.authorName}{r.company ? `, ${r.company}` : ""}</Td>
            <Td>{"★".repeat(r.rating)}</Td>
            <Td className="max-w-xs">{r.comment}</Td>
            <Td>{r.isApproved ? <Badge tone="green">Saytda</Badge> : <Badge>Yashirin</Badge>}</Td>
            <Td right>
              <div className="flex justify-end gap-1">
                <ActionButton action={toggleReview} fields={{ id: r.id, do: r.isApproved ? "hide" : "approve" }}>{r.isApproved ? "Yashirish" : "Tasdiqlash"}</ActionButton>
                <ActionButton action={toggleReview} fields={{ id: r.id, do: "delete" }} variant="danger" confirm="O'chirasizmi?">✕</ActionButton>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
