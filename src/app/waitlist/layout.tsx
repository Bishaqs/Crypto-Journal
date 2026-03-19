export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f5] font-sans" data-theme="obsidian">
      {children}
    </div>
  );
}
