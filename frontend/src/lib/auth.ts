import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "insecure_dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export { JWT_SECRET, JWT_EXPIRES_IN };

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
