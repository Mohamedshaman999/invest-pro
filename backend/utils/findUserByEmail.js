import { Sequelize } from "sequelize";
import { User } from "../models/index.js";

/**
 * Recherche insensible à la casse / espaces (plusieurs stratégies pour vieilles lignes ou migrations).
 * Attendu côté table `users` (modèle Sequelize User) : colonne `email`, et `password` pour l’auth par mot de passe.
 * @param {{ paranoid?: boolean }} [options] — `paranoid: false` inclut les utilisateurs soft-delete (seed, admin).
 */
export async function findUserByNormalizedEmail(emailNormalized, options = {}) {
  const { paranoid = true } = options;
  const key = String(emailNormalized || "").trim().toLowerCase();
  if (!key) return null;

  let u = await User.findOne({
    paranoid,
    where: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("email"))),
      key
    ),
  });
  if (u) return u;

  u = await User.findOne({
    paranoid,
    where: Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("email")), key),
  });
  if (u) return u;

  return User.findOne({ paranoid, where: { email: key } });
}
