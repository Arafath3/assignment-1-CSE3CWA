Live site: http://54.208.20.245/

Default Scenario Code: G8842KV
Student ID: 22035298

This project is a Next.js app that simulates a timed “court room” coding exercise. Students edit only the allowed blocks, pass checks, and avoid escalating “penalties”.

✨ Features

App Router (Next.js 15) + TypeScript

Prisma ORM (PostgreSQL), optional Prisma Accelerate

Tailwind + shadcn/ui styling

Sticky footer with copyright & student ID

Pages:

/ – Home

/about – About + embedded walkthrough video

/court-room – Menu

/court-room/play?code=<SCENARIO_CODE> – Play a scenario

/court-room/customize – Create your own scenario

🔗 Quick Start (Live Site)

Open: http://54.208.20.245/

To play the default scenario:
http://54.208.20.245/court-room/play?code=G8842KV

To create a scenario:
http://54.208.20.245/court-room/customize

(Save → copy the generated code → play with /court-room/play?code=YOUR_CODE)

🛠 Local Development

Prereqs: Node 18+ or 20, npm, a Postgres database URL.

Clone & install:

npm ci

Configure env (dev) in .env (one KEY=VALUE per line):

DIRECT_DATABASE_URL=postgres://USER:PASS@HOST:5432/DB?schema=public

# Optional (if you use Prisma Accelerate):

ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY

# If you embed a walkthrough video on /about:

# NEXT_PUBLIC_YT_ID=YOUR_YOUTUBE_VIDEO_ID

Generate client & run dev:

npx prisma generate
npm run dev

Open http://localhost:3000

🐳 Run with Docker (locally)

Build:

docker build -t myapp:local .

Run (maps port 3000 → 3000):

# put the same envs you used in dev into .env.docker (no quotes)

docker run --rm --name myapp -p 3000:3000 --env-file .env.docker myapp:local

☁️ Deploy on AWS EC2 (what this project uses)

On the EC2 instance, put a runtime env file next to the app (no quotes):

cat > .env.production <<'EOF'
NODE_ENV=production
DIRECT_DATABASE_URL=postgres://USER:PASS@HOST:5432/DB?schema=public

# Optional:

ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY

# NEXT_PUBLIC_YT_ID=YOUR_YOUTUBE_VIDEO_ID

EOF

Build and run the container (port 80 → 3000):

docker build -t myapp:v1 .
docker rm -f myapp 2>/dev/null || true
docker run -d --name myapp \
 -p 80:3000 \
 --env-file .env.production \
 --restart unless-stopped \
 myapp:v1

In the EC2 Security Group, allow HTTP (80) from your IP (or 0.0.0.0/0 for public).

Tip: each code change → rebuild with a new tag (v2, v3…), stop & re-run the container with the new tag.

How to Use the App
Play an existing scenario

Go to /court-room → Play, or visit directly:
/court-room/play?code=G8842KV

The timer starts when you hit Start (or Resume).

Edit only inside the Editable Areas (UI shows their names and line ranges).

Click Run Checks; fix issues if warnings appear.

Finish before time’s up to avoid “court”.

Create your own scenario

Visit /court-room/customize.

Paste starter code and wrap the editable area:

function inputSanitization(input) {
// #patch sanitize
return input; // student must change inside this block
// #endpatch
}

(Optional) Add rules (creator-only DSL) and ambient messages.

Save → copy the generated scenario code.

Play it at /court-room/play?code=YOUR_CODE.

⚙️ Environment Variables
Name Required Description
DIRECT_DATABASE_URL ✔ Postgres “Any Client” URL (Prisma datasource)
ACCELERATE_URL optional Prisma Accelerate URL (if enabled)
NEXT_PUBLIC_YT_ID optional YouTube video ID for About page embed

No quotes in --env-file. Keep secrets out of Git (ensure .gitignore has .env\*).

🗄 Prisma & Database

Schema lives in prisma/schema.prisma.

Migrations run automatically at container start (guarded in the Dockerfile).

In code, Prisma is lazy-initialized with getPrisma() so build doesn’t require envs.

🧭 Project Structure (high level)
src/
app/
about/page.tsx
court-room/
page.tsx
play/page.tsx
customize/CustomizeClient.tsx
components/
NavBar/
Footer/
...
prisma/
schema.prisma
public/
...
Dockerfile

🛡 Troubleshooting

Cannot access site externally → open Security Group inbound HTTP (80).

Prisma env error at runtime → check .env.production lines are KEY=value, no stray text.

Build fails: “Cannot find module server.js” → set output: "standalone" in next.config.ts and rebuild.

Forbidden IAM actions → if you can’t attach a role, build on EC2 (as done here) instead of pulling from ECR.

🧾 Footer & About

Footer shows © YEAR <Your Name>. Student ID: 22035298.
(Set your name in components/Footer/Footer.tsx or where it’s consumed.)

About page can embed a walkthrough video. Set NEXT_PUBLIC_YT_ID in envs, or hard-code the ID in app/about/page.tsx.

✅ Marking Guide (how to verify quickly)

Visit Home: http://54.208.20.245/

Visit About and confirm video is visible.

Open /court-room (menu)

Play default scenario:
http://54.208.20.245/court-room/play?code=**G8842KV
\*\*

Confirm:

Timer runs and can be paused/resumed

Editable Areas list shows named blocks and “Jump to edit” works

“Run Checks” to validate; warnings show & clear as code is fixed

Footer present on all pages with Student ID 22035298

License

For assignment submission only.
