import { redirect } from "next/navigation";

// `/studio` no tiene página propia: lleva a los overlays (design.md, decisión 10).
export default function Studio() {
	redirect("/studio/overlays");
}
