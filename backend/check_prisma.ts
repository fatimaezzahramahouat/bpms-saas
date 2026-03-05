import prisma from './src/lib/prisma';

async function check() {
  console.log('User members:', Object.keys(prisma.user));
  // @ts-ignore
  console.log('Session exists:', !!prisma.session);
  process.exit(0);
}

check();
