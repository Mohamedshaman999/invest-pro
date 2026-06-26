import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { User, Shield, Bell, Globe, Key, Lock, FileDown, Loader2 } from "lucide-react";
import { cn } from "../ui/utils";
import { GlassPasswordField, PasswordVisibilityToggleButton } from "../ui/GlassPasswordField";
import { type AppLanguage, useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";
import { ApiError, fetchUserExportDataReport } from "../../lib/api";
import { investApi } from "../../services/investApi";

const TN_NATIONAL_PLACEHOLDER = "20 000 000";

/** 8-digit national mobile: Ooredoo 2…, Tunisie Telecom 4… or 9…, Orange 5… */
const TN_NATIONAL_MOBILE_REGEX = /^[2459]\d{7}$/;

/** Keep up to 8 digits; strip optional country code on paste; first digit must be 2, 4, 5, or 9 */
function parseNationalMobileInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00216")) d = d.slice(5);
  else if (d.startsWith("216")) d = d.slice(3);
  while (d.length > 0 && !/[2459]/.test(d[0]!)) {
    d = d.slice(1);
  }
  return d.slice(0, 8);
}

function tunisianNationalFieldError(value: string): boolean {
  if (!value.length) return false;
  if (value.length !== 8) return true;
  return !TN_NATIONAL_MOBILE_REGEX.test(value);
}

type ManualPasswordFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  /** Œil à droite ; état de visibilité local à ce champ */
  visibilityToggle?: boolean;
  showPasswordAria?: string;
  hidePasswordAria?: string;
};

/**
 * Mot de passe sensible : pas d’indice `current-password` (évite suggestions du navigateur),
 * lecture seule jusqu’au focus réel pour bloquer l’injection au chargement, attributs anti-gestionnaires.
 */
function ManualPasswordField({
  id,
  name,
  value,
  onChange,
  className,
  required,
  minLength,
  disabled,
  visibilityToggle,
  showPasswordAria,
  hidePasswordAria,
}: ManualPasswordFieldProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const unlock = useCallback(() => {
    window.setTimeout(() => setUnlocked(true), 0);
  }, []);

  const onFieldBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    if (!e.currentTarget.value) setUnlocked(false);
  }, []);

  const inputEl = (
    <input
      id={id}
      name={name}
      type={isPasswordVisible ? "text" : "password"}
      value={value}
      disabled={disabled}
      required={required}
      minLength={minLength}
      className={cn(className, visibilityToggle && "relative z-0")}
      autoComplete="off"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
      data-bwignore="true"
      data-form-type="other"
      data-ip-pw-toggle={visibilityToggle ? "" : undefined}
      readOnly={!unlocked}
      onFocus={unlock}
      onPointerDown={unlock}
      onBlur={onFieldBlur}
      onChange={(ev) => onChange(ev.target.value)}
    />
  );

  if (!visibilityToggle) {
    return inputEl;
  }

  return (
    <div className="relative">
      {inputEl}
      <PasswordVisibilityToggleButton
        visible={isPasswordVisible}
        onToggle={() => setIsPasswordVisible((v) => !v)}
        disabled={disabled}
        showPasswordAriaLabel={showPasswordAria ?? undefined}
        hidePasswordAriaLabel={hidePasswordAria ?? undefined}
      />
    </div>
  );
}

