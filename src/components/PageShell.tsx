import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { HEADER_OFFSET_CLASS } from "@/lib/layout";

export default function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className={`min-h-[100svh] bg-bg ${HEADER_OFFSET_CLASS}`}>
        {children}
      </main>
      <Footer />
    </>
  );
}
