import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi kategoriya</h1>
      <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        <CategoryForm />
      </div>
    </div>
  );
}
