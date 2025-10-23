// prisma/seed.ts
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma(); // <-- inside the handler
async function main() {
  const code = "DEFAULT";
  const exists = await prisma.scenario.findUnique({ where: { code } });
  if (!exists) {
    await prisma.scenario.create({
      data: {
        name: "Sanitize Input",
        description:
          "Fix the function so it sanitizes user input to avoid XSS. Use sanitize() or escapeHtml().",
        sessionDurationSec: 60, // 1 minute
        task: `function inputData(input){\n  return input;\n}`,
        customRules: [],
        penalties: [
          {
            title: "Violation",
            law: "General",
            consequence: "You failed to meet the requirements.",
          },
        ] as any,
        code, // shareable code used by the launch menu
      },
    });
    console.log("Seeded default scenario:", code);
  } else {
    console.log("Default scenario already present.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
