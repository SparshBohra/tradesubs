export function log(message: string, data?: any) {
    if (data) {
      console.log(`[Karma Street] ${message}`, data);
    } else {
      console.log(`[Karma Street] ${message}`);
    }
  }
  