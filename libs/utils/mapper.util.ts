import { ClassConstructor, plainToInstance } from 'class-transformer';

export function toDto<T, V>(cls: ClassConstructor<T>, plain: V): T {
  const plainObject =
    plain && typeof (plain as any).toObject === 'function'
      ? (plain as any).toObject({ virtuals: true })
      : plain;

  return plainToInstance(cls, plainObject, {
    excludeExtraneousValues: false,
  });
}

export function toDtoList<T, V>(cls: ClassConstructor<T>, plainList: V[]): T[] {
  if (!Array.isArray(plainList)) {
    return [];
  }
  return plainList.map((item) => toDto(cls, item));
}
