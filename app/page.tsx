import { requireProfile } from "@/lib/auth";

export default async function Page() {
  const profile = await requireProfile();
  return (
    <main id="main" className="p-8">
      <p className="font-display text-3xl font-bold">
        yo, {profile.full_name.split(" ")[0] || "there"}
      </p>
    </main>
  );
}
