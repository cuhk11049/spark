export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type ApiErrorShape = {
  code: number;
  message: string;
};
