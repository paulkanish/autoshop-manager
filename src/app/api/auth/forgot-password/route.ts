import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // 3. SECURITY: Always return success message, even if user doesn't exist
    // This prevents user enumeration attacks
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists for this email, a password reset link has been sent.'
        },
        { status: 200 }
      );
    }

    // 4. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 5. Hash the token before storing in database
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 6. Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // 7. Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // 8. Save the new reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAT: expiresAt,
      },
    });

    // 9. Send the reset email
    await sendPasswordResetEmail(user.email, resetToken);

    // 10. Return success message
    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
