import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Modal,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { PmApiError } from '@/features/pm/api/client';
import { galleryService } from '@/features/pm/api/gallery';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { FolderOpenIcon, Trash2Icon, UploadIcon, DownloadIcon } from '@/features/pm/components/icons';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { goBackSafe } from '@/features/pm/utils/navigation';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { GalleryFile } from '@/features/pm/types';

/* ─── Utilidades de archivo ─────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function extensionOf(file: GalleryFile): string {
  const name = file.originalName || file.fileName || '';
  const ext = name.split('.').pop()?.toUpperCase() ?? '';
  return ext.length > 0 && ext.length <= 5 ? ext : 'FILE';
}

function isImage(file: GalleryFile): boolean {
  return file.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/i.test(file.originalName || '');
}

/** Color por tipo de archivo (para la miniatura placeholder). */
function fileTypeColor(file: GalleryFile): { label: string; color: string; bg: string } {
  const ext = extensionOf(file);
  if (['PDF'].includes(ext)) return { label: ext, color: '#c85454', bg: '#fbf0ef' };
  if (['DOC', 'DOCX', 'TXT', 'RTF'].includes(ext)) return { label: ext, color: '#5e8fc2', bg: '#eef4fa' };
  if (['XLS', 'XLSX', 'CSV'].includes(ext)) return { label: ext, color: '#4c9b7a', bg: '#edf6f1' };
  if (['PPT', 'PPTX'].includes(ext)) return { label: ext, color: '#df6e84', bg: '#fbeef2' };
  if (['ZIP', 'RAR', '7Z'].includes(ext)) return { label: ext, color: '#d9772f', bg: '#fbf1e7' };
  return { label: ext, color: PmOpColors.inkSoft, bg: PmOpColors.surface2 };
}

/* ─── Categorías de subida ──────────────────────────────────────────── */

const CATEGORIES = [
  { label: 'Foto', value: 'FOTO' },
  { label: 'Documento', value: 'DOCUMENTO' },
  { label: 'Plano', value: 'PLANO' },
  { label: 'Contrato', value: 'CONTRATO' },
  { label: 'Otro', value: 'OTRO' },
] as const;

/* ─── Filtros ───────────────────────────────────────────────────────── */

type FilterKey = 'todos' | 'imagenes' | 'documentos';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'imagenes', label: 'Imágenes' },
  { key: 'documentos', label: 'Documentos' },
];

/* ─── Tile estilo Google Photos ─────────────────────────────────────── */

const TILE_GAP = 3;

interface PhotoTileProps {
  file: GalleryFile;
  width: number;
  canWrite: boolean;
  onOpen: (file: GalleryFile) => void;
  onDownload: (file: GalleryFile) => void;
  onDelete: (file: GalleryFile) => void;
}

/**
 * Tile de la grilla estilo Google Photos: la foto ocupa todo el tile (cuadrado),
 * el nombre va superpuesto abajo y las acciones (borrar) aparecen al pasar el
 * mouse en web / siempre visibles en móvil.
 */
