import { PageTransition } from "@/components/layout/PageTransition";

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition variant="admin">{children}</PageTransition>;
}
