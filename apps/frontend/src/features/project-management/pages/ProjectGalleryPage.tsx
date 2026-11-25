import { useParams, Link } from "react-router-dom";
import { FolderOpen, ChevronLeft } from "lucide-react";
import { FileGallery } from "../components";
import { usePermission } from "../hooks/usePermission";
import { PmAppShell } from "../components/PmAppShell";
import { ErpPageHeader } from "../components/ErpPageHeader";

export function ProjectGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { canUploadGallery } = usePermission();

  if (!id) {
    return <div>Proyecto no encontrado</div>;
  }

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <Link to={`/project-management/detalle/${id}`} className="font-semibold text-[#858178] transition-colors hover:text-[#b9561d]">
            Proyecto
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Galería de Archivos</strong>
        </>
      }
    >
      <ErpPageHeader
        eyebrow="Archivos / Galería"
        title="Documentos y Archivos"
        copy="Gestioná todos los archivos adjuntos, planos, contratos y fotos del proyecto."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex min-h-10 items-center justify-center gap-[6px] rounded-lg border border-[#d8d0c4] bg-[#fffdf9] px-4 text-[11px] font-bold text-[#4e5558] transition-colors hover:border-[#b9561d] hover:text-[#111416] sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
            <div className="grid size-10 place-items-center rounded-lg bg-[#5e8fc2]/10">
              <FolderOpen className="h-5 w-5 text-[#5e8fc2]" />
            </div>
          </div>
        }
      />

      <FileGallery
        entityType="Project"
        entityId={id}
        readonly={!canUploadGallery}
      />
    </PmAppShell>
  );
}
