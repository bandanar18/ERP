import * as React from "react";
import { Field, FieldError, FieldLabel } from "@/features/executive/components/ui/field";
import { Input } from "@/features/executive/components/ui/input";

interface SignupStepAccountProps {
  formData: { email: string; nombre: string; apellido: string };
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SignupStepAccount({ formData, errors, handleChange }: SignupStepAccountProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errors.nombre}>
        <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Tu nombre"
          aria-invalid={!!errors.nombre}
        />
        <FieldError>{errors.nombre}</FieldError>
      </Field>

      <Field data-invalid={!!errors.apellido}>
        <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
        <Input
          id="apellido"
          value={formData.apellido}
          onChange={handleChange}
          placeholder="Tu apellido"
          aria-invalid={!!errors.apellido}
        />
        <FieldError>{errors.apellido}</FieldError>
      </Field>

      <Field className="sm:col-span-2" data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="nombre@empresa.com"
          aria-invalid={!!errors.email}
        />
        <FieldError>{errors.email}</FieldError>
      </Field>
    </div>
  );
}
