// lib/exceptions.ts

/**
 * Custom error class for server-side errors, typically used in API routes or server actions.
 * Includes an optional status code.
 */
export class ServerError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message); // Prosleđuje poruku standardnom Error konstruktoru
    this.name = 'ServerError'; // Postavlja ime greške
    this.statusCode = statusCode; // Postavlja status kod

    // Opcionalno: Dodaj ovo ako želiš da očuvaš ispravan stack trace
    // Error.captureStackTrace(this, ServerError);
  }
}

// Opcionalno: Odradi export i za druge klase grešaka ako ih budeš dodavao u budućnosti
// export class ValidationError extends ServerError {
//   constructor(message: string = "Validation failed", statusCode: number = 400) {
//     super(message, statusCode);
//     this.name = 'ValidationError';
//   }
// }