export function generateUserId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `LTX-${year}-${randomNum}`;
}

export function generateWalletId(userId: string): string {
  return `WAL-${userId}`;
}

export async function generateUniqueUserId(checkExists: (id: string) => Promise<boolean>): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const userId = generateUserId();
    const exists = await checkExists(userId);
    
    if (!exists) {
      return userId;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique user ID after maximum attempts');
}
