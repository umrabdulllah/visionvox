export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
  
  export function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  } 