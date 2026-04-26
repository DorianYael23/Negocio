import { redirect } from "next/navigation";

export default function RootPage() {
  // Que no quede duda: ¡A clientes!
  redirect("/clientes");
}