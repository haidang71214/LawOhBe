import { DeleteStatusFilter, PaginatedDataDto } from 'libs/dto/pagination.dto';

export function getDeletedFilter(
  status?: DeleteStatusFilter | string,
): Record<string, any> {
  if (
    status === DeleteStatusFilter.DELETED ||
    status === 'deleted' ||
    status === 'true'
  ) {
    return { isDeleted: true };
  }
  if (status === DeleteStatusFilter.ALL || status === 'all') {
    return { isDeleted: { $in: [true, false, null] } };
  }
  // Default: active (chưa delete)
  return { isDeleted: { $ne: true } };
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10,
): PaginatedDataDto<T> {
  return new PaginatedDataDto<T>(data, total, Number(page), Number(limit));
}
