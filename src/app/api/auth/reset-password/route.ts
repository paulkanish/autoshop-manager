import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 1. Basic validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 2. Hash the incoming token to compare with the database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Find the reset record in the database
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    // 4. Validate the token (exists and is not expired)

    if (!resetRecord || resetRecord.expiresAT < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 5. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. Update the user's password and delete the used token in a single transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: hashedPassword }, // Matches your schema from the seed file
      }),
      prisma.passwordReset.delete({
        where: { id: resetRecord.id },
      }),
    ]);

    // 7. Return success
    return NextResponse.json(
      { success: true, message: 'Password reset successfully. Please log in with your new password.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
