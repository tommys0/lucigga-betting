import { handlers } from '@/auth';

// Force Node.js runtime for bcryptjs compatibility
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
