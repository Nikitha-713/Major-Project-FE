const styles = {
  primary: 'bg-tide text-white hover:bg-tide-dark disabled:bg-tide/50',
  secondary: 'bg-white text-ink border border-mist hover:bg-fog disabled:text-ink/40',
  light: 'bg-white text-tide hover:bg-fog disabled:bg-white/60',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
