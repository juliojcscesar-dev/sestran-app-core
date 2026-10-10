import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const convidarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ email: z.string().trim().email().max(254), origem: z.string().url() }))
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "ADMINISTRADOR" });
    const { data: perfil } = await context.supabase.from("profiles").select("ativo").eq("user_id", context.userId).single();
    if (error || !admin || !perfil?.ativo) throw new Error("Somente administradores podem convidar usuários.");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origem = request.headers.get("origin");
    if (!origem || new URL(data.origem).origin !== new URL(origem).origin) throw new Error("Origem do convite inválida.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: conviteErro } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${new URL(origem).origin}/definir-senha`,
    });
    if (conviteErro) throw new Error("Não foi possível enviar o convite. Verifique se esse e-mail já possui uma conta.");
    return { enviado: true };
  });