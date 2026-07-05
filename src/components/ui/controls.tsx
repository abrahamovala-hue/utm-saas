// Componentes base do design system — sem hooks, funcionam em
// Server e Client Components. Toda tela bebe daqui.

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  LabelHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-forest-500 text-white hover:bg-forest-600 active:bg-forest-700 shadow-sm",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink-faint hover:bg-porcelain",
  ghost: "text-ink-soft hover:bg-porcelain hover:text-ink",
  danger: "text-wine-600 hover:bg-wine-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors duration-200 hover:border-ink-faint focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full cursor-pointer rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors duration-200 hover:border-ink-faint focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 ${className}`}
      {...props}
    />
  );
}

export function Label({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-sm font-medium text-ink ${className}`}
      {...props}
    />
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-ink-faint">{children}</p>;
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-wine-50 bg-wine-50 px-3.5 py-2.5 text-sm text-wine-600"
    >
      {children}
    </p>
  );
}
