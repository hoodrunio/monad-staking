export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidatorNotFoundError extends DomainError {
  constructor(message: string = 'Validator not found') {
    super(message);
    this.name = 'ValidatorNotFoundError';
  }
}

export class NetworkNotConfiguredError extends DomainError {
  constructor(network: string) {
    super(`Network ${network} not configured`);
    this.name = 'NetworkNotConfiguredError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
