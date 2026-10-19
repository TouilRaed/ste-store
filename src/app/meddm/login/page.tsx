import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { hasAdminCookie, isAdminConfigured } from "@/lib/admin/auth";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Connexion" };

export default async function AdminLoginPage() {
  if (await hasAdminCookie()) redirect("/meddm");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper-deep px-4">
      <div className="bezel w-full max-w-md rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
        <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8">
          <p className="eyebrow text-ink-muted">{BRAND.NAME}</p>
          <h1 className="font-display mt-4 text-4xl leading-tight tracking-[-0.02em]">Admin</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Commandes et catalogue de la série en cours.
          </p>

          {isAdminConfigured() ? (
            <AdminLoginForm />
          ) : (
            <p className="mt-8 rounded-2xl bg-accent-soft px-4 py-3 text-sm leading-relaxed text-accent-deep">
              Admin non configuré. Définissez <code>ADMIN_PASSWORD</code> et{" "}
              <code>ADMIN_JWT_SECRET</code> dans <code>.env.local</code>, puis redémarrez le serveur.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
