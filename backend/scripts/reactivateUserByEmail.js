#!/usr/bin/env node
/**
 * Réactive un compte : annule la suppression logique (paranoid) et déverrouille le compte.
 * Usage : node scripts/reactivateUserByEmail.js <email>
 */
import "dotenv/config";
import { connectDatabase } from "../config/database.js";
import { User, sequelize } from "../models/index.js";
import { unlockUserAccount } from "../services/adminUserService.js";

async function main() {
  const raw = process.argv[2];
  const email = String(raw || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: node scripts/reactivateUserByEmail.js <email>");
    process.exit(1);
  }

  await connectDatabase();

  const user = await User.findOne({
    where: { email },
    paranoid: false,
  });

  if (!user) {
    console.error(`Aucun utilisateur pour l'e-mail : ${email}`);
    await sequelize.close();
    process.exit(1);
  }

  const wasDeleted = user.deletedAt != null;
  if (wasDeleted) {
    await user.restore();
    console.log(`Compte restauré (suppression logique annulée) : ${email}`);
  }

  await unlockUserAccount(user.id);
  if (!wasDeleted) {
    console.log(`Compte déverrouillé / réinitialisé (tentatives échouées) : ${email}`);
  } else {
    console.log(`Verrouillage et compteur de tentatives réinitialisés : ${email}`);
  }

  await sequelize.close();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e?.message || e, e?.stack || "");
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
