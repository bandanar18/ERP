import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "@/features/executive/shared/store/auth.store";
import { cn } from "@/features/executive/utils/utils";
import { Button } from "@/features/executive/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/features/executive/components/ui/field";
import { Input } from "@/features/executive/components/ui/input";
import { PasswordInput } from "@/features/executive/components/ui/password-input";
import { apiUrl } from "@/features/executive/shared/api/config";

type LoginFormProps = React.ComponentProps<"div">

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      // Usamos fetch directo para login porque apiFetch incluye el token en el header (no necesario aquí, pero sirve)
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }
      
      const data = await response.json();
      setAuth(data.accessToken, data.user);
      navigate("/executive");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">¡Te damos la bienvenida!</h1>
        <p className="text-sm text-muted-foreground">
          Inicia sesión con tu cuenta corporativa
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <Button variant="outline" type="button" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Iniciar sesión con Google
            </Button>
          </Field>

          <FieldSeparator className="bg-card dark:bg-card">
            O continúa con
          </FieldSeparator>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="administrador@corp.com"
              placeholder="nombre@ejemplo.com"
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <a href="#" className="text-xs text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <PasswordInput id="password" name="password" defaultValue="Admin123!" placeholder="••••••••" required />
          </Field>

          <Field>
            <Button type="submit" className="w-full">Iniciar sesión</Button>
            <FieldDescription className="text-center">
              ¿No tienes una cuenta?{" "}
              <Link to="/executive/signup" className="underline underline-offset-4 hover:text-primary">
                Regístrate
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}