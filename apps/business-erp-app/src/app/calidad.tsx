import { ModuleScreen } from '@/components/module-screen';
import { Palette } from '@/constants/theme';

export default function CalidadScreen() {
  return (
    <ModuleScreen
      kicker="Módulo 02 · Operación"
      title="Calidad"
      copy="Indicadores, mediciones y reportes en un solo lugar para controlar tus procesos. Esta pantalla del módulo móvil está en construcción."
      accent={Palette.pink}
    />
  );
}
