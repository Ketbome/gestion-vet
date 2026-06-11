import type { Metadata } from "next";
import { createProduct } from "@/lib/actions/products";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/inventario/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NuevoProductoPage() {
  return (
    <>
      <PageHeader title="Nuevo producto" />
      <ProductForm action={createProduct} />
    </>
  );
}
