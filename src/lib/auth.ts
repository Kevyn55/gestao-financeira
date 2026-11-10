import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gestao-financeira-secret-key-super-segura-2026'
);

const TOKEN_COOKIE_NAME = 'auth_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const user = await verifySessionToken(token);
    return user;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Ensures at least one admin user and default system settings exist in the database.
 */
export async function ensureDefaultAdminAndSettings() {
  try {
    // 1. Check/create default system settings
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      await prisma.systemSetting.create({
        data: {
          id: 'default',
          systemName: 'Gestão Financeira & Dívidas',
          creditorName: 'Gestor Financeiro Principal',
          creditorPixKey: 'financeiro@empresa.com.br',
          creditorPixType: 'EMAIL',
          defaultAmortization: 'INTEREST_FIRST',
          defaultInterestType: 'COMPOUND',
          incompleteMonthRule: 'PRO_RATA',
        },
      });
    }

    // 2. Check/create default admin user
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await hashPassword('admin123');
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@gestao.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring default admin/settings:', error);
  }
}

