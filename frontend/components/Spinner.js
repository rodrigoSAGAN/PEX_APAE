// Spinner de carregamento reutilizável.
// Uso: <Spinner message="Carregando..." color="blue" size="md" py="py-16" />

export default function Spinner({ message, color = "blue", size = "md", py = "py-16" }) {
  const sizes = {
    sm: "w-8 h-8 border-4",
    md: "w-10 h-10 border-4",
    lg: "w-20 h-20 border-4",
  };
  const colors = {
    blue: "border-blue-200 border-t-blue-600",
    emerald: "border-emerald-200 border-t-emerald-600",
  };
  return (
    <div className={`flex flex-col items-center justify-center ${py} gap-3`}>
      <div
        className={`${sizes[size]} rounded-full animate-spin ${colors[color] ?? colors.blue}`}
        aria-hidden="true"
      />
      {message && <p className="text-slate-400 text-sm">{message}</p>}
    </div>
  );
}