function PhotoTile({ file, width, canWrite, onOpen, onDownload, onDelete }: PhotoTileProps) {
  const [hovered, setHovered] = useState(false);

  const type = fileTypeColor(file);
  const showThumb = isImage(file) && !!file.url;
  // En web las acciones aparecen al hacer hover; en móvil quedan siempre visibles.
  const showActions = Platform.OS === 'web' ? hovered : true;

  return (
    <Pressable
      style={({ pressed }) => [{ width }, pressed && styles.tilePressed]}
      onPress={() => onOpen(file)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}>
      <View style={styles.tile}>
        {showThumb ? (
          <Image source={{ uri: file.url }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <View style={[styles.tileImage, styles.tilePlaceholder, { backgroundColor: type.bg }]}>
            <Text style={[styles.tileExt, { color: type.color }]}>{type.label}</Text>
          </View>
        )}

        {/* Nombre superpuesto abajo (como los álbumes de Google Photos) */}
        <View style={styles.tileFooter}>
          <Text style={styles.tileName} numberOfLines={1}>
            {file.originalName || file.fileName}
          </Text>
        </View>

        {/* Acciones */}
        <View style={[styles.tileActions, { opacity: showActions ? 1 : 0 }]}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            style={({ pressed }) => [styles.tileActionBtn, pressed && styles.tilePressed]}
            hitSlop={6}>
              <DownloadIcon size={13} color="#ffffff" />
          </Pressable>
          {canWrite ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(file);
              }}
              style={({ pressed }) => [styles.tileActionBtn, pressed && styles.tilePressed]}
              hitSlop={6}>
              <Trash2Icon size={13} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Pantalla ──────────────────────────────────────────────────────── */

export default function PmGaleriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, status } = usePmAuth();
  const { canUploadGallery } = usePermission();
  const canWrite = canUploadGallery;

  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<GalleryFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    galleryService
      .getFiles('Project', id)
      .then((data) => setFiles(data.files ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
    if (status !== 'authenticated') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  /* ── Cálculos derivados ── */
  const images = useMemo(() => files.filter(isImage).length, [files]);
  const documents = files.length - images;
  const totalSize = useMemo(
    () => formatBytes(files.reduce((acc, f) => acc + (Number(f.size) || 0), 0)),
    [files],
  );

  const visibleFiles = useMemo(() => {
    const sorted = [...files].sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
    );
    if (filter === 'imagenes') return sorted.filter(isImage);
    if (filter === 'documentos') return sorted.filter((f) => !isImage(f));
    return sorted;
  }, [files, filter]);

  const cols = width >= 900 ? 5 : width >= 640 ? 4 : 3;
  const tileWidth = (width - TILE_GAP * (cols - 1)) / cols;

  /* ── Acciones ── */
  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (!id) return;
        setUploading(true);
        setError(null);
        try {
          const asset = result.assets[0];
          const fileObj = asset.file || {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType ?? 'application/octet-stream'
          };
          await galleryService.upload('Project', id, fileObj as any, {
            description: description.trim() || undefined,
            category: category ?? undefined,
          });
          setDescription('');
          setCategory(null);
          load();
        } catch (e: any) {
          setError(e instanceof PmApiError ? e.message : 'Error al subir el archivo');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      setError('Error al iniciar el selector de archivos');
    }
  };

  const openFile = (file: GalleryFile) => {
    const url = file.url ?? galleryService.downloadUrl(file.id);
    if (!url) return;
    
    if (isImage(file)) {
      setSelectedImage(url);
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      Linking.openURL(url).catch(() => setError('No se pudo abrir el archivo'));
    }
  };

  const handleDownload = async (file: GalleryFile) => {
    const url = file.url ?? galleryService.downloadUrl(file.id);
    if (!url) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || file.fileName || 'descarga';
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    } else {
      try {
        const fileUri = `${FileSystem.documentDirectory}${file.originalName || file.fileName || 'descarga'}`;
        const downloadRes = await FileSystem.downloadAsync(url, fileUri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri);
        } else {
          setError('El dispositivo no soporta compartir/guardar archivos');
        }
      } catch (e) {
        setError('No se pudo descargar el archivo');
      }
    }
  };

  const handleRemove = async (fileId: string) => {
    setError(null);
    try {
      await galleryService.remove(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al borrar el archivo');
    }
  };

  return (
    <PmAppShell title="Galería" hideTitle>
      {/* ── Cabecera ── */}
      <View style={styles.head}>
        <Pressable
          onPress={() => goBackSafe(router)}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          hitSlop={8}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Proyecto / Archivos</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Galería</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{files.length}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Documentos e imágenes del proyecto.</Text>

        {/* Tira de estadísticas */}
        <View style={styles.statsStrip}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{files.length}</Text>
            <Text style={styles.statLabel}>Archivos</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{images}</Text>
            <Text style={styles.statLabel}>Imágenes</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{documents}</Text>
            <Text style={styles.statLabel}>Documentos</Text>
          </View>
          <View style={[styles.statCell, styles.statCellLast]}>
            <Text style={styles.statValue}>{totalSize}</Text>
            <Text style={styles.statLabel}>Peso total</Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Subida (solo gestión) ── */}
      {canWrite ? (
        <View style={styles.uploadCard}>
          <View style={styles.uploadIconWrap}>
            <UploadIcon size={20} color={PmOpColors.orangeDeep} />
          </View>
          <View style={styles.uploadBody}>
            <Text style={styles.uploadTitle}>Subir archivo</Text>
            <Text style={styles.uploadCopy}>
              Imágenes, PDF, Word, Excel y archivos comprimidos.
            </Text>

            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Contrato firmado"
              placeholderTextColor={PmOpColors.placeholder}
            />

            <Text style={styles.inputLabel}>Categoría (opcional)</Text>
            <View style={styles.chipsRow}>
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(active ? null : c.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={pickAndUpload}
              disabled={uploading}
              style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}>
              {uploading ? (
                <ActivityIndicator color={PmOpColors.white} />
              ) : (
                <Text style={styles.uploadBtnText}>Seleccionar y subir archivo</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* ── Filtros ── */}
      {files.length > 0 ? (
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* ── Grilla full-bleed estilo Google Photos ── */}
      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : files.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <FolderOpenIcon size={30} color={PmOpColors.orange} />
          </View>
          <Text style={styles.emptyTitle}>Sin archivos todavía</Text>
          <Text style={styles.emptyCopy}>
            {canWrite
              ? 'Subí el primer documento o imagen del proyecto desde el botón de arriba.'
              : 'Aún no hay documentos cargados para este proyecto.'}
          </Text>
        </View>
      ) : visibleFiles.length === 0 ? (
        <Text style={styles.empty}>No hay archivos en esta categoría</Text>
      ) : (
        <View style={styles.grid}>
          {visibleFiles.map((file) => (
            <PhotoTile
              key={file.id}
              file={file}
              width={tileWidth}
              canWrite={canWrite}
              onOpen={openFile}
              onDownload={handleDownload}
              onDelete={(file) => setFileToDelete(file)}
            />
          ))}
        </View>
      )}

      {/* ── Visor de imágenes ── */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={styles.viewerClose} onPress={() => setSelectedImage(null)}>
            <Text style={styles.viewerCloseText}>Cerrar</Text>
          </Pressable>
          <View style={styles.viewerActions}>
            {canWrite && selectedImage ? (
              <Pressable
                style={styles.viewerActionBtn}
                onPress={() => {
                  const imgFile = files.find(f => f.url === selectedImage || galleryService.downloadUrl(f.id) === selectedImage);
                  if (imgFile) {
                    setSelectedImage(null);
                    setFileToDelete(imgFile);
                  }
                }}>
                <Trash2Icon size={20} color="#ffffff" />
              </Pressable>
            ) : null}
            {selectedImage ? (
              <Pressable 
                style={styles.viewerActionBtn} 
                onPress={() => {
                  const imgFile = files.find(f => f.url === selectedImage || galleryService.downloadUrl(f.id) === selectedImage);
                  if (imgFile) handleDownload(imgFile);
                }}>
                <DownloadIcon size={20} color="#ffffff" />
              </Pressable>
            ) : null}
          </View>
          <Image source={{ uri: selectedImage || undefined }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>

      {/* ── Modal de confirmación de eliminación ── */}
      <Modal
        visible={fileToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setFileToDelete(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalEyebrowRow}>
                <View style={styles.modalEyebrowAccent} />
                <Text style={styles.modalEyebrow}>Galería / Confirmación</Text>
              </View>
              <Text style={styles.modalTitle}>Eliminar Archivo</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalCopy}>
                ¿Estás seguro de que deseas eliminar este archivo? Esta acción es irreversible.
              </Text>

              {fileToDelete ? (
                <View style={styles.filePreviewBox}>
                  <Text style={styles.fileNameText} numberOfLines={2}>
                    {fileToDelete.originalName || fileToDelete.fileName}
                  </Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileMetaText}>
                      {formatBytes(Number(fileToDelete.size) || 0)}
                    </Text>
                    {fileToDelete.category ? (
                      <>
                        <Text style={styles.fileMetaDot}>•</Text>
                        <Text style={[styles.fileMetaText, styles.capitalize]}>
                          {fileToDelete.category}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                disabled={deleting}
                onPress={() => setFileToDelete(null)}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnCancel,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={deleting}
                onPress={async () => {
                  if (!fileToDelete) return;
                  try {
                    setDeleting(true);
                    await galleryService.remove(fileToDelete.id);
                    setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
                    setFileToDelete(null);
                  } catch (e) {
                    setError(e instanceof PmApiError ? e.message : 'Error al borrar el archivo');
                  } finally {
                    setDeleting(false);
                  }
                }}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnDanger,
                  pressed && styles.pressed,
                ]}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  viewerActions: {
    position: 'absolute',
    top: 40,
    right: 90,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerActionBtn: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamilies.bodyBold,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.75,
  },

  /* ── Cabecera ── */
  head: {
    marginBottom: 14,
    gap: 6,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: 0.5,
    color: PmOpColors.ink,
  },
  countBadge: {
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PmOpColors.orange,
    backgroundColor: '#fbf1e7',
  },
  countText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.orangeDeep,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },

  /* Tira de estadísticas */
  statsStrip: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: PmOpColors.rule,
    gap: 1,
  },
  statCellLast: {
    borderRightWidth: 0,
  },
  statValue: {
    fontFamily: FontFamilies.display,
    fontSize: 19,
    lineHeight: 19,
    letterSpacing: 0.5,
    color: PmOpColors.ink,
  },
  statLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },

  /* ── Error ── */
  errorBanner: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eec4c4',
    backgroundColor: '#fbf0ef',
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: '#b24545',
  },

  /* ── Subida ── */
  uploadCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PmOpColors.orangeLight,
    backgroundColor: PmOpColors.surface,
  },
  uploadIconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf1e7',
  },
  uploadBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  uploadTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  uploadCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
    marginTop: 6,
  },
  input: {
    height: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.paper,
    color: PmOpColors.ink,
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.paper,
  },
  chipActive: {
    borderColor: PmOpColors.orange,
    backgroundColor: '#fbf1e7',
  },
  chipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: PmOpColors.inkSoft,
  },
  chipTextActive: {
    color: PmOpColors.orangeDeep,
  },
  uploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    marginTop: 10,
    paddingHorizontal: 12,
    backgroundColor: PmOpColors.orange,
  },
  uploadBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: PmOpColors.white,
  },

  /* ── Filtros ── */
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  filterChipActive: {
    borderColor: PmOpColors.orange,
    backgroundColor: '#fbf1e7',
  },
  filterText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  filterTextActive: {
    color: PmOpColors.orangeDeep,
  },

  /* ── Grilla Google Photos ── */
  loader: {
    marginTop: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    // La grilla sangra hasta los bordes de la pantalla (como Google Photos).
    marginHorizontal: -18,
    marginBottom: 20,
  },
  tile: {
    position: 'relative',
    backgroundColor: PmOpColors.surface2,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.8,
  },
  tileImage: {
    width: '100%',
    aspectRatio: 1,
  },
  tilePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileExt: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  /* Nombre superpuesto abajo */
  tileFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tileName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    color: '#ffffff',
  },
  /* Acciones (hover en web, siempre en móvil) */
  tileActions: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 6,
  },
  tileActionBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  /* ── Empty ── */
  emptyWrap: {
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderStyle: 'dashed',
    backgroundColor: PmOpColors.surface,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf1e7',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  emptyCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    lineHeight: 15,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    marginTop: 24,
  },

  /* ── Modal de confirmación ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,20,22,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#d8d0c4',
    shadowColor: '#111416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d8d0c4',
  },
  modalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalEyebrowAccent: {
    width: 14,
    height: 3,
    backgroundColor: '#d9772f',
  },
  modalEyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#b9561d',
  },
  modalTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: '#111416',
  },
  modalBody: {
    padding: 16,
  },
  modalCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    lineHeight: 17,
    color: '#4e5558',
    marginBottom: 12,
  },
  filePreviewBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: 'rgba(245,240,232,0.4)',
  },
  fileNameText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#111416',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fileMetaText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  fileMetaDot: {
    fontSize: 10,
    color: '#4e5558',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  modalBtnCancel: {
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
  },
  modalBtnCancelText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#4e5558',
  },
  modalBtnDanger: {
    borderColor: '#c85454',
    backgroundColor: '#c85454',
  },
  modalBtnDangerText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
});
