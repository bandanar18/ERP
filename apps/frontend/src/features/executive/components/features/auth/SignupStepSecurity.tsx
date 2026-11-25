import * as React from "react";
import { Check, X } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/features/executive/components/ui/field";
import { PasswordInput } from "@/features/executive/components/ui/password-input";

interface SignupStepSecurityProps {
  formData: { password: string; confirmPassword: string };
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SignupStepSecurity({ formData, errors, handleChange }: SignupStepSecurityProps) {
  const hasConfirm = formData.confirmPassword.length > 0;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errors.password}>
        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 6 caracteres"
          aria-invalid={!!errors.password}
        />
        <FieldError>{errors.password}</FieldError>
      </Field>

      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel htmlFor="confirmPassword">Repetir contraseña</FieldLabel>
        <PasswordInput
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite la contraseña"
          aria-invalid={!!errors.confirmPassword}
        />
        {hasConfirm && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              passwordsMatch ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {passwordsMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
          </p>
        )}
        <FieldError>{errors.confirmPassword}</FieldError>
      </Field>
    </div>
  );
}
