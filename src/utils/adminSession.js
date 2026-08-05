export function handleAdminSessionError(error) {
  if (error?.status !== 401) return false;
  window.location.assign('/admin/login?session=expired');
  return true;
}