export function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, text } = useLanguage();
  const isFr = language === "fr";
  const isAr = language === "ar";
  const isEs = language === "es";
  const isDe = language === "de";

  const [phone, setPhone] = useState("");
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [exportReportLoading, setExportReportLoading] = useState(false);
  const [noPortfolioExportHint, setNoPortfolioExportHint] = useState(false);

  const [pwdStep, setPwdStep] = useState<"form" | "otp">("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [passwordChangeRequestId, setPasswordChangeRequestId] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwdFormMountKey, setPwdFormMountKey] = useState(0);

  const [notifyTxn, setNotifyTxn] = useState(true);
  const [notifyPrice, setNotifyPrice] = useState(true);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  const [totpBusy, setTotpBusy] = useState(false);
  const [totpPhase, setTotpPhase] = useState<"idle" | "password" | "scan">("idle");
  const [totpCurrentPassword, setTotpCurrentPassword] = useState("");
  const [totpSetupToken, setTotpSetupToken] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpManual, setTotpManual] = useState("");
  const [totpConfirmCode, setTotpConfirmCode] = useState("");
  const [totpDisablePassword, setTotpDisablePassword] = useState("");
  /** Mot de passe de désactivation : visible seulement après clic sur « Désactiver ». */
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  /** Mot de passe saisi à l’étape 1 du setup, réutilisé pour verify-setup puis effacé (champ masqué à l’étape QR). */
  const totpSetupPasswordRef = useRef("");

  const phoneInvalid = phoneBlurred && tunisianNationalFieldError(phone);

  const onPhoneBlur = useCallback(() => {
    setPhoneBlurred(true);
  }, []);

  const onPhoneChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPhone(parseNationalMobileInput(e.target.value));
  }, []);

  const labels = {
    profileInfo: isFr ? "Informations du profil" : isAr ? "معلومات الملف الشخصي" : isEs ? "Informacion del perfil" : isDe ? "Profilinformationen" : "Profile Information",
    fullName: isFr ? "Nom complet" : isAr ? "الاسم الكامل" : isEs ? "Nombre completo" : isDe ? "Vollstandiger Name" : "Full name",
    phone: isFr ? "Telephone" : isAr ? "الهاتف" : isEs ? "Telefono" : isDe ? "Telefon" : "Phone",
    saveChanges: isFr ? "Sauvegarder les modifications" : isAr ? "حفظ التغييرات" : isEs ? "Guardar cambios" : isDe ? "Anderungen speichern" : "Save changes",
    profileSaved:
      isFr
        ? "Profil mis a jour."
        : isAr
          ? "تم تحديث الملف الشخصي."
          : isEs
            ? "Perfil actualizado."
            : isDe
              ? "Profil aktualisiert."
              : "Profile updated.",
    profileSaveError:
      isFr
        ? "Impossible d'enregistrer le profil. Reessayez."
        : isAr
          ? "تعذر حفظ الملف الشخصي. حاول مرة أخرى."
          : isEs
            ? "No se pudo guardar el perfil. Intente de nuevo."
            : isDe
              ? "Profil konnte nicht gespeichert werden. Bitte erneut versuchen."
              : "Could not save profile. Please try again.",
    security: isFr ? "Securite" : isAr ? "الامان" : isEs ? "Seguridad" : isDe ? "Sicherheit" : "Security",
    currentPassword: isFr ? "Mot de passe actuel" : isAr ? "كلمة المرور الحالية" : isEs ? "Contrasena actual" : isDe ? "Aktuelles Passwort" : "Current password",
    newPassword: isFr ? "Nouveau mot de passe" : isAr ? "كلمة المرور الجديدة" : isEs ? "Nueva contrasena" : isDe ? "Neues Passwort" : "New password",
    confirmPassword: isFr ? "Confirmer le mot de passe" : isAr ? "تأكيد كلمة المرور" : isEs ? "Confirmar contrasena" : isDe ? "Passwort bestatigen" : "Confirm password",
    changePassword: isFr ? "Changer le mot de passe" : isAr ? "تغيير كلمة المرور" : isEs ? "Cambiar contrasena" : isDe ? "Passwort andern" : "Change password",
    twoFactor: isFr ? "Authentification a deux facteurs" : isAr ? "المصادقة الثنائية" : isEs ? "Autenticacion de dos factores" : isDe ? "Zwei-Faktor-Authentifizierung" : "Two-factor authentication",
    twoFactorDesc: isFr ? "Securisez votre compte avec 2FA" : isAr ? "قم بتأمين حسابك باستخدام المصادقة الثنائية" : isEs ? "Protege tu cuenta con 2FA" : isDe ? "Schutzen Sie Ihr Konto mit 2FA" : "Secure your account with 2FA",
    enable: isFr ? "Activer" : isAr ? "تفعيل" : isEs ? "Activar" : isDe ? "Aktivieren" : "Enable",
    checkEmailForCode:
      isFr
        ? "Consultez votre e-mail : un code de verification a ete envoye."
        : isAr
          ? "تحقق من بريدك الإلكتروني: تم إرسال رمز التحقق."
          : isEs
            ? "Revise su correo: se ha enviado un codigo de verificacion."
            : isDe
              ? "Prufen Sie Ihre E-Mail: ein Bestatigungscode wurde gesendet."
              : "Check your email for a verification code.",
    otpLabel: isFr ? "Code a 6 chiffres" : isAr ? "رمز مكون من 6 أرقام" : isEs ? "Codigo de 6 digitos" : isDe ? "6-stelliger Code" : "6-digit code",
    enterSixDigitCode:
      isFr
        ? "Saisissez le code a 6 chiffres."
        : isAr
          ? "أدخل الرمز المكوّن من 6 أرقام."
          : isEs
            ? "Introduzca el codigo de 6 digitos."
            : isDe
              ? "Bitte den 6-stelligen Code eingeben."
              : "Enter the 6-digit code.",
    confirmOtp: isFr ? "Confirmer" : isAr ? "تأكيد" : isEs ? "Confirmar" : isDe ? "Bestatigen" : "Confirm",
    cancelFlow: isFr ? "Annuler" : isAr ? "إلغاء" : isEs ? "Cancelar" : isDe ? "Abbrechen" : "Cancel",
    passwordChanged:
      isFr
        ? "Mot de passe mis a jour. Veuillez vous reconnecter."
        : isAr
          ? "تم تحديث كلمة المرور. يرجى تسجيل الدخول مرة أخرى."
          : isEs
            ? "Contrasena actualizada. Inicie sesion de nuevo."
            : isDe
              ? "Passwort aktualisiert. Bitte melden Sie sich erneut an."
              : "Password updated. Please sign in again.",
    passwordsMismatch:
      isFr
        ? "Les mots de passe ne correspondent pas."
        : isAr
          ? "كلمتا المرور غير متطابقتين."
          : isEs
            ? "Las contrasenas no coinciden."
            : isDe
              ? "Die Passworter stimmen nicht uberein."
              : "Passwords do not match.",
    restartPasswordFlow:
      isFr
        ? "Recommencez le changement de mot de passe depuis le debut."
        : isAr
          ? "أعد بدء تغيير كلمة المرور من البداية."
          : isEs
            ? "Reinicie el cambio de contrasena desde el principio."
            : isDe
              ? "Starten Sie die Passwortanderung von vorne."
              : "Start the password change from the beginning.",
    passwordPolicyHint:
      isFr
        ? "8 caracteres minimum : lettres, chiffres et au moins un symbole."
        : isAr
          ? "8 أحرف على الأقل: أحرف وأرقام ورمز واحد على الأقل."
          : isEs
            ? "Minimo 8 caracteres: letras, numeros y al menos un simbolo."
            : isDe
              ? "Mind. 8 Zeichen: Buchstaben, Ziffern und mindestens ein Sonderzeichen."
              : "At least 8 characters: letters, numbers, and one symbol.",
    showPasswordAria:
      isFr ? "Afficher le mot de passe" : isAr ? "إظهار كلمة المرور" : isEs ? "Mostrar contrasena" : isDe ? "Passwort anzeigen" : "Show password",
    hidePasswordAria:
      isFr ? "Masquer le mot de passe" : isAr ? "إخفاء كلمة المرور" : isEs ? "Ocultar contrasena" : isDe ? "Passwort ausblenden" : "Hide password",
    notifications: isFr ? "Notifications" : isAr ? "الاشعارات" : isEs ? "Notificaciones" : isDe ? "Benachrichtigungen" : "Notifications",
    priceAlerts: isFr ? "Alertes de prix" : isAr ? "تنبيهات الاسعار" : isEs ? "Alertas de precio" : isDe ? "Preisalarme" : "Price alerts",
    priceAlertsDesc:
      isFr
        ? "Recevez des alertes par email lors de variations importantes des prix"
        : isAr
          ? "استلام تنبيهات بالبريد عند تقلبات أسعار مهمة"
          : isEs
            ? "Reciba alertas por correo ante variaciones importantes de precios"
            : isDe
              ? "E-Mail-Alerts bei wichtigen Kursveranderungen erhalten"
              : "Receive email alerts when prices move significantly",
    priceAlertsHint:
      isFr
        ? "Vous serez notifié par email lorsque le prix atteint vos seuils définis."
        : isAr
          ? "سيتم إشعارك بالبريد عندما يصل السعر إلى العتبات التي حددتها."
          : isEs
            ? "Se le notificara por correo cuando el precio alcance los umbrales definidos."
            : isDe
              ? "Sie werden per E-Mail benachrichtigt, wenn der Kurs Ihre festgelegten Schwellen erreicht."
              : "You will be emailed when the price reaches your defined thresholds.",
    transactions: isFr ? "Transactions" : isAr ? "المعاملات" : isEs ? "Transacciones" : isDe ? "Transaktionen" : "Transactions",
    transactionsDesc:
      isFr
        ? "Recevez un email pour chaque transaction effectuée"
        : isAr
          ? "استلام بريد لكل معاملة تتم"
          : isEs
            ? "Reciba un correo por cada operacion realizada"
            : isDe
              ? "Erhalten Sie eine E-Mail fur jede ausgefuhrte Transaktion"
              : "Receive an email for each completed transaction",
    transactionsHint:
      isFr
        ? "Un email sera envoyé automatiquement à chaque achat ou vente."
        : isAr
          ? "يُرسل بريد تلقائياً مع كل عملية شراء أو بيع."
          : isEs
            ? "Se enviara un correo automaticamente con cada compra o venta."
            : isDe
              ? "Bei jedem Kauf oder Verkauf wird automatisch eine E-Mail gesendet."
              : "An email is sent automatically for every buy or sell.",
    api: "API",
    apiDesc: isFr ? "Integrez vos donnees financieres avec des APIs tierces." : isAr ? "ادمج بياناتك المالية مع واجهات API خارجية." : isEs ? "Integra tus datos financieros con APIs de terceros." : isDe ? "Integrieren Sie Ihre Finanzdaten mit Drittanbieter-APIs." : "Integrate your financial data with third-party APIs.",
    apiNote: isFr ? "Note : Les cles API sont chiffrees et stockees en toute securite." : isAr ? "ملاحظة: يتم تشفير مفاتيح API وتخزينها بشكل آمن." : isEs ? "Nota: las claves API se cifran y almacenan de forma segura." : isDe ? "Hinweis: API-Schlussel werden verschlusselt und sicher gespeichert." : "Note: API keys are encrypted and stored securely.",
    manageApiKeys: isFr ? "Gerer les cles API" : isAr ? "ادارة مفاتيح API" : isEs ? "Gestionar claves API" : isDe ? "API-Schlussel verwalten" : "Manage API keys",
    dataPrivacy: isFr
      ? "Donnees et confidentialite"
      : isAr
        ? "البيانات والخصوصية"
        : isEs
          ? "Datos y privacidad"
          : isDe
            ? "Daten und Datenschutz"
            : "Data & Privacy",
    exportMyDataTitle: isFr ? "Exporter mes donnees" : isAr ? "تصدير بياناتي" : isEs ? "Exportar mis datos" : isDe ? "Meine Daten exportieren" : "Export My Data",
    exportMyDataDesc:
      isFr
        ? "Telechargez un rapport d’investissement genere par l’IA a partir de votre portefeuille. Le rapport inclut l’historique complet de vos transactions (jusqu’a 500 operations recentes)."
        : isAr
          ? "حمّل تقرير استثمار مُنشأ بالذكاء الاصطناعي استنادًا إلى محفظتك. يتضمن التقرير سجل المعاملات الكامل (حتى 500 عملية أخيرة)."
          : isEs
            ? "Descarga un informe de inversion generado por IA segun tu cartera. El informe incluye el historial completo de transacciones (hasta 500 operaciones recientes)."
            : isDe
              ? "Laden Sie einen KI-generierten Anlagebericht auf Basis Ihres Portfolios herunter. Der Bericht enthalt die vollstandige Transaktionshistorie (bis zu 500 jungste Trades)."
              : "Download an AI-generated investment report based on your portfolio. The report includes your full transaction history (up to 500 recent trades).",
    generateReport: isFr ? "Generer le rapport" : isAr ? "إنشاء التقرير" : isEs ? "Generar informe" : isDe ? "Bericht erstellen" : "Generate Report",
    generatingReport:
      isFr
        ? "Generation de votre rapport financier..."
        : isAr
          ? "جاري إنشاء تقريرك المالي..."
          : isEs
            ? "Generando su informe financiero..."
            : isDe
              ? "Ihr Finanzbericht wird erstellt..."
              : "Generating your financial report...",
    noPortfolioExport:
      isFr
        ? "Aucune donnee de portefeuille disponible pour generer le rapport."
        : isAr
          ? "لا توجد بيانات محفظة لتوليد التقرير."
          : isEs
            ? "No hay datos de cartera para generar el informe."
            : isDe
              ? "Keine Portfoliodaten fur den Bericht verfugbar."
              : "No portfolio data available to generate report",
    exportFailedToast:
      isFr
        ? "Echec de la generation du rapport. Veuillez reessayer."
        : isAr
          ? "فشل إنشاء التقرير. يرجى المحاولة مرة أخرى."
          : isEs
            ? "No se pudo generar el informe. Intente de nuevo."
            : isDe
              ? "Bericht konnte nicht erstellt werden. Bitte erneut versuchen."
              : "Failed to generate report. Please try again.",
    deleteAccount: isFr ? "Supprimer mon compte" : isAr ? "حذف حسابي" : isEs ? "Eliminar mi cuenta" : isDe ? "Mein Konto loschen" : "Delete my account",
    totpEnableCta:
      isFr
        ? "Activer la 2FA (Google Authenticator)"
        : isAr
          ? "تفعيل المصادقة الثنائية (Google Authenticator)"
          : isEs
            ? "Activar 2FA (Google Authenticator)"
            : isDe
              ? "2FA aktivieren (Google Authenticator)"
              : "Enable 2FA (Google Authenticator)",
    totpDisableCta:
      isFr ? "Desactiver la 2FA" : isAr ? "تعطيل المصادقة الثنائية" : isEs ? "Desactivar 2FA" : isDe ? "2FA deaktivieren" : "Disable 2FA",
    totpActiveHint:
      isFr
        ? "La double authentification par application est activee."
        : isAr
          ? "المصادقة الثنائية عبر التطبيق مفعّلة."
          : isEs
            ? "La autenticacion en dos pasos con la app esta activa."
            : isDe
              ? "App-basierte Zwei-Faktor-Authentifizierung ist aktiv."
              : "App-based two-factor authentication is enabled.",
    totpActivePill:
      isFr ? "TOTP active" : isAr ? "TOTP مفعّل" : isEs ? "TOTP activo" : isDe ? "TOTP aktiv" : "TOTP on",
    totpPasswordPrompt:
      isFr
        ? "Saisissez votre mot de passe actuel pour preparer l’application d’authentification."
        : isAr
          ? "أدخل كلمة المرور الحالية لإعداد تطبيق المصادقة."
          : isEs
            ? "Introduce tu contrasena actual para configurar la app de autenticacion."
            : isDe
              ? "Geben Sie Ihr aktuelles Passwort ein, um die Authenticator-App einzurichten."
              : "Enter your current password to set up the authenticator app.",
    totpScanTitle:
      isFr ? "Scanner le QR code" : isAr ? "امسح رمز QR" : isEs ? "Escanee el codigo QR" : isDe ? "QR-Code scannen" : "Scan the QR code",
    totpManualLabel:
      isFr
        ? "Cle secrete (saisie manuelle)"
        : isAr
          ? "المفتاح السري (إدخال يدوي)"
          : isEs
            ? "Clave secreta (entrada manual)"
            : isDe
              ? "Geheimer Schlussel (manuelle Eingabe)"
              : "Secret key (manual entry)",
    totpCodeLabel:
      isFr
        ? "Code Google Authenticator (6 chiffres)"
        : isAr
          ? "رمز Google Authenticator (6 أرقام)"
          : isEs
            ? "Codigo de Google Authenticator (6 digitos)"
            : isDe
              ? "Google Authenticator-Code (6 Ziffern)"
              : "Google Authenticator code (6 digits)",
    totpContinue:
      isFr ? "Continuer" : isAr ? "متابعة" : isEs ? "Continuar" : isDe ? "Weiter" : "Continue",
    totpConfirmEnable:
      isFr ? "Activer la 2FA" : isAr ? "تفعيل المصادقة الثنائية" : isEs ? "Activar 2FA" : isDe ? "2FA aktivieren" : "Enable 2FA",
    totpCancel:
      isFr ? "Annuler" : isAr ? "إلغاء" : isEs ? "Cancelar" : isDe ? "Abbrechen" : "Cancel",
    totpSuccess:
      isFr
        ? "Double authentification activee."
        : isAr
          ? "تم تفعيل المصادقة الثنائية."
          : isEs
            ? "Autenticacion en dos pasos activada."
            : isDe
              ? "Zwei-Faktor-Authentifizierung aktiviert."
              : "Two-factor authentication enabled.",
    totpDisabled:
      isFr
        ? "Double authentification desactivee."
        : isAr
          ? "تم تعطيل المصادقة الثنائية."
          : isEs
            ? "Autenticacion en dos pasos desactivada."
            : isDe
              ? "Zwei-Faktor-Authentifizierung deaktiviert."
              : "Two-factor authentication disabled.",
    phoneInvalid:
      isFr
        ? "8 chiffres requis, le premier doit etre 2, 4, 5 ou 9 (ex. 20 000 000)."
        : isAr
          ? "مطلوب 8 أرقام وتبدأ بـ 2 أو 4 أو 5 أو 9 (مثال: 20 000 000)."
          : isEs
            ? "Se requieren 8 digitos; el primero debe ser 2, 4, 5 o 9 (ej. 20 000 000)."
            : isDe
              ? "8 Ziffern erforderlich; die erste muss 2, 4, 5 oder 9 sein (z. B. 20 000 000)."
              : "8 digits required; the first must be 2, 4, 5, or 9 (e.g. 20 000 000).",
  };

  const resetPasswordChangeUi = useCallback(() => {
    setPwdStep("form");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpCode("");
    setPasswordChangeRequestId("");
    setPwdFormMountKey((k) => k + 1);
  }, []);

  const onPasswordFormSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setPwBusy(true);
      try {
        const res = await investApi.requestPasswordChange({ currentPassword });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setPasswordChangeRequestId(res.requestId || "");
        setPwdFormMountKey((k) => k + 1);
        setPwdStep("otp");
        toast.success(labels.checkEmailForCode);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      } finally {
        setPwBusy(false);
      }
    },
    [currentPassword, labels.checkEmailForCode]
  );

  const onOtpSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const digits = otpCode.replace(/\D/g, "").slice(0, 6);
      if (digits.length !== 6) {
        toast.error(labels.enterSixDigitCode);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(labels.passwordsMismatch);
        return;
      }
      if (!passwordChangeRequestId.trim()) {
        toast.error(labels.restartPasswordFlow);
        return;
      }
      setPwBusy(true);
      try {
        await investApi.confirmPasswordChange({
          requestId: passwordChangeRequestId.trim(),
          code: digits,
          newPassword,
          confirmPassword,
        });
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success(labels.passwordChanged);
        logout();
        navigate("/login", { replace: true });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      } finally {
        setPwBusy(false);
      }
    },
    [
      otpCode,
      newPassword,
      confirmPassword,
      passwordChangeRequestId,
      labels.enterSixDigitCode,
      labels.passwordsMismatch,
      labels.restartPasswordFlow,
      labels.passwordChanged,
      logout,
      navigate,
    ]
  );

  useEffect(() => {
    if (!user) {
      setProfileName("");
      setProfileEmail("");
      setPhone("");
      return;
    }
    setProfileName(user.name);
    setProfileEmail(user.email);
    setPhone(user.phone ? parseNationalMobileInput(user.phone) : "");
    setPhoneBlurred(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await investApi.getNotificationPreferences();
        if (cancelled) return;
        setNotifyTxn(p.notifyTransactionEmail);
        setNotifyPrice(p.notifyPriceAlertEmail);
      } catch {
        if (cancelled) return;
        if (typeof user.notifyTransactionEmail === "boolean") setNotifyTxn(user.notifyTransactionEmail);
        if (typeof user.notifyPriceAlertEmail === "boolean") setNotifyPrice(user.notifyPriceAlertEmail);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistNotifyTxn = useCallback(
    async (checked: boolean) => {
      if (!user) return;
      const prev = notifyTxn;
      setNotifyTxn(checked);
      try {
        await investApi.patchNotificationPreferences({ notifyTransactionEmail: checked });
      } catch (err) {
        setNotifyTxn(prev);
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      }
    },
    [user, notifyTxn]
  );

  const persistNotifyPrice = useCallback(
    async (checked: boolean) => {
      if (!user) return;
      const prev = notifyPrice;
      setNotifyPrice(checked);
      try {
        await investApi.patchNotificationPreferences({ notifyPriceAlertEmail: checked });
      } catch (err) {
        setNotifyPrice(prev);
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      }
    },
    [user, notifyPrice]
  );

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    if (phone.length > 0 && tunisianNationalFieldError(phone)) {
      setPhoneBlurred(true);
      toast.error(labels.phoneInvalid);
      return;
    }
    setProfileBusy(true);
    try {
      const out = await investApi.patchUserProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: phone.trim(),
      });
      updateUser({
        name: out.name,
        email: out.email,
        phone: out.phone?.trim() || undefined,
        isVerified: out.isVerified,
        currency: out.currency,
        notifyTransactionEmail: out.notifyTransactionEmail,
        notifyPriceAlertEmail: out.notifyPriceAlertEmail,
        twoFaEnabled: out.twoFaEnabled,
        twoFaMethod: out.twoFaMethod === "totp" ? "totp" : "email",
      });
      toast.success(labels.profileSaved);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : labels.profileSaveError;
      toast.error(msg);
    } finally {
      setProfileBusy(false);
    }
  }, [
    user,
    profileName,
    profileEmail,
    phone,
    labels.phoneInvalid,
    labels.profileSaved,
    labels.profileSaveError,
    updateUser,
  ]);

  const resetTotpWizard = useCallback(() => {
    setTotpPhase("idle");
    setTotpCurrentPassword("");
    setTotpSetupToken("");
    setTotpQr("");
    setTotpManual("");
    setTotpConfirmCode("");
    setTotpDisablePassword("");
    setTotpDisableOpen(false);
    totpSetupPasswordRef.current = "";
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await investApi.getUserProfile();
        if (cancelled) return;
        updateUser({
          twoFaEnabled: p.twoFaEnabled,
          twoFaMethod: p.twoFaMethod === "totp" ? "totp" : "email",
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- synchroniser l’état 2FA au chargement
  }, [user?.id]);

  const onTotpPasswordStepSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setTotpBusy(true);
      try {
        const pwd = totpCurrentPassword;
        const res = await investApi.totpSetup({ currentPassword: pwd });
        totpSetupPasswordRef.current = pwd;
        setTotpCurrentPassword("");
        setTotpSetupToken(res.setupToken);
        setTotpQr(res.qrCodeImage);
        setTotpManual(res.manualSecret);
        setTotpConfirmCode("");
        setTotpPhase("scan");
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      } finally {
        setTotpBusy(false);
      }
    },
    [user, totpCurrentPassword]
  );

  const onTotpConfirmSetup = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!user) return;
      const digits = totpConfirmCode.replace(/\D/g, "").slice(0, 6);
      if (digits.length !== 6) {
        toast.error(labels.enterSixDigitCode);
        return;
      }
      setTotpBusy(true);
      try {
        await investApi.totpVerifySetup({
          setupToken: totpSetupToken,
          otpCode: digits,
          currentPassword: totpSetupPasswordRef.current,
        });
        updateUser({ twoFaEnabled: true, twoFaMethod: "totp" });
        toast.success(labels.totpSuccess);
        resetTotpWizard();
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Something went wrong";
        toast.error(msg);
      } finally {
        setTotpBusy(false);
      }
    },
    [
      user,
      totpConfirmCode,
      totpSetupToken,
      labels.enterSixDigitCode,
      labels.totpSuccess,
      updateUser,
      resetTotpWizard,
    ]
  );

  const onTotpDisable = useCallback(async () => {
    if (!user) return;
    setTotpBusy(true);
    try {
      await investApi.totpDisable({ currentPassword: totpDisablePassword });
      updateUser({ twoFaEnabled: false, twoFaMethod: "email" });
      toast.success(labels.totpDisabled);
      setTotpDisablePassword("");
      setTotpDisableOpen(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setTotpBusy(false);
    }
  }, [user, totpDisablePassword, labels.totpDisabled, updateUser]);

  const handleExportDataReport = useCallback(async () => {
    setNoPortfolioExportHint(false);
    setExportReportLoading(true);
    try {
      const result = await fetchUserExportDataReport();
      if (result.kind === "pdf") {
        const href = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = result.filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        return;
      }
      if (result.code === "NO_PORTFOLIO_DATA") {
        setNoPortfolioExportHint(true);
        return;
      }
      toast.error(labels.exportFailedToast);
    } catch {
      toast.error(labels.exportFailedToast);
    } finally {
      setExportReportLoading(false);
    }
  }, [labels.exportFailedToast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-ip">{text.pages.settings.title}</h1>
        <p className="text-slate-400">{text.pages.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profil utilisateur */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <User className="h-6 w-6 text-violet-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{labels.profileInfo}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">{labels.fullName}</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  autoComplete="name"
                  className="app-field"
                  disabled={!user || profileBusy}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  autoComplete="email"
                  className="app-field"
                  disabled={!user || profileBusy}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">{labels.phone}</label>
                <div
                  className={`app-field flex w-full items-stretch overflow-hidden p-0 focus-within:border-[var(--ip-border-hover)] focus-within:shadow-[0_0_0_2px_var(--ip-focus-ring)] ${
                    phoneInvalid ? "!border-rose-500/60 !shadow-[0_0_0_1px_rgb(244,63,94,0.35)]" : ""
                  }`}
                >
                  <span className="flex shrink-0 select-none items-center border-r border-[var(--ip-input-border)] px-3 py-2.5 font-mono text-sm text-slate-400">
                    +216
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={8}
                    value={phone}
                    onChange={onPhoneChange}
                    onBlur={onPhoneBlur}
                    placeholder={TN_NATIONAL_PLACEHOLDER}
                    aria-invalid={phoneInvalid}
                    disabled={!user || profileBusy}
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-4 pl-2 text-ip outline-none ring-0 placeholder:text-slate-500 focus:ring-0 disabled:opacity-60"
                  />
                </div>
                {phoneInvalid ? <p className="mt-1 text-xs text-rose-300">{labels.phoneInvalid}</p> : null}
              </div>

              <button
                type="button"
                disabled={!user || profileBusy}
                onClick={() => void handleSaveProfile()}
                className="hero-cta w-full rounded-xl py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60"
              >
                {profileBusy ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <span className="hero-cta-label">{labels.saveChanges}</span>
                )}
              </button>
            </div>
          </div>

          {/* Sécurité */}
          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20">
                <Shield className="h-6 w-6 text-fuchsia-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{labels.security}</h2>
            </div>

            <div className="space-y-4">
              {pwdStep === "form" ? (
                <form
                  key={pwdFormMountKey}
                  autoComplete="off"
                  onSubmit={onPasswordFormSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="settings-current-password" className="mb-2 block text-sm font-medium text-slate-400">
                      {labels.currentPassword}
                    </label>
                    <ManualPasswordField
                      id="settings-current-password"
                      name={`current-pw-${pwdFormMountKey}`}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      className="app-field placeholder:text-slate-500"
                      minLength={1}
                      required
                      visibilityToggle
                      showPasswordAria={labels.showPasswordAria}
                      hidePasswordAria={labels.hidePasswordAria}
                    />
                  </div>

                  <button type="submit" disabled={pwBusy} className="hero-cta w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                    {pwBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : <span className="hero-cta-label">{labels.changePassword}</span>}
                  </button>
                </form>
              ) : (
                <form autoComplete="off" onSubmit={onOtpSubmit} className="space-y-4">
                  <p className="text-sm text-slate-300">{labels.checkEmailForCode}</p>
                  <div>
                    <label htmlFor="settings-pw-otp" className="mb-2 block text-sm font-medium text-slate-400">
                      {labels.otpLabel}
                    </label>
                    <input
                      id="settings-pw-otp"
                      type="text"
                      name={`pw-otp-${pwdFormMountKey}`}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(ev) => setOtpCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="app-field font-mono tracking-widest placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">{labels.passwordPolicyHint}</p>
                  <div>
                    <label htmlFor="settings-new-password-otp" className="mb-2 block text-sm font-medium text-slate-400">
                      {labels.newPassword}
                    </label>
                    <GlassPasswordField
                      id="settings-new-password-otp"
                      name={`new-pw-otp-${pwdFormMountKey}`}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(ev) => setNewPassword(ev.target.value)}
                      placeholder="••••••••"
                      className="app-field placeholder:text-slate-500"
                      minLength={8}
                      required
                      showPasswordAriaLabel={labels.showPasswordAria}
                      hidePasswordAriaLabel={labels.hidePasswordAria}
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-confirm-password-otp" className="mb-2 block text-sm font-medium text-slate-400">
                      {labels.confirmPassword}
                    </label>
                    <GlassPasswordField
                      id="settings-confirm-password-otp"
                      name={`confirm-pw-otp-${pwdFormMountKey}`}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(ev) => setConfirmPassword(ev.target.value)}
                      placeholder="••••••••"
                      className="app-field placeholder:text-slate-500"
                      minLength={8}
                      required
                      showPasswordAriaLabel={labels.showPasswordAria}
                      hidePasswordAriaLabel={labels.hidePasswordAria}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="submit" disabled={pwBusy} className="hero-cta flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                      {pwBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : <span className="hero-cta-label">{labels.confirmOtp}</span>}
                    </button>
                    <button
                      type="button"
                      disabled={pwBusy}
                      onClick={resetPasswordChangeUi}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                    >
                      {labels.cancelFlow}
                    </button>
                  </div>
                </form>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ip">{labels.twoFactor}</p>
                    <p className="text-sm text-slate-400">{labels.twoFactorDesc}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch sm:items-end sm:pt-0.5">
                    {user?.twoFaEnabled && user?.twoFaMethod === "totp" ? (
                      <span className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200/95">
                        {labels.totpActivePill}
                      </span>
                    ) : totpPhase === "password" || totpPhase === "scan" ? (
                      <button
                        type="button"
                        disabled={totpBusy}
                        onClick={resetTotpWizard}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                      >
                        {labels.totpCancel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          totpSetupPasswordRef.current = "";
                          setTotpPhase("password");
                          setTotpCurrentPassword("");
                        }}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-medium text-slate-200 transition-colors hover:bg-white/10"
                      >
                        {labels.totpEnableCta}
                      </button>
                    )}
                  </div>
                </div>

                {user?.twoFaEnabled && user?.twoFaMethod === "totp" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-200/90">{labels.totpActiveHint}</p>
                    {!totpDisableOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTotpDisableOpen(true);
                          setTotpDisablePassword("");
                        }}
                        className="rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/25"
                      >
                        {labels.totpDisableCta}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-400" htmlFor="totp-disable-pw">
                            {labels.currentPassword}
                          </label>
                          <ManualPasswordField
                            id="totp-disable-pw"
                            name="totp-disable-current-pw"
                            value={totpDisablePassword}
                            onChange={setTotpDisablePassword}
                            className="app-field"
                            visibilityToggle
                            showPasswordAria={labels.showPasswordAria}
                            hidePasswordAria={labels.hidePasswordAria}
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            disabled={totpBusy || !totpDisablePassword}
                            onClick={() => void onTotpDisable()}
                            className="rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/25 disabled:opacity-50"
                          >
                            {totpBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : labels.totpDisableCta}
                          </button>
                          <button
                            type="button"
                            disabled={totpBusy}
                            onClick={() => {
                              setTotpDisableOpen(false);
                              setTotpDisablePassword("");
                            }}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                          >
                            {labels.totpCancel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : totpPhase === "password" ? (
                  <form autoComplete="off" onSubmit={onTotpPasswordStepSubmit} className="space-y-4">
                    <p className="text-sm text-slate-300">{labels.totpPasswordPrompt}</p>
                    <ManualPasswordField
                      id="settings-totp-current-password"
                      name="totp-setup-current-pw"
                      value={totpCurrentPassword}
                      onChange={setTotpCurrentPassword}
                      className="app-field"
                      required
                      visibilityToggle
                      showPasswordAria={labels.showPasswordAria}
                      hidePasswordAria={labels.hidePasswordAria}
                    />
                    <button
                      type="submit"
                      disabled={totpBusy}
                      className="hero-cta w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
                    >
                      {totpBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : labels.totpContinue}
                    </button>
                  </form>
                ) : totpPhase === "scan" ? (
                  <form onSubmit={onTotpConfirmSetup} className="space-y-4">
                    <p className="text-sm font-medium text-ip">{labels.totpScanTitle}</p>
                    <div className="flex justify-center rounded-xl border border-white/10 bg-black/20 p-4">
                      <img src={totpQr} alt="QR TOTP" className="h-48 w-48 max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">{labels.totpManualLabel}</p>
                      <code className="block break-all rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-slate-200">
                        {totpManual}
                      </code>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-400" htmlFor="totp-confirm-code">
                        {labels.totpCodeLabel}
                      </label>
                      <input
                        id="totp-confirm-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={totpConfirmCode}
                        onChange={(ev) => setTotpConfirmCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="app-field font-mono tracking-widest"
                        placeholder="000000"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={totpBusy}
                      className="hero-cta w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
                    >
                      {totpBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : labels.totpConfirmEnable}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <Bell className="h-6 w-6 text-emerald-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{labels.notifications}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ip">{labels.priceAlerts}</p>
                  <p className="text-sm text-slate-400">{labels.priceAlertsDesc}</p>
                  <p className="mt-1 text-xs text-slate-500" title={labels.priceAlertsHint}>
                    {labels.priceAlertsHint}
                  </p>
                </div>
                <div className="ip-checkbox-wrapper">
                  <input
                    id="settings-notify-price"
                    type="checkbox"
                    checked={notifyPrice}
                    disabled={!user}
                    onChange={(e) => void persistNotifyPrice(e.target.checked)}
                    aria-label={labels.priceAlerts}
                  />
                  <label htmlFor="settings-notify-price">
                    <div className="tick_mark" aria-hidden />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ip">{labels.transactions}</p>
                  <p className="text-sm text-slate-400">{labels.transactionsDesc}</p>
                  <p className="mt-1 text-xs text-slate-500" title={labels.transactionsHint}>
                    {labels.transactionsHint}
                  </p>
                </div>
                <div className="ip-checkbox-wrapper">
                  <input
                    id="settings-notify-txn"
                    type="checkbox"
                    checked={notifyTxn}
                    disabled={!user}
                    onChange={(e) => void persistNotifyTxn(e.target.checked)}
                    aria-label={labels.transactions}
                  />
                  <label htmlFor="settings-notify-txn">
                    <div className="tick_mark" aria-hidden />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar de paramètres */}
        <div className="space-y-6">
          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Globe className="h-6 w-6 text-amber-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{text.pages.settings.preferences}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">{text.pages.settings.language}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="app-field-select"
                >
                  <option value="fr">Francais</option>
                  <option value="en">English</option>
                  <option value="es">Espanol</option>
                  <option value="de">Deutsch</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">{text.pages.settings.currency}</label>
                <select className="app-field-select" defaultValue="tnd">
                  <option value="tnd">TND (د.ت)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">{text.pages.settings.timezone}</label>
                <select className="app-field-select">
                  <option>Europe/Paris (GMT+1)</option>
                  <option>Europe/London (GMT)</option>
                  <option>America/New_York (GMT-5)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                <Key className="h-6 w-6 text-rose-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{labels.api}</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-400">{labels.apiDesc}</p>
              
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-100/90">{labels.apiNote}</p>
              </div>

              <button
                type="button"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-2 font-medium text-slate-200 transition-colors hover:bg-white/10"
              >
                {labels.manageApiKeys}
              </button>
            </div>
          </div>

          <div className="rounded-xl ip-panel p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25">
                <Lock className="h-6 w-6 text-violet-300" />
              </div>
              <h2 className="text-xl font-bold text-ip">{labels.dataPrivacy}</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--ip-border)] bg-[var(--ip-inner-well)] p-5 shadow-sm">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ip">{labels.exportMyDataTitle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{labels.exportMyDataDesc}</p>
                  </div>
                </div>
                {exportReportLoading ? (
                  <p className="mb-4 flex items-center gap-2 text-sm text-violet-200/90">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    {labels.generatingReport}
                  </p>
                ) : null}
                {noPortfolioExportHint ? (
                  <p className="mb-4 text-sm text-amber-200/90" role="alert">
                    {labels.noPortfolioExport}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={exportReportLoading}
                  onClick={handleExportDataReport}
                  className="hero-cta flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60"
                >
                  {exportReportLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  <span className="hero-cta-label">{labels.generateReport}</span>
                </button>
              </div>

              <button
                type="button"
                className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                {labels.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}