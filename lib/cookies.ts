export function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}
export function getCookie(name: string) {
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]+)`)
  );
  return m ? decodeURIComponent(m[1]) : "";
}
