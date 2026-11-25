import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/executive/shared/store/auth.store";
import { cn } from "@/features/executive/utils/utils";
import { Button } from "@/features/executive/components/ui/button";

import {
  FieldDescription,
  FieldGroup,
} from "@/features/executive/components/ui/field";
import { SignupStepAccount } from "./SignupStepAccount";
import { SignupStepSecurity } from "./SignupStepSecurity";
import { apiUrl } from "@/features/executive/shared/api/config";

type SignupFormProps = React.ComponentProps<"div">;

export function SignupForm({
  className,
  ...props
}: SignupFormProps) {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [submitError, setSubmitError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateStep = (currentStep: 1 | 2): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.nombre.trim()) newErrors.nombre = "Ingresa tu nombre.";
      if (!formData.apellido.trim()) newErrors.apellido = "Ingresa tu apellido.";
      if (!formData.email.trim()) {
        newErrors.email = "Ingresa tu correo electrónico.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Correo inválido.";
      }
    } else {
      if (!formData.password) {
        newErrors.password = "Ingresa una contraseña.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mínimo 6 caracteres.";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Repite la contraseña.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validateStep(step)) setStep(2);
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep(1)) setStep(2);
      return;
    }
    if (!validateStep(2)) return;

    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Error ${response.status}`);
      }

      const data = await response.json();
      setAuth(data.accessToken, data.user);
      navigate("/executive");
    } catch (err: any) {
      setSubmitError(err.message || 'Error al crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Regístrate en simples pasos
        </p>
      </div>
      <div>
          {/* Progress bar */}
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span>{step === 1 ? "Paso 1 de 2 · Datos personales" : "Paso 2 de 2 · Credenciales"}</span>
              <span>{step} de 2</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="min-h-[200px] flex flex-col gap-4">
                {step === 1 && (
                  <SignupStepAccount
                    formData={formData}
                    errors={errors}
                    handleChange={handleChange}
                  />
                )}
                {step === 2 && (
                  <SignupStepSecurity
                    formData={formData}
                    errors={errors}
                    handleChange={handleChange}
                  />
                )}
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <div className="flex gap-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-border/50 transition-all duration-300"
                    >
                      Atrás
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm transition-all duration-300 hover:shadow-md">
                      {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Button>
                  )}
                </div>

                {submitError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="font-medium">{submitError}</span>
                  </div>
                )}

                <FieldDescription className="text-center text-xs">
                  ¿Ya tienes una cuenta?{" "}
                  <Link
                    to="/executive/login"
                    className="underline underline-offset-4 hover:text-primary font-medium transition-colors"
                  >
                    Inicia sesión
                  </Link>
                </FieldDescription>
              </div>
            </FieldGroup>
          </form>
      </div>
    </div>
  );
}
