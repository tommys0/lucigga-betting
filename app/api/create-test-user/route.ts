// app/api/create-test-user/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function GET() { // Changed to GET for simplicity
  try {
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const newUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      },
    });

    return NextResponse.json({ user: newUser, message: 'Test user created successfully' });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
  }
}
