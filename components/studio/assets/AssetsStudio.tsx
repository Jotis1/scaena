"use client";

import { Alert } from "@jotis-me/react";
import { useState } from "react";
import type { EditableKey, Profile } from "@/lib/profile";
import { bannerOf, panelsOf } from "@/lib/studio/panels";
import { ProfileAssets } from "../ProfileAssets";
import { ProfileEditor } from "./ProfileEditor";

const FIELD_NAMES: Record<EditableKey, string> = {
	tagline: "el lema",
	description: "la descripción",
	schedule: "el horario",
	socials: "las redes",
	rules: "las normas",
	panels: "los paneles",
	banner: "el banner",
};

/**
 * Recursos con el editor del contenido (specs/twitch-profile-assets, «Vista previa» y «Editar el contenido de los
 * recursos»): los paneles y el banner se calculan con el borrador, así que la vista previa, los PNG y el .zip salen
 * de lo que se ve, guardado o no.
 */
export function AssetsStudio({
	profile,
	base,
	invalidFields,
}: {
	profile: Profile;
	base: Profile;
	invalidFields: EditableKey[];
}) {
	const [saved, setSaved] = useState(profile);
	const [draft, setDraft] = useState(profile);
	return (
		<ProfileAssets panels={panelsOf(draft)} banner={bannerOf(draft)}>
			{invalidFields.length > 0 ? (
				<Alert
					color="warning"
					title="Hay cambios guardados que ya no valen"
					description={`${invalidFields.map((f) => FIELD_NAMES[f]).join(", ")}: se usan los del perfil del repositorio hasta que los vuelvas a guardar.`}
				/>
			) : null}
			<ProfileEditor
				draft={draft}
				saved={saved}
				base={base}
				onDraft={setDraft}
				onSaved={(p) => {
					setSaved(p);
					setDraft(p);
				}}
			/>
		</ProfileAssets>
	);
}
