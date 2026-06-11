import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, products } from "@/lib/db";
import { updateProduct } from "@/lib/actions/products";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/inventario/product-form";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)))
    .get();

  if (!product) notFound();

  return (
    <>
      <PageHeader title="Editar producto" subtitle={product.name} />
      <ProductForm
        product={product}
        action={updateProduct.bind(null, product.id)}
      />
    </>
  );
}
