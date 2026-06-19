import { scryptSync, timingSafeEqual } from "crypto";
import { get } from "../db/database.js";

export async function getUserByUsername(username) {
  return get(
    `SELECT id, username, name, salt, password_hash
     FROM users
     WHERE username = ?`,
    [username],
  );
}

export async function getUserById(id) {
  return get(
    `SELECT id, username, name
     FROM users
     WHERE id = ?`,
    [id],
  );
}

export function verifyPassword(password, salt, storedHash) {
  const computedHash = scryptSync(password, salt, 32);

  const storedHashBuffer = Buffer.from(storedHash, "hex");

  if (computedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedHash, storedHashBuffer);
}