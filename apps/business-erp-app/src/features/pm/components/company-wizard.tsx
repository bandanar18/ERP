import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '../theme';
import { PmButton, PmField, PmScreenError } from './auth-ui';
import { UploadIcon, XIcon } from './icons';
import type { CreateCompanyDto } from '../types';

const STEPS = ['Identificación', 'Contacto'] as const;

interface CompanyWizardProps {
  loading: boolean;
  error: string | null;
  /** Recibe el payload + el archivo de logo seleccionado (si hay). */
  onSubmit: (payload: CreateCompanyDto, logo?: File | null) => void;
}

/**
 * Asistente paso a paso para crear una empresa (espeja CreateCompanyView web):
 * 1) identificación (nombre, razón social, tax id), 2) contacto (dirección,
 * teléfono, email) + revisión y crear.
 */
export function CompanyWizard({ loading, error, onSubmit }: CompanyWizardProps) {
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const pickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLogoFile(asset.file || { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'image/jpeg' });
        setLogoPreview(asset.uri);
        setFieldError(null);
      }
    } catch (error) {
      setFieldError('Error al seleccionar el logo.');
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!name.trim()) return 'El nombre de la empresa es obligatorio';
      return null;
    }
    if (s === 1) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El email no es válido';
      return null;
    }
    return null;
  };

  const goNext = () => {
    setFieldError(null);
    const problem = validateStep(step);
    if (problem) {
      setFieldError(problem);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => {
    setFieldError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    setFieldError(null);
    const problem = validateStep(1);
    if (problem) {
      setFieldError(problem);
      return;
    }
    const fullAddress = [address.trim(), city.trim(), state.trim(), postalCode.trim()]
      .filter(Boolean)
      .join(', ');

    const payload: CreateCompanyDto = {
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: fullAddress || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };
    onSubmit(payload, logoFile);
  };

  return (
    <View>
      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <View key={label} style={styles.stepCol}>
              <View style={[styles.stepSegment, active && styles.stepSegmentActive, done && styles.stepSegmentDone]}>
                {done ? <Text style={styles.stepCheck}>✓</Text> : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.stepCount}>Paso {step + 1} de {STEPS.length}</Text>

      {/* Paso 1: identificación */}
      {step === 0 ? (
        <View>
          <PmField
            label="Nombre de la empresa"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Constructora Andina S.A."
          />
          <PmField
            label="Razón social"
            value={legalName}
            onChangeText={setLegalName}
            placeholder="Opcional — razón social legal"
          />
          <PmField
            label="RIF / Cédula fiscal"
            value={taxId}
            onChangeText={setTaxId}
            placeholder="Ej: J-12345678-9"
            autoCapitalize="characters"
          />

          {/* Logo de la empresa */}
          <View style={styles.logoBox}>
            <Text style={styles.logoLabel}>Logo de la empresa</Text>
            {logoPreview ? (
              <View style={styles.logoPreviewRow}>
                <Image source={{ uri: logoPreview }} style={styles.logoPreview} resizeMode="contain" />
                <Pressable
                  style={({ pressed }) => [styles.logoRemove, pressed && styles.pressed]}
                  onPress={removeLogo}
                  hitSlop={8}>
                  <XIcon size={14} color={PmColors.orangeDeep} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.logoPick, pressed && styles.pressed]}
                onPress={pickLogo}>
                <UploadIcon size={16} color={PmColors.orangeDeep} />
                <Text style={styles.logoPickText}>Seleccionar logo</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {/* Paso 2: contacto + revisión */}
      {step === 1 ? (
        <View>
          <PmField
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            placeholder="Ej: Calle Los Olivos, Edificio A"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PmField
                label="Ciudad"
                value={city}
                onChangeText={setCity}
                placeholder="Ej: Caracas"
              />
            </View>
            <View style={{ flex: 1 }}>
              <PmField
                label="Estado / Prov."
                value={state}
                onChangeText={setState}
                placeholder="Ej: Distrito Capital"
              />
            </View>
          </View>
          <PmField
            label="Código Postal"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Ej: 1010"
            keyboardType="number-pad"
          />
          <PmField
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="Opcional — Ej: +51 999 888 777"
            keyboardType="phone-pad"
          />
          <PmField
            label="Email de contacto"
            value={email}
            onChangeText={setEmail}
            placeholder="Opcional — correo de la empresa"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            {[
              ['Nombre', name],
              ['Razón social', legalName || '—'],
              ['Tax ID', taxId || '—'],
              ['Dirección', address || '—'],
              ['Teléfono', phone || '—'],
              ['Email', email || '—'],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {value}
                </Text>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Logo</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {logoFile ? logoFile.name : '—'}
              </Text>
            </View>
          </View>
          <View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 16 }}>
              <Pressable style={({ pressed }) => [styles.navBtn, styles.navBtnBack, pressed && styles.pressed]} onPress={goBack}>
                <Text style={styles.navBtnBackText}>← Atrás</Text>
              </Pressable>
            </View>
            <PmScreenError message={fieldError ?? error} />
            <PmButton label="Crear empresa" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      ) : null}

      {/* Navegación del asistente */}
      {step < 1 ? (
        <View style={styles.nav}>
          <Pressable style={({ pressed }) => [styles.navBtn, styles.navBtnNext, pressed && styles.pressed]} onPress={goNext}>
            <Text style={styles.navBtnNextText}>Siguiente →</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepSegment: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  stepSegmentActive: {
    borderColor: PmColors.orange,
    backgroundColor: PmColors.orange,
  },
  stepSegmentDone: {
    borderColor: '#4c9b7a',
    backgroundColor: '#4c9b7a',
  },
  stepNum: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  stepNumActive: {
    color: '#ffffff',
  },
  stepCheck: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
  stepLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
    marginTop: 4,
  },
  stepLabelActive: {
    color: PmColors.orangeDeep,
  },
  stepCount: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmColors.inkSoft,
    marginBottom: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  summary: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
    padding: 12,
  },
  summaryTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  logoBox: {
    marginTop: 12,
    marginBottom: 4,
  },
  logoLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
    marginBottom: 6,
  },
  logoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPreview: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  logoRemove: {
    borderWidth: 1,
    borderColor: PmColors.rule,
    padding: 6,
  },
  logoPick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PmColors.orange,
    backgroundColor: PmColors.surface,
    paddingVertical: 12,
  },
  logoPickText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: PmColors.divider,
  },
  summaryLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmColors.inkSoft,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmColors.ink,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  navBtnNext: {
    borderColor: PmColors.orange,
    backgroundColor: PmColors.orange,
  },
  navBtnNextText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
  navBtnBack: {
    borderColor: PmColors.rule,
    backgroundColor: '#ffffff',
  },
  navBtnBackText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.ink,
  },
});