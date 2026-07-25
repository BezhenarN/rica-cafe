import ky, { type KyInstance } from 'ky';

/**
 * Хранилище токена в памяти + зеркало в localStorage (для persist-сессии).
 * Не используем куки/httpOnly в этой итерации — только Bearer.
 */
const TOKEN_KEY = 'crudo_token';
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== 'undefined') {
    memoryToken = window.localStorage.getItem(TOKEN_KEY);
    return memoryToken;
  }
  return null;
}

export function setToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  }
}

/** Базовый клиент. В браузере ходит через относительный путь к Next.js API Routes. */
function createClient(): KyInstance {
  // When Next.js API routes are co-located (unified deploy), use relative /api path.
  const isServer = typeof window === 'undefined';
  const apiBase = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : isServer
      ? '/api'
      : '';
  return ky.create({
    prefixUrl: apiBase,
    timeout: 15000,
    retry: { limit: 1, methods: ['get'] },
    hooks: {
      beforeRequest: [
        (request) => {
          const token = getToken();
          if (token) request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
      afterResponse: [
        async (request, _options, response) => {
          // При 401 сбрасываем токен — пусть пользователь снова войдёт.
          if (response.status === 401) {
            setToken(null);
          }
          return response;
        },
      ],
    },
  });
}

export const api = createClient();

/** Вспомогательный throw с сообщением от API (если есть). */
export async function unwrapError(err: unknown): Promise<string> {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response: Response }).response;
    try {
      const body = await resp.json();
      if (body?.message) {
        return Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
      }
    } catch {
      /* ignore */
    }
    if (resp.status === 401) return 'Неверный email или пароль';
    if (resp.status === 409) return 'Пользователь с таким email уже существует';
  }
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}
