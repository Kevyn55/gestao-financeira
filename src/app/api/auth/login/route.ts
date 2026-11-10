import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, createSessionToken, setAuthCookie, ensureDefaultAdminAndSettings } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await ensureDefaultAdminAndSettings();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique o e-mail e a senha.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique o e-mail e a senha.' },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao processar o login.' },
      { status: 500 }
    );
  }
}

