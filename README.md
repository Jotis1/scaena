# Scaena

La app de la suite jotis.me para el canal de Twitch [jotis1](https://twitch.tv/jotis1): overlays para OBS, el estudio donde se configuran y la web pública del canal en [scaena.jotis.me](https://scaena.jotis.me).

Está hecha con el sistema de diseño [Regula](https://regula.jotis.me) (`@jotis-me/react`) y sigue su guía. El plan completo vive en `openspec/changes/create-scaena/`.

## Pila

- Next.js 16 (App Router), React 19 y Tailwind v4.
- [better-auth](https://www.better-auth.com) con Twitch para el estudio, sobre Prisma 7 y Postgres (Neon en producción).
- Upstash Redis para eventos y cachés.
- Bun para todo y Biome para formato y lint. Vitest y Playwright para los tests.

## Desarrollo

Requiere [Bun](https://bun.sh).

```sh
bun install                              # también genera el cliente de Prisma
cp .env.example .env                     # y rellénalo
bunx prisma dev --name scaena --db-port 51214 --shadow-db-port 51215 --detach   # Postgres local
bunx prisma migrate dev                  # aplica las migraciones
bun run dev                              # http://localhost:3000
```

Con esos puertos, las URL de `.env` son `postgres://postgres:postgres@localhost:51214/template1?sslmode=disable` (`DATABASE_URL`) y la misma con el puerto `51215` (`SHADOW_DATABASE_URL`). `prisma dev` solo tiene la base `template1`, y `migrate dev` necesita su base auxiliar aparte.

| Comando                | Qué hace                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `bun run lint`         | Biome (formato y lint)                                                              |
| `bun run format`       | Formatea con Biome                                                                  |
| `bun run check:colors` | Falla si hay colores fuera de los tokens de Regula                                  |
| `bun run typecheck`    | Tipos                                                                               |
| `bun run test`         | Tests unitarios (Vitest)                                                            |
| `bun run test:e2e`     | Tests en navegador (Playwright; la primera vez, `bunx playwright install chromium`) |
| `bun run ci`           | Todo lo anterior, salvo Playwright, y el build                                      |

Si cambias la configuración de better-auth, regenera sus modelos y crea la migración:

```sh
bunx @better-auth/cli generate --config scripts/better-auth.config.ts --output prisma/schema.prisma
bunx prisma migrate dev
```

### Conviene saber

- **El Postgres local de `prisma dev` corre en segundo plano.** Tras reiniciar el equipo, vuelve a arrancarlo con el mismo comando de arriba (`bunx prisma dev --name scaena … --detach`). `bunx prisma dev ls` dice si está en marcha.
- **Los tests de navegador usan su propio Postgres, uno de verdad.** El estudio se prueba con sesiones reales de better-auth. El de `prisma dev` (PGlite) no sirve: solo aguanta una conexión y se queda colgado cuando Playwright cierra el servidor. Con Docker, la primera vez:

  ```sh
  docker run -d --name scaena-e2e-db -p 54329:5432 -e POSTGRES_PASSWORD=postgres postgres:17
  DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres bunx prisma migrate deploy
  ```

  Es la URL por defecto de los tests. Con otro Postgres, pon la suya en `E2E_DATABASE_URL` (así va en CI). Si aun así usas un `prisma dev` aparte, lanza Playwright con `--workers=1` y vuelve a crearlo cuando se cuelgue. Redis, Twitch y YouTube se simulan; el Redis falso está en `e2e/fake-redis.ts`.
- **El banner de las redes es `public/banner.png`.** Si cambia el perfil, expórtalo otra vez en `/studio/assets` y sustitúyelo.
- **Después de `bun run test:e2e`, ejecuta `bun run build` antes de probar en local.** Playwright construye la app con el chat de Twitch apuntando a un servidor falso (`NEXT_PUBLIC_TWITCH_IRC_URL`). En Vercel no pasa, porque allí siempre se construye de cero.

## Despliegue en Vercel

1. Crea la app en la [consola de Twitch](https://dev.twitch.tv/console/apps) con la redirección `https://scaena.jotis.me/api/auth/callback/twitch`.
2. Desde el Marketplace de Vercel, añade Upstash Redis y Neon Postgres, y crea la clave de YouTube Data API v3.
3. Rellena en Vercel las variables de `.env.example`.
4. Usa Bun como gestor de instalación y añade `bunx prisma migrate deploy` antes del build.
5. Despliega, apunta `scaena.jotis.me`, entra en `/studio/login` con Twitch y conecta los eventos en `/studio/connection`.
