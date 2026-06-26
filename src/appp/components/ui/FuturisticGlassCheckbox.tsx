import "./FuturisticGlassCheckbox.css";

export type FuturisticGlassCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/**
 * Case à cocher futuriste réutilisable (structure HTML fournie : label.container + input + div.checkmark).
 */
export function FuturisticGlassCheckbox({
  checked,
  onChange,
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: FuturisticGlassCheckboxProps) {
  return (
    <span className={`futuristicGlassCheckboxHost inline-flex shrink-0 items-center ${className ?? ""}`}>
      <label className="container">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
        />
        <div className="checkmark" />
      </label>
    </span>
  );
}
