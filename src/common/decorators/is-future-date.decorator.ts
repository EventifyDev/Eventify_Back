import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Date must be in the future',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          const now = new Date();
          const dateToValidate = new Date(value);
          return dateToValidate > now;
        },
      },
    });
  };
}
