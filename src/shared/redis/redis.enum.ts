/**
 * Redis Key Prefixes & Enum Definitions
 */
export enum ERedisKeyPrefix {
  // Auth
  AUTH_OTP = 'auth:otp',
  AUTH_RESET_TOKEN = 'auth:reset',
  AUTH_SESSION = 'auth:session',

  // Lawyer
  LAWYER_LIST = 'cache:lawyers:list',
  LAWYER_DETAIL = 'cache:lawyers:detail',
  LAWYER_PATTERN = 'cache:lawyers:*',

  // Price Range
  PRICE_RANGE_ALL = 'cache:price_range:all',
  PRICE_RANGE_TYPE = 'cache:price_range',
  PRICE_RANGE_PATTERN = 'cache:price_range:*',

  // Learn Package
  LEARN_PACKAGE_LIST = 'cache:learn_packages',
  LEARN_PACKAGE_DETAIL = 'cache:learn_packages:detail',
  LEARN_PACKAGE_PATTERN = 'cache:learn_packages:*',

  // News
  NEWS_PUBLIC = 'cache:news:public',
  NEWS_DETAIL = 'cache:news:detail',
  NEWS_PATTERN = 'cache:news:*',

  // Video
  VIDEO_PUBLIC = 'cache:videos:public',
  VIDEO_DETAIL = 'cache:videos:detail',
  VIDEO_PATTERN = 'cache:videos:*',

  // Users
  USER_LIST = 'cache:users:list',
  USER_DETAIL = 'cache:users:detail',
  USER_PATTERN = 'cache:users:*',

  // Reviews
  REVIEW_LAWYER = 'cache:reviews',
  REVIEW_PATTERN = 'cache:reviews:*',

  // Form
  FORM_LIST = 'cache:forms:list',
  FORM_DETAIL = 'cache:forms:detail',
  FORM_PATTERN = 'cache:forms:*',

  // Classification
  CLASSIFICATION_CATEGORIES = 'cache:classification:categories',
  CLASSIFICATION_TEXT = 'cache:classification:predict',
  CLASSIFICATION_PATTERN = 'cache:classification:*',

  // Payment
  PAYMENT_PATTERN = 'cache:payments:*',

  // Notification
  NOTIFICATION_LIST = 'cache:notifications:list',
  NOTIFICATION_UNREAD = 'cache:notifications:unread',
  NOTIFICATION_PATTERN = 'cache:notifications:*',

  // Lock
  BOOKING_LOCK = 'lock:booking',
}

/**
 * Standard Redis Key Generator Helpers
 */
export const REDIS_KEYS = {
  // Auth & OTP
  EMAIL_OTP: (email: string) => `${ERedisKeyPrefix.AUTH_OTP}:${email}`,
  RESET_PASSWORD_TOKEN: (token: string) =>
    `${ERedisKeyPrefix.AUTH_RESET_TOKEN}:${token}`,
  USER_SESSION: (userId: string) => `${ERedisKeyPrefix.AUTH_SESSION}:${userId}`,

  // Lawyer
  LAWYER_LIST: (params: string) => `${ERedisKeyPrefix.LAWYER_LIST}:${params}`,
  LAWYER_DETAIL: (id: string) => `${ERedisKeyPrefix.LAWYER_DETAIL}:${id}`,

  // Price Range
  PRICE_RANGE_ALL: ERedisKeyPrefix.PRICE_RANGE_ALL,
  PRICE_RANGE_BY_TYPE: (type: string) =>
    `${ERedisKeyPrefix.PRICE_RANGE_TYPE}:${type}`,

  // Learn Package
  LEARN_PACKAGE_LIST: (params: string) =>
    `${ERedisKeyPrefix.LEARN_PACKAGE_LIST}:${params}`,
  LEARN_PACKAGE_DETAIL: (id: string) =>
    `${ERedisKeyPrefix.LEARN_PACKAGE_DETAIL}:${id}`,

  // News
  PUBLIC_NEWS: (params: string) => `${ERedisKeyPrefix.NEWS_PUBLIC}:${params}`,
  NEWS_DETAIL: (id: string) => `${ERedisKeyPrefix.NEWS_DETAIL}:${id}`,

  // Video
  PUBLIC_VIDEOS: (params: string) =>
    `${ERedisKeyPrefix.VIDEO_PUBLIC}:${params}`,
  VIDEO_DETAIL: (id: string) => `${ERedisKeyPrefix.VIDEO_DETAIL}:${id}`,

  // Users
  USER_LIST: (params: string) => `${ERedisKeyPrefix.USER_LIST}:${params}`,
  USER_DETAIL: (id: string) => `${ERedisKeyPrefix.USER_DETAIL}:${id}`,

  // Review
  REVIEWS_BY_LAWYER: (lawyerId: string, params: string) =>
    `${ERedisKeyPrefix.REVIEW_LAWYER}:${lawyerId}:${params}`,
  REVIEWS_LAWYER_PATTERN: (lawyerId: string) =>
    `${ERedisKeyPrefix.REVIEW_LAWYER}:${lawyerId}:*`,

  // Form
  FORM_LIST: (params: string) => `${ERedisKeyPrefix.FORM_LIST}:${params}`,
  FORM_DETAIL: (id: string) => `${ERedisKeyPrefix.FORM_DETAIL}:${id}`,

  // Notification
  NOTIFICATIONS_BY_USER: (userId: string, params: string) =>
    `${ERedisKeyPrefix.NOTIFICATION_LIST}:${userId}:${params}`,
  NOTIFICATION_UNREAD: (userId: string) =>
    `${ERedisKeyPrefix.NOTIFICATION_UNREAD}:${userId}`,

  // Classification
  CLASSIFICATION_CATEGORIES: ERedisKeyPrefix.CLASSIFICATION_CATEGORIES,
  CLASSIFICATION_TEXT: (text: string) =>
    `${ERedisKeyPrefix.CLASSIFICATION_TEXT}:${text}`,

  // Distributed Locks
  BOOKING_LOCK: (lawyerId: string, startTime: string) =>
    `${ERedisKeyPrefix.BOOKING_LOCK}:${lawyerId}:${startTime}`,
};

export const REDIS_PATTERNS = {
  LAWYERS: ERedisKeyPrefix.LAWYER_PATTERN,
  PRICE_RANGES: ERedisKeyPrefix.PRICE_RANGE_PATTERN,
  LEARN_PACKAGES: ERedisKeyPrefix.LEARN_PACKAGE_PATTERN,
  NEWS: ERedisKeyPrefix.NEWS_PATTERN,
  VIDEOS: ERedisKeyPrefix.VIDEO_PATTERN,
  USERS: ERedisKeyPrefix.USER_PATTERN,
  REVIEWS: ERedisKeyPrefix.REVIEW_PATTERN,
  FORMS: ERedisKeyPrefix.FORM_PATTERN,
  CLASSIFICATION: ERedisKeyPrefix.CLASSIFICATION_PATTERN,
  PAYMENTS: ERedisKeyPrefix.PAYMENT_PATTERN,
  NOTIFICATIONS: ERedisKeyPrefix.NOTIFICATION_PATTERN,
};

export const REDIS_TTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
};
