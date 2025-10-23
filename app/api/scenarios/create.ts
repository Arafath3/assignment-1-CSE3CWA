import { NextApiRequest, NextApiResponse } from "next";
import { getPrisma } from "@/lib/prisma";

const generateRandomCode = () => {
  const length = 6; // Length of the random code
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = getPrisma(); // call this inside the handler/function
  if (req.method === "POST") {
    const {
      name,
      description,
      sessionDurationSec,
      task,
      customRules,
      penalties,
    } = req.body;
    const code = generateRandomCode(); // Generate the code for the scenario

    try {
      const newScenario = await prisma.scenario.create({
        data: {
          name,
          description,
          sessionDurationSec,
          task,
          customRules,
          penalties,
          code,
        },
      });

      res.status(201).json(newScenario); // Respond with the created scenario
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating scenario" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
