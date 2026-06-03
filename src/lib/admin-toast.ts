import { sileo, type SileoOptions } from "sileo";

type AdminToastOptions = {
  title: string;
  description?: string;
};

function show(
  fn: (options: SileoOptions) => void,
  { title, description }: AdminToastOptions,
) {
  fn(description ? { title, description } : { title });
}

export const adminToast = {
  success(title: string, description?: string) {
    show(sileo.success, { title, description });
  },
  error(title: string, description?: string) {
    show(sileo.error, { title, description });
  },
  warning(title: string, description?: string) {
    show(sileo.warning, { title, description });
  },
  info(title: string, description?: string) {
    show(sileo.info, { title, description });
  },
};
