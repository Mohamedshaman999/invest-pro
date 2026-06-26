import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "./utils";
import { FuturisticGlassCheckbox } from "./FuturisticGlassCheckbox";

export type PasswordVisibilityToggleButtonProps = {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
  showPasswordAriaLabel?: string;
  hidePasswordAriaLabel?: string;
};

/** Bouton œil seul (ex. champs mot de passe « manuels » avec logique métier sur l’input) */
export function PasswordVisibilityToggleButton({
  visible,
  onToggle,
  disabled,
  showPasswordAriaLabel = "Afficher le mot de passe",
  hidePasswordAriaLabel = "Masquer le mot de passe",
}: PasswordVisibilityToggleButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={visible ? hidePasswordAriaLabel : showPasswordAriaLabel}
      aria-pressed={visible}
      className={cn(
        "absolute right-1 top-1/2 z-[1] flex h-8 w-8 min-h-[32px] min-w-[32px] -translate-y-1/2 items-center justify-center rounded-xl",
        "text-slate-400 transition-[color,background-color,box-shadow] duration-200 ease-out",
        "hover:bg-white/10 hover:text-purple-200 hover:shadow-[0_0_20px_rgba(147,51,234,0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/35",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {visible ? <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden /> : <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
    </button>
  );
}

export type GlassPasswordFieldProps = Omit<React.ComponentProps<"input">, "type"> & {
  leftIcon?: React.ReactNode;
  /** true = classes login-input / auth : padding gauche déjà géré par le thème, pas de pl-10 */
  authUnderlineStyle?: boolean;
  /** Visibilité contrôlée ; si omis, état interne par instance */
  passwordVisible?: boolean;
  onPasswordVisibleChange?: (visible: boolean) => void;
  defaultPasswordVisible?: boolean;
  /** Case futuriste optionnelle, même état que l’œil (pas de logique dupliquée) */
  showVisibilityCheckbox?: boolean;
  visibilityCheckboxLabel?: React.ReactNode;
  /** Classes sur le wrapper relatif de l’input + œil */
  fieldWrapperClassName?: string;
  showPasswordAriaLabel?: string;
  hidePasswordAriaLabel?: string;
};

/**
 * Champ mot de passe avec œil (toggle principal) et optionnellement la case futuriste partagée.
 */
export const GlassPasswordField = React.forwardRef<HTMLInputElement, GlassPasswordFieldProps>(
  function GlassPasswordField(
    {
      leftIcon,
      className,
      passwordVisible: passwordVisibleProp,
      onPasswordVisibleChange,
      defaultPasswordVisible = false,
      showVisibilityCheckbox,
      visibilityCheckboxLabel,
      fieldWrapperClassName,
      authUnderlineStyle,
      showPasswordAriaLabel = "Afficher le mot de passe",
      hidePasswordAriaLabel = "Masquer le mot de passe",
      disabled,
      ...inputProps
    },
    ref,
  ) {
    const isControlled = passwordVisibleProp !== undefined;
    const [internalVisible, setInternalVisible] = React.useState(defaultPasswordVisible);
    const visible = isControlled ? Boolean(passwordVisibleProp) : internalVisible;

    const setVisible = React.useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setInternalVisible(next);
        }
        onPasswordVisibleChange?.(next);
      },
      [isControlled, onPasswordVisibleChange],
    );

    const toggle = React.useCallback(() => {
      if (disabled) return;
      setVisible(!visible);
    }, [disabled, setVisible, visible]);

    const inputType = visible ? "text" : "password";

    const field = (
      <div className={cn("relative", fieldWrapperClassName)}>
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-[1] flex -translate-y-1/2 [&_svg]:shrink-0">
            {leftIcon}
          </span>
        ) : null}
        <input
          {...inputProps}
          ref={ref}
          type={inputType}
          disabled={disabled}
          data-ip-pw-toggle=""
          className={cn(leftIcon && !authUnderlineStyle && "pl-10 sm:pl-10", className)}
        />
        <PasswordVisibilityToggleButton
          visible={visible}
          onToggle={toggle}
          disabled={disabled}
          showPasswordAriaLabel={showPasswordAriaLabel}
          hidePasswordAriaLabel={hidePasswordAriaLabel}
        />
      </div>
    );

    if (!showVisibilityCheckbox) {
      return field;
    }

    return (
      <div className="space-y-2">
        {field}
        <div className="flex items-center gap-3">
          <FuturisticGlassCheckbox
            checked={visible}
            onChange={(v) => !disabled && setVisible(v)}
            disabled={disabled}
            aria-label={visible ? hidePasswordAriaLabel : showPasswordAriaLabel}
          />
          {visibilityCheckboxLabel ? (
            <span className="text-sm text-slate-400 transition-colors duration-200">{visibilityCheckboxLabel}</span>
          ) : null}
        </div>
      </div>
    );
  },
);
