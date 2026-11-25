"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/features/executive/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/features/executive/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/executive/components/ui/popover";
import { cn } from "../../utils/utils";

export type IndicatorOption = {
  id: string;
  code: string;
  name: string;
  process: {
    id: string;
    name: string;
    code: string;
  };
};

export type IndicatorComboboxProps = {
  indicators: IndicatorOption[];
  value?: string;
  onChange: (indicatorId: string) => void;
  disabled?: boolean;
};

export function IndicatorCombobox({
  indicators,
  value,
  onChange,
  disabled = false,
}: IndicatorComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selected = indicators.find((item) => item.id === value);

  const grouped = React.useMemo(() => {
    return indicators.reduce<Record<string, IndicatorOption[]>>(
      (groups, indicator) => {
        const processName = indicator.process?.name || "Sin proceso";

        if (!groups[processName]) groups[processName] = [];
        groups[processName].push(indicator);

        return groups;
      },
      {},
    );
  }, [indicators]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-background font-normal sm:w-[420px]"
        >
          <span className="truncate">
            {value === "GENERAL"
              ? "General (Promedio Consolidado)"
              : selected
                ? `${selected.process?.name || 'S/P'} — ${selected.name}`
                : "Seleccionar indicador"}
          </span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(420px,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Buscar proceso, indicador o código..."
          />

          <CommandList className="max-h-[350px]">
            <CommandEmpty>No se encontraron indicadores.</CommandEmpty>

            <CommandGroup heading="Consolidado">
              <CommandItem
                value="GENERAL General Promedio Consolidado"
                onSelect={() => {
                  onChange("GENERAL");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "GENERAL" ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 truncate font-semibold">General (Promedio Consolidado)</span>
              </CommandItem>
            </CommandGroup>

            {Object.entries(grouped).map(([processName, items]) => (
              <CommandGroup key={processName} heading={processName}>
                {items.map((indicator) => (
                  <CommandItem
                    key={indicator.id}
                    value={`${indicator.process?.name || ''} ${indicator.code} ${indicator.name}`}
                    onSelect={() => {
                      onChange(indicator.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === indicator.id ? "opacity-100" : "opacity-0",
                      )}
                    />

                    <span className="min-w-0 truncate">
                      {indicator.name}
                    </span>

                    <span className="ml-auto pl-3 font-mono text-xs text-muted-foreground">
                      {indicator.code}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
