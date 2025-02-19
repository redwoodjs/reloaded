import { defineScript } from "@redwoodjs/sdk/worker";
import { db, setupDb } from "../db";

export default defineScript(async ({ env }) => {
  setupDb(env);

  await db.$executeRawUnsafe(`\
    DELETE FROM User;
    DELETE FROM sqlite_sequence;
  `);

  await db.user.create({
    data: {
      id: '1',
      email: "amy@redwoodjs.com",
    },
  });

  console.log("🌱 Finished seeding");
});
